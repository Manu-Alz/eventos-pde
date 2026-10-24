/* traslado.js · "Traslado con chofer" en la página de cada evento: precio al instante y pago con tarjeta
   tools/paginas.js deja <section class="ride" id="ride" data-...> con los datos del evento; acá se arma el bloque:
   1. Ida y vuelta, solo ida o solo vuelta (la vuelta de la fiesta: nos avisa por WhatsApp y lo buscamos).
   2. Zona y dirección de donde sale, personas y hora a la que lo buscamos (y el día, si el evento dura varios).
   3. El precio sale solo (tarifas.js): antes de elegir zona muestra "Desde US$ X"; con la zona, el total y el desglose
      (ida + vuelta, por auto). "Reservar" pide nombre, mail y WhatsApp, y "Pagar con tarjeta" manda el pedido al script
      (apps-script/Code.gs, kind "traslado"), que vuelve a calcular el precio y abre Mercado Pago. Nunca se cotiza a mano.
   Solo aparece en los eventos que cumplen rideOK (cards.js): paginas.js no deja el bloque en los demás.
   Los datos de contacto se recuerdan en este navegador (los mismos que usa Armar plan).
   Requiere: config.js, utils.js, analytics.js, tarifas.js */

(() => {
  const box = document.getElementById("ride");
  if (!box || !box.dataset.geo) return;
  const ev = box.dataset;
  const geo = ev.geo.split(",").map(Number);
  const KEY = "epde-plan-opts";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } })();
  const remember = o => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(saved, o))); } catch (_) {} };

  const WAYS = [["ida y vuelta", "Ida y vuelta", 2], ["solo ida", "Solo ida", 1], ["solo vuelta", "Solo vuelta", 1]];
  const st = { way: "ida y vuelta", people: saved.people || 2, zone: ZONES.some(z => z.name === saved.rideZone) ? saved.rideZone : "", step: 1 };
  const hasHour = /^\d{1,2}:\d{2}$/.test(ev.time || "");
  /* Lo buscamos media hora antes del evento, redondeado a la media hora */
  const defPick = (() => {
    if (!hasHour) return "";
    const [h, m] = ev.time.split(":").map(Number);
    const t = (Math.round((((h * 60 + m - 30) % 1440) + 1440) % 1440 / 30) * 30) % 1440;
    return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
  })();
  /* Días posibles: el del evento, o todos si dura varios */
  const days = [];
  for (let d = ev.date; d && d <= (ev.end || ev.date) && days.length < 31; d = addDays(d, 1)) days.push(d);
  const dayText = iso => `${["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][new Date(iso + "T12:00:00Z").getUTCDay()]} ${iso.split("-").reverse().slice(0, 2).join("/")}`;

  const legs = () => WAYS.find(w => w[0] === st.way)[2];
  const goes = () => st.way !== "solo vuelta";
  const comes = () => st.way !== "solo ida";
  const price = () => rideUSD(st.zone, geo, legs(), st.people);
  /* "Desde": el precio más bajo entre todas las zonas, para mostrar algo antes de que elija la suya */
  const fromPrice = () => Math.min(...ZONES.map(z => rideUSD(z.name, geo, legs(), st.people)));
  const leg = () => rideUSD(st.zone, geo, 1, st.people);

  box.innerHTML = `
    <div class="ride-head">
      <span class="ride-i">${ico("car")}</span>
      <div class="ride-ht">
        <p class="ride-eb">Traslado con chofer</p>
        <h2 id="ride-h">Te llevamos y te traemos</h2>
        <p>Volvé seguro y sin manejar ni buscar taxi a la salida. Reservás acá, con precio final, y pagás con tarjeta en un minuto.</p>
      </div>
    </div>
    <div class="ride-seg has-pill" role="group" aria-label="Qué tramos">
      ${WAYS.map(([v, t]) => `<button type="button" data-way="${v}" aria-pressed="${v === st.way}">${t}</button>`).join("")}
    </div>
    <div class="ride-grid">
      <label class="ride-f ride-wide"><span id="ride-zl">¿De dónde salís?</span>
        <select id="ride-zone" required><option value="">Elegí tu zona</option>${ZONES.map(z => `<option${z.name === st.zone ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></label>
      <label class="ride-f ride-wide"><span>Dirección u hotel</span><input id="ride-addr" required autocomplete="street-address" placeholder="Calle y número, o nombre del hotel" value="${esc(saved.rideAddr || "")}"></label>
      ${days.length > 1 ? `<label class="ride-f ride-wide"><span>Día</span><select id="ride-day">${days.map(d => `<option value="${d}">${dayText(d)}</option>`).join("")}</select></label>` : ""}
      <div class="ride-f"><span>Personas</span>
        <div class="ride-step"><button type="button" data-people="-1" aria-label="Una persona menos">−</button><output id="ride-n">${st.people}</output><button type="button" data-people="1" aria-label="Una persona más">+</button></div></div>
      <label class="ride-f" id="ride-pickw"><span>Te buscamos a las</span><input type="time" id="ride-pick" value="${defPick}" required></label>
    </div>
    <p class="ride-note" id="ride-note"></p>
    <form class="ride-contact" id="ride-contact" hidden novalidate>
      <p class="ride-q">¿A nombre de quién?</p>
      <label class="ride-f"><span>Nombre y apellido</span><input name="name" required autocomplete="name" value="${esc(saved.name || "")}"></label>
      <div class="ride-two">
        <label class="ride-f"><span>Mail</span><input type="email" name="email" required autocomplete="email" inputmode="email" value="${esc(saved.email || "")}" placeholder="ahí te llega la confirmación"></label>
        <label class="ride-f"><span>WhatsApp</span><input type="tel" name="phone" required autocomplete="tel" value="${esc(saved.phone || "")}" placeholder="+598 9…"></label>
      </div>
    </form>
    <div class="ride-bar">
      <div class="ride-total"><small id="ride-veh"></small><b id="ride-usd"></b></div>
      <button type="button" class="btn ride-go" id="ride-go"></button>
    </div>
    <ul class="ride-trust">
      <li>${ico("check")}Precio final por auto, no por persona</li>
      <li>${ico("check")}Pago seguro con tarjeta (Mercado Pago)</li>
      <li>${ico("check")}Te confirmamos el chofer por WhatsApp</li>
    </ul>
    <a class="ride-plan" href="/plan.html?add=${encodeURIComponent(ev.id)}" data-ev="plan_evento" data-n="${esc(ev.title)}">¿Venís de afuera? Armá tu plan con aeropuerto y alojamiento ${ico("arrow")}</a>`;

  const $r = id => document.getElementById(id);
  const seg = box.querySelector(".ride-seg");

  /* Precio, textos y botón al día */
  function paint() {
    const usd = price();
    $r("ride-pickw").hidden = !goes();
    $r("ride-pick").required = goes();
    $r("ride-note").innerHTML = comes()
      ? `${ico("chat")}<span><b>La vuelta:</b> cuando quieras irte, nos escribís por WhatsApp y te buscamos en la puerta.</span>` : "";
    $r("ride-note").hidden = !comes();
    /* Sin zona: "Desde US$ X" y cómo ver el exacto. Con zona: total y desglose por tramo */
    $r("ride-veh").textContent = !usd ? "Elegí de dónde salís para ver el precio exacto"
      : legs() === 2 ? `Ida US$ ${leg()} + vuelta US$ ${leg()} · ${vehicleText(st.people)}`
      : `${st.way === "solo ida" ? "Solo ida" : "Solo vuelta"} · ${vehicleText(st.people)}`;
    $r("ride-usd").innerHTML = usd ? `US$ ${usd}` : `<small>Desde</small> US$ ${fromPrice()}`;
    $r("ride-go").textContent = st.step === 1 || !usd ? "Reservar" : `Pagar US$ ${usd} con tarjeta`;
    box.classList.toggle("ride-open", st.step === 2);
  }

  /* Campos obligatorios: marca el primero que falta y lo enfoca */
  const firstBad = list => list.find(i => i && !i.hidden && !i.closest("[hidden]") && !i.checkValidity());
  function check(list) {
    const bad = firstBad(list);
    if (!bad) return true;
    bad.focus();
    bad.reportValidity();
    return false;
  }

  async function pay() {
    const f = $r("ride-contact");
    const data = Object.fromEntries(new FormData(f));
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
      if (r.ok && (r.url || r.pagina)) { location.href = r.url || r.pagina; return; }
      btn.disabled = false; paint(); fail(r.error);
    } catch (_) { btn.disabled = false; paint(); fail(); }
  }
  /* Si el script no responde: el pedido sale por WhatsApp con todos los datos */
  function fail(msg) {
    const text = `Hola! Quiero un traslado para ${ev.title} (${ev.date}): ${st.way}, ${st.people} personas, desde ${st.zone} · ${$r("ride-addr").value.trim()}${goes() ? `, a las ${$r("ride-pick").value}` : ""}.`;
    $r("ride-note").hidden = false;
    $r("ride-note").innerHTML = `${ico("chat")}<span><b>${esc(msg || "No pudimos abrir el pago.")}</b> <a href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Reservalo por WhatsApp</a> y te mandamos el link de pago.</span>`;
  }

  box.addEventListener("click", e => {
    const w = e.target.closest("[data-way]");
    if (w) {
      st.way = w.dataset.way;
      seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === w));
      slidePill(seg, w);
      paint();
      return;
    }
    const p = e.target.closest("[data-people]");
    if (p) { st.people = Math.min(16, Math.max(1, st.people + Number(p.dataset.people))); $r("ride-n").textContent = st.people; paint(); return; }
    if (e.target.closest("#ride-go")) {
      if (!check([$r("ride-zone"), $r("ride-addr"), $r("ride-pick")])) return;
      if (st.step === 1) {
        st.step = 2;
        $r("ride-contact").hidden = false;
        paint();
        track("traslado_reservar", { evento: ev.id, usd: price() });
        const first = firstBad([...$r("ride-contact").elements]);
        if (first) first.focus({ preventScroll: true });
        $r("ride-contact").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (check([...$r("ride-contact").elements])) pay();
    }
  });
  box.addEventListener("change", e => { if (e.target.id === "ride-zone") { st.zone = e.target.value; paint(); } });
  box.addEventListener("submit", e => e.preventDefault());

  /* Mientras el bloque está a la vista, la píldora "Tu plan" se esconde para no tapar el total ni el botón */
  if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => document.body.classList.toggle("ride-on", en.isIntersecting), { threshold: .05 }).observe(box);

  paint();
  slidePill(seg, seg.querySelector('[aria-pressed="true"]'), true);
  addEventListener("resize", () => slidePill(seg, seg.querySelector('[aria-pressed="true"]'), true));
  if (document.fonts) document.fonts.ready.then(() => slidePill(seg, seg.querySelector('[aria-pressed="true"]'), true));
})();
