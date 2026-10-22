/* servicios.js · página de traslados y alojamiento
   La persona elige qué necesita, completa el pedido y lo manda por WhatsApp; vos le conseguís opciones y precio.
   Con CONFIG.formServicios en true, el pedido también queda en la planilla (apps-script/Code.gs, pestaña "Servicios").
   Se puede abrir ya armado: servicios.html?s=traslado&e=<id del evento>  (s = traslado | alojamiento | ambos)
   Índice: 1 Qué necesita · 2 Evento · 3 Mensaje · 4 Envío
   Requiere: config.js, data.js, utils.js, analytics.js, site.js, cards.js */

const sform = $("sform");
const sdone = $("ok");
const NEED = { traslado: "un traslado", alojamiento: "alojamiento", ambos: "traslado y alojamiento" };
const q = new URLSearchParams(location.search);
let need = NEED[q.get("s")] ? q.get("s") : "traslado";

/* ============ 1. Qué necesita ============
   Control segmentado con la píldora que se desliza. Los grupos que no aplican se desactivan
   (un fieldset desactivado no se valida ni se envía). */
const needBox = $("need");
function setNeed(k, instant = false) {
  need = k;
  needBox.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
  slidePill(needBox, needBox.querySelector('[aria-pressed="true"]'), instant);
  sform.querySelectorAll(".grp").forEach(g => {
    const on = k === "ambos" || g.dataset.g === k;
    g.hidden = !on;
    g.disabled = !on;
  });
}
needBox.addEventListener("click", ev => { const b = ev.target.closest("button"); if (b) setNeed(b.dataset.k); });

/* Botones de las tarjetas de arriba: eligen el servicio y bajan al formulario */
document.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", () => {
  setNeed(b.dataset.pick);
  $("pedido").scrollIntoView({ behavior: "smooth", block: "start" });
  track("servicio_elegido", { servicio: b.dataset.pick });
}));

/* ============ 2. Evento ============
   Lista de eventos vigentes. Al elegir uno se completan las fechas que estén vacías. */
const SLIVE = EV.filter(e => (e.endDate || e.date) >= TODAY && (!e.until || e.until >= TODAY) && (!e.from || e.from <= TODAY)).sort(compareEvents);
const evSelect = sform.elements.event;
evSelect.append(new Option("Ningún evento en particular", ""));
SLIVE.forEach(e => evSelect.append(new Option(`${e.title} · ${parseInt(e.date.slice(8), 10)} ${MES[+e.date.slice(5, 7) - 1]}`, slugOf(e))));
const chosenEvent = () => SLIVE.find(e => slugOf(e) === evSelect.value) || null;

function fillDates(force = false) {
  const e = chosenEvent(); if (!e) return;
  const f = sform.elements;
  const set = (name, v) => { if (force || !f[name].value) f[name].value = v; };
  set("tDate", e.date);
  if (/^\d{1,2}:\d{2}$/.test(e.time)) set("tGo", addMinutes(e.time, -30));   // media hora antes del evento, en hora o media hora
  set("aIn", e.date);
  set("aOut", addDays(e.endDate || e.date, 1));
}
const addMinutes = (hhmm, m) => { const [hh, mm] = hhmm.split(":").map(Number); const t = Math.floor(((hh * 60 + mm + m + 1440) % 1440) / 30) * 30; return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`; };
evSelect.addEventListener("change", () => fillDates(true));

/* Fechas: no se puede pedir para días pasados; la salida es después de la llegada */
["tDate", "aIn", "aOut"].forEach(n => { sform.elements[n].min = TODAY; });
sform.elements.aIn.addEventListener("change", () => {
  const a = sform.elements.aIn.value, o = sform.elements.aOut;
  if (a) { o.min = addDays(a, 1); if (o.value && o.value <= a) o.value = addDays(a, 1); }
});

/* ============ 3. Mensaje ============ */
const dm = iso => (iso ? iso.split("-").reverse().slice(0, 2).join("/") : "");
const nights = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const newSrvRef = () => "SRV-" + Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function buildServiceMessage(ref, d) {
  const e = chosenEvent();
  const lines = [
    `Hola! Quiero pedir ${NEED[need]} con Eventos PDE.`,
    `Pedido: ${ref}`,
    `Evento: ${e ? `${e.title} (${longDate(e)}, ${e.place})` : "ninguno en particular"}`,
    `Personas: ${d.people}`
  ];
  if (need !== "alojamiento") lines.push(
    `— Traslado: ${dm(d.tDate)} · ida ${d.tGo} hs desde ${d.tFrom}`,
    `  Vuelta: ${d.tBack}${d.tBack !== "Solo ida" && d.tBackTime ? ` (${d.tBackTime} hs aprox.)` : ""}`);
  if (need !== "traslado") lines.push(
    `— Alojamiento: del ${dm(d.aIn)} al ${dm(d.aOut)} (${nights(d.aIn, d.aOut)} ${nights(d.aIn, d.aOut) === 1 ? "noche" : "noches"})`,
    `  Zona: ${d.aZone} · Tipo: ${d.aType} · Presupuesto por noche: ${d.aBudget}`);
  lines.push(`Nombre: ${d.name}`, `WhatsApp: ${d.phone}`);
  if (d.notes) lines.push(`Algo más: ${d.notes}`);
  return lines.join("\n");
}

/* ============ 4. Envío ============ */
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

sform.addEventListener("submit", ev => {
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(sform));
  const ref = newSrvRef();
  const msg = buildServiceMessage(ref, d);
  const e = chosenEvent();

  /* Planilla: solo si ya está el Code.gs nuevo (CONFIG.formServicios) */
  if (CONFIG.formUrl && CONFIG.formServicios) {
    fetch(CONFIG.formUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ kind: "servicio", ref, need, event: e ? `${e.title} (${e.date})` : "", ...d }) }).catch(() => {});
  }

  const wa = el("a", "btn", "Enviar pedido por WhatsApp");
  wa.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  wa.target = "_blank"; wa.rel = "noopener";
  wa.dataset.ev = "servicio_whatsapp"; wa.dataset.n = need;
  const mail = el("a", "btn ghost", "Enviar por mail");
  mail.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Pedido " + ref)}&body=${encodeURIComponent(msg)}`;
  mail.dataset.ev = "servicio_mail"; mail.dataset.n = need;

  const head = el("div", "ok-head");
  const check = el("span", "ok-check"); check.innerHTML = ico("check");
  const txt = el("div");
  txt.append(el("h3", "", `¡Listo, ${d.name.trim().split(/\s+/)[0]}!`),
    el("p", "", CONFIG.formServicios ? "Recibimos tu pedido. Te escribimos por WhatsApp con opciones y precio." : "Mandanos el pedido por WhatsApp y te respondemos con opciones y precio."));
  head.append(check, txt);
  const row = el("div", "sendrow"); row.append(wa, mail);
  const sum = el("div", "ok-sum ok-sum2");
  const stat = (label, value, cls = "") => { const s = el("div", "ok-stat " + cls); s.append(el("small", "", label), el("b", "", value)); return s; };
  sum.append(stat("Pedís", NEED[need].replace(/^un /, "").replace(/^./, c => c.toUpperCase())), stat("Tu pedido", ref, "ok-ref"));

  sdone.replaceChildren(head, sum, el("p", "note ok-gap", e ? `Para ${e.title}, ${longDate(e)}.` : "Guardá el número de pedido por si nos escribís."), row);
  sdone.style.display = "block";
  track("pedir_servicio", { servicio: need, evento: e ? e.title : "" });
  sdone.scrollIntoView({ behavior: "smooth", block: "center" });
});

/* ============ Inicio ============ */
if (q.get("e")) { evSelect.value = q.get("e"); fillDates(); }
setNeed(need, true);
if (q.get("e")) addEventListener("load", () => $("pedido").scrollIntoView({ block: "start", behavior: "instant" }));   // llega desde un evento: directo al pedido
addEventListener("resize", () => slidePill(needBox, needBox.querySelector('[aria-pressed="true"]'), true));
if (document.fonts) document.fonts.ready.then(() => slidePill(needBox, needBox.querySelector('[aria-pressed="true"]'), true));
