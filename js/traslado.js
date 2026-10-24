/* traslado.js · "Traslado con chofer" en la página de cada evento: precio al instante y pago con tarjeta
   tools/paginas.js deja <section class="ride" id="ride" data-...> solo en los eventos que cumplen rideOK (cards.js:
   fiestas y música en vivo con entradas). Acá se arma el bloque, pensado para que cualquiera lo entienda a la primera:
   1. ¿Qué viaje necesitás?   tres opciones grandes con su explicación (ida y vuelta, solo ida, solo vuelta).
   2. ¿Dónde te buscamos?     zona y dirección (en "solo vuelta": ¿a dónde te llevamos?).
   3. ¿Cuántos son y a qué hora?   personas (auto hasta 4, camioneta hasta 8), día si dura varios, hora en formato 24 h.
   Resumen tipo ticket: cada tramo con su precio y el total (tarifas.js). Sin zona: "Desde US$ X".
   "Continuar" pide nombre, mail y WhatsApp (4. Tus datos) y "Pagar con tarjeta" manda el pedido al script
   (apps-script/Code.gs, kind "traslado"), que vuelve a calcular el precio y abre Mercado Pago. Nunca se cotiza a mano.
   Los datos se recuerdan en este navegador (los mismos que usa Armar plan).
   Requiere: config.js, utils.js, analytics.js, tarifas.js */

(() => {
  const box = document.getElementById("ride");
  if (!box || !box.dataset.geo) return;
  const ev = box.dataset;
  const geo = ev.geo.split(",").map(Number);
  const KEY = "epde-plan-opts";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } })();
  const remember = o => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(saved, o))); } catch (_) {} };

  /* Las tres opciones de viaje: valor, título, explicación y cuántos tramos son */
  const WAYS = [
    ["ida y vuelta", "Ida y vuelta", "Te llevamos al evento y te traemos de vuelta", 2],
    ["solo ida", "Solo ida", "Te llevamos al evento", 1],
    ["solo vuelta", "Solo vuelta", "Te traemos a tu casa u hotel al terminar", 1]
  ];
  const st = { way: "ida y vuelta", people: Math.min(16, saved.people || 2), zone: ZONES.some(z => z.name === saved.rideZone) ? saved.rideZone : "", step: 1 };
  const hasHour = /^\d{1,2}:\d{2}$/.test(ev.time || "");
  /* Lo buscamos media hora antes del evento, redondeado a la media hora */
  const defPick = (() => {
    if (!hasHour) return "";
    const [h, m] = ev.time.split(":").map(Number);
    const t = (Math.round((((h * 60 + m - 30) % 1440) + 1440) % 1440 / 30) * 30) % 1440;
    return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
  })();
  /* Horas para elegir, de a media hora y en formato 24 h (sin AM/PM, que confunde) */
  const HOURS = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);
  /* Días posibles: el del evento, o todos si dura varios */
  const days = [];
  for (let d = ev.date; d && d <= (ev.end || ev.date) && days.length < 31; d = addDays(d, 1)) days.push(d);
  const DOWS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const dayText = iso => `${DOWS[new Date(iso + "T12:00:00Z").getUTCDay()]} ${parseInt(iso.slice(8), 10)}/${parseInt(iso.slice(5, 7), 10)}`;

  const wayOf = () => WAYS.find(w => w[0] === st.way);
  const legs = () => wayOf()[3];
  const goes = () => st.way !== "solo vuelta";
  const comes = () => st.way !== "solo ida";
  const price = () => rideUSD(st.zone, geo, legs(), st.people);
  const leg = () => rideUSD(st.zone, geo, 1, st.people);
  /* "Desde": el precio más bajo entre todas las zonas, para mostrar algo antes de que elija la suya */
  const fromPrice = () => Math.min(...ZONES.map(z => rideUSD(z.name, geo, legs(), st.people)));
  const num = n => `<span class="ride-num" aria-hidden="true">${n}</span>`;

  box.innerHTML = `
    <div class="ride-head">
      <span class="ride-i">${ico("car")}</span>
      <div class="ride-ht">
        <p class="ride-eb">Traslado con chofer</p>
        <h2 id="ride-h">Te llevamos y te traemos</h2>
        <p>Volvé seguro y sin manejar. Precio final, sin sorpresas, y pago con tarjeta.</p>
      </div>
    </div>

    <fieldset class="ride-step">
      <legend>${num(1)}¿Qué viaje necesitás?</legend>
      <div class="ride-ways" role="radiogroup" aria-label="Qué viaje necesitás">
        ${WAYS.map(([v, t, sub]) => `<button type="button" class="ride-way" role="radio" data-way="${v}" aria-checked="${v === st.way}">
          <span class="ride-dot" aria-hidden="true"></span><span class="ride-wt"><b>${t}</b><small>${sub}</small></span></button>`).join("")}
      </div>
    </fieldset>

    <fieldset class="ride-step">
      <legend>${num(2)}<span id="ride-where">¿Dónde te buscamos?</span></legend>
      <div class="ride-grid">
        <label class="ride-f"><span>Zona</span>
          <select id="ride-zone" required><option value="">Elegí tu zona</option>${ZONES.map(z => `<option${z.name === st.zone ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></label>
        <label class="ride-f"><span>Dirección o nombre del hotel</span><input id="ride-addr" required autocomplete="street-address" placeholder="Ej.: Calle 20 y Gorlero" value="${esc(saved.rideAddr || "")}"></label>
      </div>
    </fieldset>

    <fieldset class="ride-step">
      <legend>${num(3)}¿Cuántos son y a qué hora?</legend>
      <div class="ride-grid">
        <div class="ride-f"><span>Personas</span>
          <div class="ride-count"><button type="button" data-people="-1" aria-label="Una persona menos">−</button><output id="ride-n" aria-live="polite">${st.people}</output><button type="button" data-people="1" aria-label="Una persona más">+</button></div>
          <small class="ride-hint" id="ride-veh-hint"></small></div>
        ${days.length > 1 ? `<label class="ride-f"><span>Día</span><select id="ride-day">${days.map(d => `<option value="${d}">${dayText(d)}</option>`).join("")}</select></label>` : ""}
        <label class="ride-f" id="ride-pickw"><span>Te pasamos a buscar a las</span>
          <select id="ride-pick" required>${defPick ? "" : '<option value="">Elegí la hora</option>'}${HOURS.map(h => `<option${h === defPick ? " selected" : ""}>${h}</option>`).join("")}</select>
          <small class="ride-hint">${hasHour ? `El evento empieza a las ${esc(ev.time)}` : "La hora del evento está a confirmar"}</small></label>
      </div>
      <p class="ride-note" id="ride-note">${ico("chat")}<span><b>La vuelta:</b> cuando quieras irte, nos mandás un WhatsApp y te pasamos a buscar por la puerta.</span></p>
    </fieldset>

    <form class="ride-step ride-contact" id="ride-contact" hidden novalidate>
      <p class="ride-legend">${num(4)}Tus datos</p>
      <label class="ride-f"><span>Nombre y apellido</span><input name="name" required autocomplete="name" value="${esc(saved.name || "")}"></label>
      <div class="ride-grid">
        <label class="ride-f"><span>Mail</span><input type="email" name="email" required autocomplete="email" inputmode="email" value="${esc(saved.email || "")}" placeholder="Ahí te llega la confirmación"></label>
        <label class="ride-f"><span>WhatsApp</span><input type="tel" name="phone" required autocomplete="tel" value="${esc(saved.phone || "")}" placeholder="+598 99 123 456"></label>
      </div>
    </form>

    <div class="ride-sum" aria-live="polite">
      <p class="ride-sum-h">Tu traslado</p>
      <ul class="ride-lines" id="ride-lines"></ul>
      <div class="ride-total"><span id="ride-tl">Total</span><b id="ride-usd"></b></div>
      <p class="ride-per" id="ride-per"></p>
      <button type="button" class="btn ride-go" id="ride-go"></button>
    </div>

    <ul class="ride-trust">
      <li>${ico("check")}Precio final por auto, no por persona</li>
      <li>${ico("check")}Pago seguro con tarjeta (Mercado Pago)</li>
      <li>${ico("check")}Te confirmamos el chofer por WhatsApp</li>
    </ul>
    <a class="ride-plan" href="/plan.html?add=${encodeURIComponent(ev.id)}" data-ev="plan_evento" data-n="${esc(ev.title)}">¿Venís de afuera? Armá tu plan con aeropuerto y alojamiento ${ico("arrow")}</a>`;

  const $r = id => document.getElementById(id);

  /* Todo lo que cambia con cada elección: textos, resumen, precio y botón */
  function paint() {
    const usd = price(), one = leg();
    box.querySelectorAll(".ride-way").forEach(b => b.setAttribute("aria-checked", b.dataset.way === st.way));
    $r("ride-where").textContent = goes() ? "¿Dónde te buscamos?" : "¿A dónde te llevamos?";
    $r("ride-pickw").hidden = !goes();
    $r("ride-pick").required = goes();
    $r("ride-note").hidden = !comes();
    $r("ride-veh-hint").textContent = st.people <= 4 ? "Va un auto (hasta 4 personas)" : st.people <= 8 ? "Va una camioneta (hasta 8 personas)" : `Van ${Math.ceil(st.people / 8)} camionetas`;
    const day = $r("ride-day") ? $r("ride-day").value : ev.date;
    const pick = goes() && $r("ride-pick").value ? ` · ${$r("ride-pick").value} hs` : "";
    const line = (t, s, p) => `<li><span><b>${t}</b><small>${s}</small></span><em>${p}</em></li>`;
    $r("ride-lines").innerHTML = [
      goes() ? line("Ida", `${dayText(day)}${pick}`, one ? `US$ ${one}` : "") : "",
      comes() ? line("Vuelta", "cuando nos avises por WhatsApp", one ? `US$ ${one}` : "") : ""
    ].join("");
    $r("ride-tl").textContent = usd ? "Total" : "Desde";
    $r("ride-usd").textContent = `US$ ${usd || fromPrice()}`;
    $r("ride-per").textContent = usd ? `Precio por ${st.people <= 4 ? "auto" : "camioneta"}, para ${st.people} ${st.people === 1 ? "persona" : "personas"}. Sin cargos extra.`
      : "Elegí tu zona (paso 2) para ver el precio exacto.";
    $r("ride-go").textContent = st.step === 1 || !usd ? "Continuar" : `Pagar US$ ${usd} con tarjeta`;
  }

  /* Campos obligatorios: marca el primero que falta, lo muestra y lo enfoca */
  const firstBad = list => list.find(i => i && !i.closest("[hidden]") && !i.checkValidity());
  function check(list) {
    const bad = firstBad(list);
    if (!bad) return true;
    bad.scrollIntoView({ behavior: "smooth", block: "center" });
    bad.focus({ preventScroll: true });
    bad.reportValidity();
    return false;
  }

  async function pay() {
    const data = Object.fromEntries(new FormData($r("ride-contact")));
    remember({ name: data.name, email: data.email, phone: data.phone, rideZone: st.zone, rideAddr: $r("ride-addr").value.trim(), people: st.people });
    const day = $r("ride-day") ? $r("ride-day").value : ev.date;
    const item = {
      tipo: "evento", titulo: ev.title, fecha: dayText(day), lugar: ev.place, geo, legs: legs(), sentido: st.way,
      busca: goes() ? $r("ride-pick").value : "", vuelta: comes() ? "a la hora que nos avises por WhatsApp" : ""
    };
    const btn = $r("ride-go");
    btn.disabled = true; btn.textContent = "Abriendo el pago…";
    track("traslado_pagar", { evento: ev.id, usd: price(), personas: st.people, tramos: st.way });
    try {
      const res = await fetch(CONFIG.formUrl, { method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ kind: "traslado", zone: st.zone, address: $r("ride-addr").value.trim(), people: st.people, ...data, items: [item] }) });
      const r = await res.json();
      /* Solo se va a pagar si el script devolvió una reserva de traslado (TRS-…): un script viejo, sin traslados,
         contestaría ok pero sin reserva, y la página de pago diría "No encontramos el pedido" */
      if (r.ok && /^TRS-/.test(r.ref || "") && (r.url || r.pagina)) { location.href = r.url || r.pagina; return; }
      btn.disabled = false; paint(); fail(r.ok ? "No pudimos abrir el pago en este momento." : r.error);
    } catch (_) { btn.disabled = false; paint(); fail(); }
  }
  /* Si el script no responde: el pedido sale por WhatsApp con todos los datos */
  function fail(msg) {
    box.querySelector(".ride-fail")?.remove();
    const text = `Hola! Quiero un traslado para ${ev.title} (${ev.date}): ${st.way}, ${st.people} personas, ${goes() ? "desde" : "hasta"} ${st.zone} · ${$r("ride-addr").value.trim()}${goes() ? `, a las ${$r("ride-pick").value}` : ""}.`;
    $r("ride-go").insertAdjacentHTML("afterend", `<p class="ride-note ride-fail">${ico("chat")}<span><b>${esc(msg || "No pudimos abrir el pago.")}</b> <a href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Reservalo por WhatsApp</a> y te mandamos el link de pago.</span></p>`);
  }

  box.addEventListener("click", e => {
    const w = e.target.closest("[data-way]");
    if (w) { st.way = w.dataset.way; paint(); return; }
    const p = e.target.closest("[data-people]");
    if (p) { st.people = Math.min(16, Math.max(1, st.people + Number(p.dataset.people))); $r("ride-n").textContent = st.people; paint(); return; }
    if (e.target.closest("#ride-go")) {
      if (!check([$r("ride-zone"), $r("ride-addr"), $r("ride-pick")])) return;
      if (st.step === 1) {
        st.step = 2;
        $r("ride-contact").hidden = false;
        paint();
        track("traslado_reservar", { evento: ev.id, usd: price() });
        $r("ride-contact").scrollIntoView({ behavior: "smooth", block: "start" });
        const first = firstBad([...$r("ride-contact").elements]);
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 400);
        return;
      }
      if (check([...$r("ride-contact").elements])) pay();
    }
  });
  /* Flechas del teclado entre las tres opciones de viaje (como un grupo de radios) */
  box.querySelector(".ride-ways").addEventListener("keydown", e => {
    const i = WAYS.findIndex(w => w[0] === st.way), d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    st.way = WAYS[(i + d + WAYS.length) % WAYS.length][0];
    paint();
    box.querySelector(`[data-way="${st.way}"]`).focus();
  });
  box.addEventListener("change", e => { if (e.target.id === "ride-zone") st.zone = e.target.value; paint(); });
  box.addEventListener("submit", e => e.preventDefault());

  /* Mientras el bloque está a la vista, la píldora "Tu plan" se esconde para no tapar el resumen ni el botón */
  if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => document.body.classList.toggle("ride-on", en.isIntersecting), { threshold: .05 }).observe(box);

  paint();
})();
