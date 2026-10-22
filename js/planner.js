/* planner.js · planificador "Mi plan" (plan.html)
   Toma los eventos que la persona marcó (plan.js) y arma el viaje:
   - Línea de tiempo por día, con el traslado de cada evento (ida y vuelta, solo ida o nada) y la hora a la que lo buscamos.
   - Panel "Tu viaje": personas, alojamiento para esas fechas (llegada y salida calculadas, zona sugerida) y datos de contacto.
   - Un solo pedido de cotización con todo: va al mismo sistema que servicios.html (planilla + mail + pago online).
   - "Compartir plan": link plan.html?e=id1,id2 para mandarle a los amigos; quien lo abre puede guardarlo en su plan.
   Las elecciones se recuerdan en este navegador. Índice: 1 Datos · 2 Cálculos · 3 Piezas · 4 Dibujo · 5 Pedido · 6 Inicio
   Requiere: config.js, data.js, utils.js, analytics.js, site.js, cards.js, plan.js */

/* ============ 1. Datos ============ */
const PL_KEY = "epde-plan-opts";
const plLive = EV.filter(e => (e.endDate || e.date) >= TODAY && (!e.until || e.until >= TODAY) && (!e.from || e.from <= TODAY));
const byId = id => plLive.find(e => slugOf(e) === id);
const plQs = new URLSearchParams(location.search);
const shared = plQs.get("e") ? plQs.get("e").split(",").filter(Boolean) : null;   // plan compartido por link

const opts = (() => { try { return JSON.parse(localStorage.getItem(PL_KEY)) || {}; } catch (_) { return {}; } })();
opts.tr = opts.tr || {};          // traslado por evento: "ida y vuelta" | "solo ida" | "no"
opts.pick = opts.pick || {};      // hora a la que lo buscamos, por evento
const saveOpts = () => { try { localStorage.setItem(PL_KEY, JSON.stringify(opts)); } catch (_) {} };

const planIds = () => shared || Plan.get();
const planEvents = () => planIds().map(byId).filter(Boolean).sort(compareEvents);

/* ============ 2. Cálculos ============ */
const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const dow = iso => DOW[new Date(iso + "T12:00:00Z").getUTCDay()];
const dmy2 = iso => iso.split("-").reverse().slice(0, 2).join("/");
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const hasHour = e => /^\d{1,2}:\d{2}$/.test(e.time);
const trOf = e => opts.tr[slugOf(e)] || "ida y vuelta";
/* Lo buscamos media hora antes, en hora o media hora */
function defaultPick(e) {
  if (!hasHour(e)) return "";
  const [h, m] = e.time.split(":").map(Number);
  const t = (Math.round((((h * 60 + m - 30) % 1440) + 1440) % 1440 / 30) * 30) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
const pickOf = e => opts.pick[slugOf(e)] || defaultPick(e);

/* Zona sugerida para alojarse: donde caen la mayoría de los eventos */
function zoneOf(place) {
  const p = norm(place);
  if (/la barra|el placer|montoya|oak|narbona/.test(p)) return "La Barra";
  if (/manantiales|ruta 104|arcana|maca/.test(p)) return "Manantiales";
  if (/jose ignacio|medellin|polo/.test(p)) return "José Ignacio";
  if (/brava|mansa|parada|convenciones|cipriani/.test(p)) return "Playa Brava o Mansa";
  if (/rambla|soho|yacht|peninsula|artigas/.test(p)) return "Península";
  return "";
}
function suggestedZone(list) {
  const count = {};
  list.forEach(e => { const z = zoneOf(e.place); if (z) count[z] = (count[z] || 0) + 1; });
  return Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "Me da igual";
}

/* Fechas del viaje: llegada el día del primer evento, salida el día después del último */
const tripStart = list => list[0].date;
const tripEnd = list => list.map(e => e.endDate || e.date).sort().pop();

/* ============ 3. Piezas ============ */
const box = $("pl-body");
const optionTags = (list, sel) => list.map(o => `<option${o === sel ? " selected" : ""}>${esc(o)}</option>`).join("");
const ZONES = ["Me da igual", "Península", "Playa Brava o Mansa", "La Barra", "Manantiales", "José Ignacio"];
const TYPES = ["Me da igual", "Hotel", "Apartamento", "Casa"];
const BUDGETS = ["A conversar", "Hasta US$ 100", "US$ 100 a 250", "US$ 250 a 500", "Más de US$ 500"];

function eventCard(e) {
  const id = slugOf(e), tr = trOf(e);
  return `<article class="pl-ev" style="--c:${CATS[e.cat]}">
    <a class="pl-poster" href="/evento/${id}/" aria-label="${esc(e.title)}">${e.photo ? `<img src="${esc(photoUrl(e))}" alt="" loading="lazy">` : ""}</a>
    <div class="pl-info">
      <p class="pl-eb"><i></i>${esc(e.cat)} · ${esc(timeLabel(e))}</p>
      <h3><a href="/evento/${id}/">${esc(e.title)}</a></h3>
      <p class="pl-place">${ico("pin")}<span>${esc(e.place)}</span></p>
      <div class="pl-tr">
        <div class="pl-tr-h"><b>${ico("car")}Traslado</b>${tr !== "no" && hasHour(e) ? `<label class="pl-pick">te buscamos <input type="time" data-pick="${id}" value="${esc(pickOf(e))}"></label>` : tr !== "no" ? "<span>hora a coordinar</span>" : ""}</div>
        <div class="pl-seg has-pill" role="group" aria-label="Traslado para ${esc(e.title)}">
          ${["ida y vuelta", "solo ida", "no"].map(o => `<button type="button" data-tr="${id}" data-v="${o}" aria-pressed="${o === tr}">${o === "no" ? "No" : o.charAt(0).toUpperCase() + o.slice(1)}</button>`).join("")}
        </div>
      </div>
    </div>
    <button type="button" class="pl-x" data-plan="${id}" aria-label="Sacar de mi plan">${ico("close")}</button>
  </article>`;
}

function daysHtml(list) {
  const days = {};
  list.forEach(e => { (days[e.date] = days[e.date] || []).push(e); });
  return Object.keys(days).sort().map(d => `<section class="pl-day" aria-label="${esc(longDate({ date: d }))}">
    <div class="pl-date"><small>${dow(d)}</small><b>${parseInt(d.slice(8), 10)}</b><small>${MES[+d.slice(5, 7) - 1]}</small></div>
    <div class="pl-evs">${days[d].map(eventCard).join("")}</div>
  </section>`).join("");
}

function statsHtml(list) {
  const start = tripStart(list), end = tripEnd(list);
  const trips = list.reduce((n, e) => n + (trOf(e) === "ida y vuelta" ? 2 : trOf(e) === "solo ida" ? 1 : 0), 0);
  const nights = opts.stay === false ? 0 : Math.max(daysBetween(opts.aIn || start, opts.aOut || addDays(end, 1)), 0);
  const stat = (n, label, hl) => `<div class="pl-stat${hl ? " hl" : ""}"><b>${n}</b><small>${label}</small></div>`;
  return stat(list.length, list.length === 1 ? "evento" : "eventos", true)
    + stat(daysBetween(start, end) + 1, daysBetween(start, end) ? "días" : "día")
    + stat(nights, nights === 1 ? "noche de alojamiento" : "noches de alojamiento")
    + stat(trips, trips === 1 ? "traslado" : "traslados");
}

function sideHtml(list) {
  const start = tripStart(list), end = tripEnd(list);
  const stay = opts.stay !== false;
  return `<form class="pl-side" id="pl-form">
    <h2>Tu viaje</h2>
    <div class="pl-block">
      <div class="pl-block-h"><b>Personas</b>
        <div class="pl-step"><button type="button" data-people="-1" aria-label="Una persona menos">−</button><output id="pl-people">${opts.people || 2}</output><button type="button" data-people="1" aria-label="Una persona más">+</button></div>
      </div>
    </div>
    <div class="pl-block">
      <div class="pl-block-h"><b>${ico("bed")}Alojamiento</b><label class="pl-switch" aria-label="Necesito alojamiento"><input type="checkbox" id="pl-stay"${stay ? " checked" : ""}><span></span></label></div>
      <div class="pl-stay${stay ? "" : " pl-off"}" id="pl-stay-box">
        <div class="pl-two">
          <label>Llegada<input type="date" name="aIn" value="${esc(opts.aIn || start)}" min="${TODAY}"></label>
          <label>Salida<input type="date" name="aOut" value="${esc(opts.aOut || addDays(end, 1))}" min="${TODAY}"></label>
        </div>
        <div class="pl-two" style="margin-top:10px">
          <label>Zona<select name="aZone">${optionTags(ZONES, opts.aZone || suggestedZone(list))}</select></label>
          <label>Tipo<select name="aType">${optionTags(TYPES, opts.aType || "Me da igual")}</select></label>
        </div>
        <label style="margin-top:10px">Presupuesto por noche<select name="aBudget">${optionTags(BUDGETS, opts.aBudget || "A conversar")}</select></label>
      </div>
    </div>
    <div class="pl-block">
      <div class="pl-block-h"><b>${ico("car")}Traslados</b><small class="pl-hint" id="pl-trips"></small></div>
      <label>Desde dónde te buscamos<input name="from" value="${esc(opts.from || "")}" placeholder="${stay ? "Tu alojamiento (lo coordinamos)" : "Hotel, dirección o aeropuerto"}" autocomplete="off"></label>
    </div>
    <div class="pl-block">
      <div class="pl-block-h"><b>Tus datos</b></div>
      <label>Nombre<input name="name" required autocomplete="name" value="${esc(opts.name || "")}"></label>
      <div class="pl-two">
        <label>Mail<input type="email" name="email" required autocomplete="email" inputmode="email" value="${esc(opts.email || "")}" placeholder="ahí te llega la cotización"></label>
        <label>Celular<input type="tel" name="phone" required autocomplete="tel" value="${esc(opts.phone || "")}" placeholder="+598 9X XXX XXX"></label>
      </div>
      <label>Algo más <span style="font-weight:400">(opcional)</span><input name="notes" value="${esc(opts.notes || "")}" placeholder="Ej.: llegamos en Buquebus, vamos 2 parejas…" autocomplete="off"></label>
    </div>
    <button class="btn pl-cta" type="submit">Pedir cotización de mi plan</button>
    <p class="pl-fine">Sin costo ni compromiso. Te llega por mail y pagás online cuando aceptás.</p>
    <button type="button" class="pl-share" id="pl-share">${ico("share")}Compartir mi plan</button>
  </form>`;
}

function emptyHtml() {
  const ideas = plLive.filter(e => e.portada).sort(compareEvents).slice(0, 3);
  return `<div class="pl-empty">
    <h2>Todavía no elegiste eventos.</h2>
    <p>Tocá el <b>+</b> en los eventos a los que querés ir. Con eso armamos tu viaje: alojamiento para esas fechas y traslados a la hora justa.</p>
    <ol class="pl-how">
      <li><b>Elegí tus eventos</b><span>Con el + de cada tarjeta o desde la página del evento.</span></li>
      <li><b>Ajustá el viaje</b><span>Personas, alojamiento y a qué eventos te llevamos.</span></li>
      <li><b>Pedí una cotización</b><span>Te llega por mail y la pagás online.</span></li>
    </ol>
    <a class="btn" href="/">Ver la agenda</a>
  </div>
  ${ideas.length ? `<h2 style="margin:34px 0 14px;font-size:24px;font-weight:600">Para arrancar</h2><div class="pl-evs">${ideas.map(e => `<article class="pl-ev" style="--c:${CATS[e.cat]}">
      <a class="pl-poster" href="/evento/${slugOf(e)}/">${e.photo ? `<img src="${esc(photoUrl(e))}" alt="" loading="lazy">` : ""}</a>
      <div class="pl-info"><p class="pl-eb"><i></i>${esc(e.cat)} · ${esc(dow(e.date))} ${parseInt(e.date.slice(8), 10)} ${MES[+e.date.slice(5, 7) - 1]}</p>
        <h3><a href="/evento/${slugOf(e)}/">${esc(e.title)}</a></h3><p class="pl-place">${ico("pin")}<span>${esc(shortPlace(e))}</span></p></div>
      <button type="button" class="pl-x" data-plan="${slugOf(e)}" aria-label="Agregar a mi plan">${ico("plus")}</button>
    </article>`).join("")}</div>` : ""}`;
}

/* ============ 4. Dibujo ============ */
function render() {
  const list = planEvents();
  const sub = $("pl-sub");
  if (!list.length) {
    box.innerHTML = emptyHtml();
    return;
  }
  const start = tripStart(list), end = tripEnd(list);
  sub.textContent = `${list.length} ${list.length === 1 ? "evento" : "eventos"}, del ${dow(start).toLowerCase()} ${dmy2(start)} al ${dow(end).toLowerCase()} ${dmy2(end)}. Ajustá el viaje y pedí una sola cotización con todo.`;
  box.innerHTML = `${shared && shared.join() !== Plan.get().join() ? `<div class="pl-banner"><p>Te compartieron este plan.</p><button type="button" class="btn" id="pl-save">Guardarlo en mi plan</button></div>` : ""}
    <div class="pl-stats" id="pl-stats">${statsHtml(list)}</div>
    <div class="pl-grid">
      <div class="pl-days">${daysHtml(list)}</div>
      ${sideHtml(list)}
    </div>`;
  box.querySelectorAll(".pl-seg").forEach(s => slidePill(s, s.querySelector('[aria-pressed="true"]'), true));
  updateTrips(list);
  Plan.paint();
}

/* Solo números y resumen, sin redibujar todo (para no perder lo que se está escribiendo) */
function refreshStats() {
  const list = planEvents();
  if (!list.length) return;
  $("pl-stats").innerHTML = statsHtml(list);
  updateTrips(list);
}
function updateTrips(list) {
  const trips = list.filter(e => trOf(e) !== "no").length;
  const t = $("pl-trips");
  if (t) t.textContent = trips ? `para ${trips} de ${list.length} ${list.length === 1 ? "evento" : "eventos"}` : "sin traslados";
}

/* ============ 5. Pedido ============ */
const plRef = () => "PLN-" + Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function itinerary(list) {
  return list.map(e => {
    const tr = trOf(e);
    return `• ${dow(e.date)} ${dmy2(e.date)} ${hasHour(e) ? e.time + " " : ""}· ${e.title} · ${shortPlace(e)}`
      + (tr === "no" ? " · sin traslado" : ` · traslado ${tr}${pickOf(e) ? `, te buscamos ${pickOf(e)}` : ""}`);
  }).join("\n");
}

function planPayload(ref, f, list) {
  const stay = opts.stay !== false;
  const withTr = list.filter(e => trOf(e) !== "no");
  const need = stay && withTr.length ? "plan: traslados y alojamiento" : stay ? "plan: alojamiento" : withTr.length ? "plan: traslados" : "plan";
  const first = withTr[0];
  return {
    kind: "servicio", ref, need,
    event: list.map(e => `${e.title} (${e.date})`).join(" + "),
    people: String(opts.people || 2), name: f.name, email: f.email, phone: f.phone,
    tDate: first ? first.date : "", tGo: first ? pickOf(first) : "", tFrom: f.from || (stay ? "Su alojamiento" : ""),
    tBack: withTr.length ? "según el itinerario" : "", tBackTime: "",
    aIn: stay ? f.aIn : "", aOut: stay ? f.aOut : "", aZone: stay ? f.aZone : "", aType: stay ? f.aType : "", aBudget: stay ? f.aBudget : "",
    notes: `Itinerario:\n${itinerary(list)}${f.notes ? `\n\nAlgo más: ${f.notes}` : ""}`
  };
}

function doneHtml(ref, f, ok, msg) {
  const name = esc(f.name.trim().split(/\s+/)[0]);
  if (ok) return `<div class="pl-side">
      <p class="pl-eyebrow" style="color:#46d9a0">Pedido ${esc(ref)}</p>
      <h2>¡Listo, ${name}! Recibimos tu plan.</h2>
      <p class="pl-fine" style="text-align:left;margin:0">Te mandamos la cotización a <b>${esc(f.email)}</b> con el total y el botón para pagar online. Revisá también promociones o spam.</p>
      <ol class="pl-how" style="grid-template-columns:1fr">
        <li><b>Cotizamos</b><span>Alojamiento y choferes para tus fechas.</span></li>
        <li><b>Te llega por mail</b><span>Con todo lo que incluye y el total.</span></li>
        <li><b>Pagás online y listo</b><span>Después coordinamos cada traslado.</span></li>
      </ol>
    </div>`;
  return `<div class="pl-side">
      <h2>¡Casi listo, ${name}!</h2>
      <p class="pl-fine" style="text-align:left;margin:0">Mandanos el plan con un toque y te respondemos con opciones y precio.</p>
      <a class="btn pl-cta" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" data-ev="plan_whatsapp">Enviar por WhatsApp</a>
      <a class="btn ghost" href="mailto:${CONFIG.email}?subject=${encodeURIComponent("Mi plan " + ref)}&body=${encodeURIComponent(msg)}" data-ev="plan_mail">Enviar por mail</a>
    </div>`;
}

async function submitPlan(form) {
  const list = planEvents();
  const f = Object.fromEntries(new FormData(form));
  ["name", "email", "phone", "from", "notes", "aIn", "aOut", "aZone", "aType", "aBudget"].forEach(k => { if (f[k] !== undefined) opts[k] = f[k]; });
  saveOpts();
  const ref = plRef();
  const data = planPayload(ref, f, list);
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true; btn.textContent = "Enviando…";
  let ok = false;
  if (CONFIG.formUrl && CONFIG.formServicios) {
    try {
      const res = await fetch(CONFIG.formUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(data) });
      ok = Boolean((await res.json()).ok);
    } catch (_) { /* plan B: WhatsApp o mail */ }
  }
  const msg = `Hola! Quiero cotizar mi plan en Punta con Eventos PDE.\nPedido: ${ref}\nPersonas: ${data.people}\n${data.aIn ? `Alojamiento: del ${dmy2(data.aIn)} al ${dmy2(data.aOut)} · ${data.aZone} · ${data.aType} · ${data.aBudget}\n` : "Sin alojamiento\n"}Traslados desde: ${data.tFrom || "a coordinar"}\n\n${data.notes}\n\n${f.name} · ${f.email} · ${f.phone}`;
  form.outerHTML = doneHtml(ref, f, ok, msg);
  track("plan_cotizar", { eventos: list.length, via: ok ? "sistema" : "manual" });
  document.querySelector(".pl-side").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function sharePlan() {
  const url = `${location.origin}/plan.html?e=${planIds().join(",")}`;
  track("plan_compartir", { eventos: planIds().length });
  if (navigator.share) { navigator.share({ title: "Mi plan en Punta", url }).catch(() => {}); return; }
  try { await navigator.clipboard.writeText(url); $("pl-share").lastChild.textContent = "Link copiado"; }
  catch (_) { prompt("Copiá el link de tu plan:", url); }
}

/* ============ 6. Inicio ============ */
box.addEventListener("click", ev => {
  const t = ev.target;
  const seg = t.closest("[data-tr]");
  if (seg) {
    opts.tr[seg.dataset.tr] = seg.dataset.v; saveOpts();
    const group = seg.parentElement;
    group.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === seg));
    slidePill(group, seg);
    const card = seg.closest(".pl-ev"), e = byId(seg.dataset.tr);
    const head = card.querySelector(".pl-tr-h");
    head.innerHTML = `<b>${ico("car")}Traslado</b>${seg.dataset.v !== "no" && hasHour(e) ? `<label class="pl-pick">te buscamos <input type="time" data-pick="${seg.dataset.tr}" value="${esc(pickOf(e))}"></label>` : seg.dataset.v !== "no" ? "<span>hora a coordinar</span>" : ""}`;
    refreshStats();
    return;
  }
  const step = t.closest("[data-people]");
  if (step) {
    opts.people = Math.min(30, Math.max(1, (opts.people || 2) + Number(step.dataset.people))); saveOpts();
    $("pl-people").textContent = opts.people;
    return;
  }
  if (t.closest("#pl-share")) { sharePlan(); return; }
  if (t.closest("#pl-save")) {
    Plan.set([...new Set([...Plan.get(), ...shared])]);
    location.replace("/plan.html");
    return;
  }
  if (t.closest("[data-plan]")) setTimeout(() => { if (shared) location.replace("/plan.html"); else render(); });   // plan.js ya lo agregó o sacó
});

box.addEventListener("change", ev => {
  const t = ev.target;
  if (t.matches("[data-pick]")) { opts.pick[t.dataset.pick] = t.value; saveOpts(); return; }
  if (t.id === "pl-stay") {
    opts.stay = t.checked; saveOpts();
    $("pl-stay-box").classList.toggle("pl-off", !t.checked);
    refreshStats();
    return;
  }
  if (t.name === "aIn" || t.name === "aOut") { opts[t.name] = t.value; saveOpts(); refreshStats(); }
});

box.addEventListener("submit", ev => { ev.preventDefault(); submitPlan(ev.target); });

addEventListener("resize", () => box.querySelectorAll(".pl-seg").forEach(s => slidePill(s, s.querySelector('[aria-pressed="true"]'), true)));
render();
if (document.fonts) document.fonts.ready.then(() => box.querySelectorAll(".pl-seg").forEach(s => slidePill(s, s.querySelector('[aria-pressed="true"]'), true)));
