/* detalle.js · popup con el detalle de cada evento
   Al tocar una tarjeta, una ventana crece desde la tarjeta hasta el centro de la pantalla (como al abrir una app en iPhone).
   - La página de atrás queda fija mientras está abierta.
   - Se cierra con la X, tocando afuera, con Esc o con "atrás" del celular.
   - Cada evento tiene su link: eventospde.com/#nombre-fecha (se puede compartir y abre directo el detalle).
   Índice: 1 Piezas · 2 Contenido · 3 Estado y animación · 4 Abrir y cerrar · 5 Eventos
   Requiere: config.js, utils.js, analytics.js, cards.js, app.js (LIVE), css/detalle.css */

(() => {
  const DUR_OPEN = 520, DUR_CLOSE = 420;               // milisegundos
  const EASE = "cubic-bezier(.32,.72,0,1)";            // curva tipo iOS: arranca rápido y frena suave
  const REDUCED = matchMedia("(prefers-reduced-motion:reduce)");

  /* ============ 1. Piezas ============ */
  const mapEmbed = url => {                            // mapa incrustado: solo si el link trae la búsqueda
    try {
      const u = new URL(url);
      const q = u.searchParams.get("query") || u.searchParams.get("q");
      return q ? "https://maps.google.com/maps?q=" + encodeURIComponent(q) + "&z=15&output=embed" : "";
    } catch (_) { return ""; }
  };

  /* Google Calendar: con hora, 3 horas de duración; sin hora ("A confirmar"), día completo */
  function calendarUrl(e) {
    const flat = iso => iso.replace(/-/g, "");
    let dates;
    if (/^\d{1,2}:\d{2}$/.test(e.time)) {
      const t0 = new Date(`${e.date}T${e.time.padStart(5, "0")}:00Z`), t1 = new Date(t0.getTime() + 3 * 36e5);
      const fmt = d => d.toISOString().slice(0, 19).replace(/[-:]/g, "");
      dates = `${fmt(t0)}/${fmt(t1)}`;               // hora local de Uruguay (ctz), sin Z
    } else dates = `${flat(e.date)}/${flat(addDays(e.endDate || e.date, 1))}`;
    const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, ctz: "America/Montevideo",
      details: `${e.desc}\n\n${shareUrl(e)}`, location: /a confirmar/i.test(e.place) ? "Punta del Este, Uruguay" : e.place });
    return "https://calendar.google.com/calendar/render?" + p;
  }

  const infoRow = (icon, label, value) =>
    `<li><span class="k-ic">${ico(icon)}</span><div><small>${label}</small><b>${esc(value)}</b></div></li>`;

  /* ============ 2. Contenido ============ */
  function detailHtml(e) {
    const t = ticketLink(e);
    const free = safeUrl(e.link);
    const contact = safeUrl(e.contact);
    const mUrl = mapUrl(e);
    const embed = mUrl ? mapEmbed(mUrl) : "";

    /* Entradas: van en una barra fija abajo de la ventana (siempre a la vista).
       Sin entradas, el botón principal es el link libre. */
    let main = "", buy = "";
    if (t) {
      buy = `<div class="dlg-buy">
        <a class="dlg-btn main" href="${esc(t.url)}" target="_blank" rel="${t.affiliate ? "sponsored noopener" : "noopener"}" ${trackAttrs(t.affiliate ? "referido" : "entradas", e)}>${ico("ticket")}Comprar entradas</a>
      </div>`;
    } else if (free) {
      main = `<a class="dlg-btn main" href="${esc(free)}" target="_blank" rel="noopener" ${trackAttrs("enlace", e)}>${ico("link")}${esc(e.linkLabel || "Más información")}</a>`;
    }
    const second = [];
    if (t && free) second.push(`<a class="dlg-btn" href="${esc(free)}" target="_blank" rel="noopener" ${trackAttrs("enlace", e)}>${ico("link")}${esc(e.linkLabel || "Más info")}</a>`);
    if (contact) {
      const label = contactLabel(contact);
      const icon = label === "WhatsApp" ? "chat" : label === "Instagram" ? "instagram" : label === "Email" ? "mail" : "link";
      second.push(`<a class="dlg-btn" href="${esc(contact)}" target="_blank" rel="noopener" ${trackAttrs("contacto", e)}>${ico(icon)}${label}</a>`);
    }
    second.push(`<a class="dlg-btn" href="${esc(calendarUrl(e))}" target="_blank" rel="noopener" ${trackAttrs("agendar", e)}>${ico("calendar")}Agendar</a>`);
    second.push(`<button type="button" class="dlg-btn" data-share>${ico("share")}Compartir</button>`);

    return `
      <div class="dlg-cover" style="--c:${CATS[e.cat]};${coverStyle(e)}">
        ${coverHtml(e)}
        <div class="k-day"><small>${monthLabel(e)}</small><b>${dayLabel(e)}</b></div>
      </div>
      <div class="dlg-body" style="--c:${CATS[e.cat]}">
        <div class="dlg-head">
          ${eyebrowHtml(e)}
          <h2 id="dlg-title">${esc(e.title)}</h2>
        </div>
        <p class="dlg-desc">${esc(e.desc)}</p>
        <ul class="dlg-info">
          ${infoRow("calendar", "Fecha", longDate(e))}
          ${infoRow("clock", "Hora", timeLabel(e))}
          ${infoRow("pin", "Lugar", e.place)}
          ${e.price ? infoRow("ticket", "Entradas (puede cambiar según el lote)", e.price) : ""}
        </ul>
        ${mUrl ? `<div class="dlg-map">${embed ? `<iframe data-src="${esc(embed)}" title="Mapa: ${esc(e.place)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ""}
          <a class="dlg-go" href="${esc(mUrl)}" target="_blank" rel="noopener" ${trackAttrs("mapa", e)}>${ico("pin")}Cómo llegar</a></div>` : ""}
        <div class="dlg-actions">
          ${main}
          <div class="${second.length > 1 ? "dlg-row" : ""}">${second.join("")}</div>
          ${t && t.affiliate ? '<p class="dlg-note">Enlace de referido: no cambia el precio.</p>' : ""}
        </div>
        <div class="dlg-svc">
          <p>¿Cómo llegás y dónde te quedás?</p>
          <div>
            <a href="servicios.html?s=traslado&amp;e=${esc(slugOf(e))}" ${trackAttrs("servicio_evento", e)}>${ico("car")}<span><b>Traslado</b><small>Chofer ida y vuelta</small></span></a>
            <a href="servicios.html?s=alojamiento&amp;e=${esc(slugOf(e))}" ${trackAttrs("servicio_evento", e)}>${ico("bed")}<span><b>Alojamiento</b><small>Para esas fechas</small></span></a>
          </div>
        </div>
      </div>
      ${buy}`;
  }

  /* ============ 3. Estado y animación ============ */
  const root = document.createElement("div");
  root.className = "dlg";
  root.id = "dlg";
  root.innerHTML = `
    <div class="dlg-back"></div>
    <div class="dlg-win" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <div class="dlg-face"></div>
      <div class="dlg-content" tabindex="-1"></div>
      <button type="button" class="dlg-x" aria-label="Cerrar">${ico("close")}</button>
      <div class="dlg-toast" role="status"></div>
    </div>`;
  document.body.appendChild(root);
  const back = root.querySelector(".dlg-back"), win = root.querySelector(".dlg-win"), face = root.querySelector(".dlg-face");
  const content = root.querySelector(".dlg-content"), xBtn = root.querySelector(".dlg-x"), toast = root.querySelector(".dlg-toast");

  const S = { open: false, busy: false, card: null, ev: null, scrollY: 0, anims: [] };

  const shareUrl = e => location.origin + "/evento/" + slugOf(e) + "/";   // la página propia del evento: al compartirla se ve el póster

  /* Rectángulo final: centrado, del alto del contenido (con tope). Deja el contenido medido y dimensionado. */
  function finalRect() {
    const vw = innerWidth, vh = innerHeight;
    const w = Math.min(parseInt(getComputedStyle(root).getPropertyValue("--dlg-width")) || 560, vw - 24);
    content.style.width = w + "px";
    content.style.height = "auto";
    const h = Math.min(content.offsetHeight, vh - 32);
    content.style.height = h + "px";
    return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h };
  }
  const px = r => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  const setWin = r => Object.assign(win.style, px(r));

  /* Fija la página de atrás en su lugar (sin saltos en iPhone) */
  function lock() {
    S.scrollY = scrollY;
    const sb = innerWidth - document.documentElement.clientWidth;
    document.body.style.top = -S.scrollY + "px";
    if (sb > 0) document.body.style.paddingRight = sb + "px";
    document.body.classList.add("dlg-open");
    document.querySelectorAll(".wrap").forEach(w => w.setAttribute("inert", ""));
  }
  function unlock() {
    document.body.classList.remove("dlg-open");
    document.body.style.top = document.body.style.paddingRight = "";
    document.querySelectorAll(".wrap").forEach(w => w.removeAttribute("inert"));
    const html = document.documentElement;
    html.style.scrollBehavior = "auto";                // el scroll suave del sitio haría que "vuelva" con animación
    scrollTo(0, S.scrollY);
    html.style.scrollBehavior = "";
  }

  const cancelAnims = () => { S.anims.forEach(a => a.cancel()); S.anims = []; };
  const run = (el, frames, opts) => { const a = el.animate(frames, { fill: "both", ...opts }); S.anims.push(a); return a; };
  const radiusOf = el => getComputedStyle(el).borderTopLeftRadius;

  /* ============ 4. Abrir y cerrar ============ */
  function open(e, card, { fromHash = false } = {}) {
    if (S.open || S.busy) return;
    S.busy = true; S.ev = e; S.card = card && document.contains(card) ? card : null;

    const rect = S.card ? S.card.getBoundingClientRect() : null;
    const useCard = rect && rect.bottom > 0 && rect.top < innerHeight;
    content.innerHTML = detailHtml(e);
    content.scrollTop = 0;
    root.classList.add("on");
    const fin = finalRect();

    /* De dónde sale: de la tarjeta; si no se ve (link directo), de un punto chico en el centro */
    const from = useCard ? rect : { left: fin.left + fin.width * .06, top: fin.top + fin.height * .06, width: fin.width * .88, height: fin.height * .88 };
    const fromRadius = useCard ? radiusOf(S.card) : getComputedStyle(root).getPropertyValue("--dlg-radius") || "30px";

    face.innerHTML = "";
    if (useCard) {
      const clone = S.card.cloneNode(true);
      clone.removeAttribute("tabindex"); clone.removeAttribute("role"); clone.removeAttribute("aria-label");
      clone.style.cssText += `;width:${rect.width}px;height:${rect.height}px;margin:0;aspect-ratio:auto;transition:none;transform:none`;
      face.appendChild(clone);
    }

    lock();
    S.card && (S.card.style.visibility = "hidden");
    S.open = true;
    if (!fromHash) history.pushState({ dlg: slugOf(e) }, "", "#" + slugOf(e));
    if (typeof track === "function") track("ver_evento", { evento: e.title, categoria: e.cat });

    cancelAnims();
    const d = REDUCED.matches ? 1 : DUR_OPEN;
    let finished = false;
    const finish = () => {
      if (finished || !S.open) return;
      finished = true;
      cancelAnims();
      setWin(finalRect()); win.style.borderRadius = "";      // se mide de nuevo: la pantalla pudo cambiar durante la animación
      content.style.width = "100%";                           // de acá en más el contenido sigue a la ventana (nunca queda más ancho)
      face.style.display = "none"; content.style.opacity = ""; back.style.opacity = 1; xBtn.style.opacity = "";
      root.querySelectorAll("iframe[data-src]").forEach(f => { f.src = f.dataset.src; f.removeAttribute("data-src"); });
      S.busy = false;
      content.focus({ preventScroll: true });
    };
    face.style.display = "";
    run(win, [{ ...px(from), borderRadius: fromRadius }, { ...px(fin), borderRadius: getComputedStyle(root).getPropertyValue("--dlg-radius") || "30px" }], { duration: d, easing: EASE });
    run(back, [{ opacity: 0 }, { opacity: 1 }], { duration: d * .8, easing: "ease-out" });
    run(face, [{ opacity: 1 }, { opacity: 0 }], { duration: d * .5, easing: "ease-out" });
    run(content, [{ opacity: 0 }, { opacity: 0, offset: .3 }, { opacity: 1 }], { duration: d, easing: "linear" });
    run(xBtn, [{ opacity: 0 }, { opacity: 0, offset: .5 }, { opacity: 1 }], { duration: d, easing: "linear" })
      .onfinish = finish;
    if (d === 1) finish();
    else setTimeout(finish, d + 250);                         // por las dudas: si el navegador frenó la animación, igual queda en su tamaño final
  }

  function closeAnim() {
    if (!S.open || S.busy) return;
    S.busy = true;
    const card = S.card && document.contains(S.card) ? S.card : null;
    const rect = card ? card.getBoundingClientRect() : null;
    const useCard = rect && rect.bottom > 0 && rect.top < innerHeight;
    const cur = win.getBoundingClientRect();
    const to = useCard ? rect : { left: cur.left + cur.width * .06, top: cur.top + cur.height * .06, width: cur.width * .88, height: cur.height * .88 };
    const toRadius = useCard ? radiusOf(card) : "30px";
    const d = REDUCED.matches ? 1 : DUR_CLOSE;

    root.querySelectorAll("iframe").forEach(f => f.remove());
    cancelAnims();
    face.style.display = useCard ? "" : "none";
    const done = () => {
      cancelAnims();
      root.classList.remove("on");
      win.style.cssText = ""; back.style.opacity = "";
      content.innerHTML = ""; face.innerHTML = "";
      unlock();
      if (card) { card.style.visibility = ""; card.focus({ preventScroll: true }); }
      S.open = false; S.busy = false; S.card = S.ev = null;
    };
    run(win, [{ ...px(cur), borderRadius: getComputedStyle(root).getPropertyValue("--dlg-radius") || "30px" }, { ...px(to), borderRadius: toRadius }], { duration: d, easing: EASE });
    run(back, [{ opacity: 1 }, { opacity: 0 }], { duration: d, easing: "ease-in" });
    run(face, [{ opacity: 0 }, { opacity: 0, offset: .35 }, { opacity: 1 }], { duration: d, easing: "linear" });
    run(content, [{ opacity: 1 }, { opacity: 0 }], { duration: d * .45, easing: "ease-in" });
    run(xBtn, [{ opacity: 1 }, { opacity: 0 }], { duration: d * .3 }).onfinish = done;
    if (d === 1) done();
  }

  /* Cerrar desde la interfaz: vuelve atrás en el historial y de ahí se anima el cierre */
  function requestClose() {
    if (!S.open || S.busy) return;
    if (history.state && history.state.dlg) history.back(); else closeAnim();
  }

  function share() {
    const e = S.ev; if (!e) return;
    const url = shareUrl(e);
    if (navigator.share) { navigator.share({ title: e.title, text: `${e.title} · ${longDate(e)}`, url }).catch(() => {}); return; }
    const done = () => { toast.textContent = "Link copiado"; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1800); };
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(done, () => prompt("Copiá el link:", url));
  }

  /* ============ 5. Eventos ============ */
  const byId = id => LIVE.find(e => slugOf(e) === id);

  /* Para abrir un detalle desde otras vistas (el mapa): sale de la tarjeta si se ve; si no, del centro */
  window.openEvent = id => {
    const e = byId(id);
    if (e) open(e, document.querySelector(`#grid .card[data-id="${CSS.escape(id)}"]`));
  };

  document.addEventListener("click", ev => {
    if (ev.target.closest(".dlg")) {
      if (ev.target === back) requestClose();
      else if (ev.target.closest(".dlg-x")) requestClose();
      else if (ev.target.closest("[data-share]")) share();
      return;
    }
    const card = ev.target.closest(".card[data-id],.slide[data-id]");
    if (!card) return;
    /* El título de la tarjeta es un link a la página del evento: con Ctrl/Cmd/Shift se abre aparte; si no, se abre el detalle */
    if (ev.target.closest("a.k-link")) {
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
      ev.preventDefault();
    }
    const e = byId(card.dataset.id);
    if (e) open(e, card);
  });

  document.addEventListener("keydown", ev => {
    if (S.open) {
      if (ev.key === "Escape") { ev.preventDefault(); requestClose(); }
      if (ev.key === "Tab") {                            // el foco no se escapa de la ventana
        const f = [...win.querySelectorAll("a[href],button")].filter(n => n.offsetParent !== null || n === xBtn);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && (document.activeElement === first || document.activeElement === content)) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
      return;
    }
    const card = ev.target.closest && ev.target.closest(".card[data-id],.slide[data-id]");
    if (card && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); const e = byId(card.dataset.id); if (e) open(e, card); }
  });

  /* Botón "atrás" o cambio del link: abre o cierra según el # */
  window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);
    if (S.open && !id) closeAnim();
    else if (!S.open && id) { const e = byId(id); if (e) open(e, document.querySelector(`.card[data-id="${CSS.escape(id)}"]`), { fromHash: true }); }
  });

  /* Si se gira el celular con la ventana abierta, se vuelve a centrar */
  addEventListener("resize", () => { if (S.open && !S.busy) { setWin(finalRect()); content.style.width = "100%"; } });

  /* Link directo: si la página se abre con #evento, se muestra el detalle. Si el evento ya no existe, se limpia el link. */
  const first = location.hash.slice(1);
  if (first) {
    const e = byId(first);
    if (e) open(e, document.querySelector(`.card[data-id="${CSS.escape(first)}"]`), { fromHash: true });
    else history.replaceState(null, "", location.pathname + location.search);
  }
})();
