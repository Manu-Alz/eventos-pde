/* publicar.js · página de publicación: 1) elegir plan  2) datos del evento  3) pago
   Cobro: la persona recibe una referencia y paga con tarjeta en Mercado Pago (monto exacto: se confirma solo). Sin transferencia.
   Si el script no responde queda el link de monto libre y manda el comprobante. Vos cargás el evento en data.js.
   Requiere: config.js, utils.js, analytics.js, site.js */

const plansBox = $("plans");
const step2    = $("paso2");
const form     = $("form");
const done     = $("ok");
let selectedPlan = null;

/* ============ 0. Precios por día ============
   Los escalones salen de PLANS[].tiers en config.js. Se suman por tramos: nunca baja el total al sumar días. */
const clampDays = n => Math.min(MAX_DAYS, Math.max(1, Math.round(Number(n)) || 1));
function priceOf(plan, days) {
  let total = 0, from = 0;
  for (const [upTo, rate] of plan.tiers) {
    if (days <= from) break;
    total += (Math.min(days, upTo) - from) * rate;
    from = upTo;
  }
  return total;
}
const money = n => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));
const perDay = (plan, days) => money(priceOf(plan, days) / days);
const daysText = n => `${n} ${n === 1 ? "día" : "días"}`;
const QUICK_DAYS = [1, 3, 7, 14, 30];       // botones rápidos del formulario

/* "Días 1–2: US$ 6", "Del día 31: US$ 1" */
function tierRows(plan) {
  let from = 1;
  return plan.tiers.map(([upTo, rate]) => {
    const label = upTo === Infinity ? `Del día ${from}` : from === upTo ? `Día ${from}` : `Días ${from}–${upTo}`;
    from = upTo + 1;
    return `<li><span>${label}</span><b>US$ ${rate} por día</b></li>`;
  }).join("");
}

/* Fechas: mostrar "dd/mm/aaaa" (addDays está en utils.js) */
const dmy = iso => iso.split("-").reverse().join("/");
const todayIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

/* ============ 1. Planes ============ */
function planCard(plan) {
  const card = document.createElement("article");
  card.className = "plan" + (plan.popular ? " hl" : "");
  card.dataset.name = plan.name;
  card.innerHTML = `
    ${plan.popular ? `<div class="badge">${ico("star")}Popular</div>` : ""}
    <h3>${esc(plan.name)}</h3>
    <div class="price">US$ ${plan.tiers[0][1]} <small>/ día</small></div>
    <p class="billed">el primer día. Cuantos más días, menos pagás por día</p>
    <ul class="tiers">${tierRows(plan)}</ul>
    <p class="example">Ejemplo: <b>7 días = US$ ${priceOf(plan, 7)}</b> · 30 días = US$ ${priceOf(plan, 30)} (US$ ${perDay(plan, 30)} por día)</p>
    <ul>${plan.features.map(f => `<li>${ico("check")}<span>${esc(f)}</span></li>`).join("")}</ul>
    <button type="button" class="btn" aria-pressed="false">Elegir plan ${esc(plan.name)}</button>
    <p class="billed plan-blurb">${esc(plan.blurb)}</p>`;
  card.querySelector(".btn").onclick = () => choosePlan(plan);
  return card;
}

function choosePlan(plan) {
  selectedPlan = plan;
  track("plan_elegido", { plan: plan.name });
  done.style.display = "none";

  plansBox.querySelectorAll(".plan").forEach(el => {
    const on = el.dataset.name === plan.name;
    el.classList.toggle("on", on);
    const btn = el.querySelector(".btn");
    btn.setAttribute("aria-pressed", on);
    btn.textContent = on ? "Plan elegido" : `Elegir plan ${el.dataset.name}`;
  });

  $("chosenName").textContent = plan.name;
  paintQuick();
  updateTotal();
  step2.hidden = false;
  step2.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => form.elements.title.focus({ preventScroll: true }), 350);
}

PLANS.forEach(p => plansBox.appendChild(planCard(p)));
$("changePlan").onclick = () => plansBox.scrollIntoView({ behavior: "smooth", block: "center" });

/* ============ 2. Formulario ============ */
const CONTACT_FIELD = {
  WhatsApp:  { type: "tel",   hint: "+598 9X XXX XXX" },
  Email:     { type: "email", hint: "tu@email.com" },
  Instagram: { type: "text",  hint: "@tu_usuario" }
};

/* Total = suma por escalones de los días elegidos */
const daysOf = () => clampDays(form.elements.days.value);
const startOf = () => form.elements.start.value || todayIso();
function updateTotal() {
  const d = daysOf();
  const start = startOf();
  const note = $("daysNote");
  if (!selectedPlan) { $("total").textContent = ""; note.textContent = ""; return; }
  const total = priceOf(selectedPlan, d);
  $("total").textContent = `US$ ${total} (${daysText(d)} · US$ ${perDay(selectedPlan, d)} por día)`;
  note.textContent = `Se publica del ${dmy(start)} al ${dmy(addDays(start, d - 1))}.`;
  document.querySelectorAll("#quickDays button").forEach(b => b.setAttribute("aria-pressed", Number(b.dataset.d) === d));
}
function paintQuick() {                      // botones rápidos con su precio
  const box = $("quickDays");
  box.replaceChildren(...QUICK_DAYS.map(n => {
    const b = h("button", "chip", `${daysText(n)} · US$ ${priceOf(selectedPlan, n)}`);
    b.type = "button"; b.dataset.d = n;
    b.onclick = () => { form.elements.days.value = n; updateTotal(); };
    return b;
  }));
}
form.elements.days.max = MAX_DAYS;
form.elements.start.min = form.elements.start.value = todayIso();
form.elements.days.addEventListener("input", updateTotal);
form.elements.days.addEventListener("change", () => { form.elements.days.value = daysOf(); updateTotal(); });
form.elements.start.addEventListener("change", updateTotal);

Object.keys(CATS).forEach(name => form.elements.cat.appendChild(new Option(name, name)));

function syncContactField() {
  const f = CONTACT_FIELD[form.elements.contactMethod.value];
  form.elements.contact.type = f.type;
  form.elements.contact.placeholder = f.hint;
  form.elements.contact.value = "";
}
form.elements.contactMethod.addEventListener("change", syncContactField);
syncContactField();

/* ============ 3. Mensaje con los datos (WhatsApp y mail) ============ */
function eventSummary(plan, d) {
  const days = clampDays(d.days);
  const start = d.start || todayIso();
  const [yy, mm, dd] = d.date.split("-");
  return [
    `Plan: ${plan.name}`,
    `Días: ${days} (del ${dmy(start)} al ${dmy(addDays(start, days - 1))}) · total US$ ${priceOf(plan, days)} (US$ ${perDay(plan, days)} por día)`,
    `Evento: ${d.title}`,
    `Categoría: ${d.cat}`,
    `Fecha: ${dd}/${mm}/${yy} ${d.time} hs`,
    `Lugar: ${d.place}`,
    `Contacto (${d.contactMethod}): ${d.contact}`,
    d.tickets && `Link de entradas: ${d.tickets}`,
    d.link && `Otro link: ${d.link}`,
    d.desc && `Descripción: ${d.desc}`
  ].filter(Boolean).join("\n");
}

const buildMessage = (ref, method, plan, d) =>
  `Hola! Quiero publicar un evento en Eventos PDE.\nReferencia: ${ref}\nMétodo de pago: ${method || "a coordinar"}\n${eventSummary(plan, d)}`;

/* ============ 4. Pago ============ */
const isSet = v => Boolean(v) && !/^TU_/i.test(v);
const newRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "PDE-" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const h = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
};

function paypalPanel(plan, total, ref) {
  const a = h("a", "btn", `Pagar US$ ${total} con PayPal`);
  a.target = "_blank";
  a.rel = "noopener";
  a.href = `https://www.paypal.me/${encodeURIComponent(CONFIG.paypal)}/${total}USD`;
  a.dataset.ev = "pago_paypal";
  a.dataset.c = plan.name;
  return [a, h("p", "note", `Escribí la referencia ${ref} en la nota del pago.`)];
}

/* Mercado Pago: link de monto libre en pesos (CONFIG.mercadopago). Se muestra cuántos pesos escribir. */
const MP = CONFIG.mercadopago || {};
const mpOn = Boolean(safeUrl(MP.link)) && MP.uyuRate > 0;
const pesos = usd => "$U " + Math.round(usd * MP.uyuRate).toLocaleString("es-UY");
/* Con el script nuevo, Mercado Pago cobra el monto exacto (payUrl); si no, queda el link de monto libre */
function mpPanel(plan, total, ref, payUrl) {
  const a = h("a", "btn", `Pagar US$ ${total} con tarjeta`);
  a.target = "_blank";
  a.rel = "noopener";
  a.href = safeUrl(payUrl) || safeUrl(MP.link);
  a.dataset.ev = "pago_mercadopago";
  a.dataset.c = plan.name;
  return [a, h("p", "note", payUrl
    ? `Se abre Mercado Pago con el monto exacto (US$ ${total} = ${pesos(total)}): pagá con tarjeta de crédito o débito. Se confirma al instante.`
    : `Se abre Mercado Pago: escribí ${pesos(total)} (US$ ${total} a $U ${MP.uyuRate}) y pagá con tarjeta de crédito o débito.`)];
}

/* ============ 5. Aviso automático ============
   Si CONFIG.formUrl está cargado, manda la solicitud al script de Google (ver apps-script/Code.gs):
   queda en la planilla y te llega un mail. Con el script nuevo contesta { ok, pago }: pago = link de Mercado Pago
   por el monto exacto. Si no contesta, devuelve null (la solicitud igual queda enviada) y se usa el link de monto libre. */
async function notifyRequest(plan, d, ref, total) {
  if (!CONFIG.formUrl) return null;
  const days = clampDays(d.days);
  const body = JSON.stringify({ ...d, days, until: addDays(d.start || todayIso(), days - 1), ref, plan: plan.name, total });
  try {
    const res = await fetch(CONFIG.formUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body });
    return await res.json();
  } catch (_) { return null; }
}

/* ============ 6. Envío ============ */
form.addEventListener("submit", async ev => {
  ev.preventDefault();
  if (!selectedPlan) return;
  const sendBtn = form.querySelector('[type="submit"]');
  sendBtn.disabled = true; sendBtn.textContent = "Enviando…";

  const plan = selectedPlan;
  const data = Object.fromEntries(new FormData(form));
  const days = clampDays(data.days);
  const total = priceOf(plan, days);
  const start = data.start || todayIso();
  const ref = newRef();
  const answer = await notifyRequest(plan, data, ref, total);
  const payUrl = answer && answer.pago;
  sendBtn.disabled = false; sendBtn.textContent = "Enviar evento";
  const methods = [mpOn && "Mercado Pago", isSet(CONFIG.paypal) && "PayPal"].filter(Boolean);   // sin transferencia: se paga con tarjeta

  /* Cuadro de pago: encabezado · resumen (total, días, referencia) · paso 1 pagar · paso 2 comprobante */
  const tabs  = h("div", "seg has-pill");
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Forma de pago");
  const panel = h("div", "pay");
  const wa    = h("a", "btn", "Enviar por WhatsApp");
  const mail  = h("a", "btn ghost", "Enviar por mail");
  [wa, mail].forEach(a => { a.dataset.ev = "enviar_comprobante"; a.dataset.n = data.title; a.dataset.c = plan.name; });
  wa.target = "_blank"; wa.rel = "noopener";

  function showMethod(method) {
    panel.replaceChildren(...(method === "PayPal" ? paypalPanel(plan, total, ref)
      : method === "Mercado Pago" ? mpPanel(plan, total, ref, payUrl) : [h("p", "note", "Te pasamos los datos de pago por WhatsApp o mail.")]));
    tabs.querySelectorAll("button").forEach(t => t.setAttribute("aria-pressed", t.textContent === method));
    slidePill(tabs, tabs.querySelector('[aria-pressed="true"]'));
    const msg = buildMessage(ref, method, plan, data);
    wa.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
    mail.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Publicar evento " + ref)}&body=${encodeURIComponent(msg)}`;
  }

  methods.forEach(m => {
    const t = h("button", "", m);
    t.type = "button";
    t.onclick = () => showMethod(m);
    tabs.appendChild(t);
  });

  const stat = (label, value, sub, cls = "") => {
    const d = h("div", "ok-stat " + cls);
    d.append(h("small", "", label), h("b", "", value));
    if (sub) d.append(h("span", "", sub));
    return d;
  };
  const head = h("div", "ok-head");
  const check = h("span", "ok-check");
  check.innerHTML = ico("check");
  const headText = h("div");
  headText.append(h("h3", "", CONFIG.formUrl ? `¡Recibimos “${data.title}”!` : `Armamos tu solicitud de “${data.title}”`),
    h("p", "", "Falta el pago para publicarlo. Guardá tu referencia."));
  head.append(check, headText);

  const sum = h("div", "ok-sum");
  sum.append(
    stat("Total", `US$ ${total}`, mpOn ? pesos(total) : ""),
    stat("Publicación", daysText(days), `${dmy(start).slice(0, 5)} al ${dmy(addDays(start, days - 1)).slice(0, 5)}`),
    stat("Tu referencia", ref, "", "ok-ref"));

  const step = (n, title, ...body) => {
    const s = h("section", "ok-step");
    const t = h("h4");
    t.append(h("span", "", n), title);
    s.append(t, ...body);
    return s;
  };
  const payTitle = methods.length > 1 ? "Elegí cómo pagar" : "Pagá con tarjeta";
  const sendrow = h("div", "sendrow");
  sendrow.append(wa, mail);

  done.replaceChildren(
    head,
    sum,
    ...(plan.name === "Portada" ? [h("p", "ok-callout", "La portada tiene lugares limitados: antes de cobrarte confirmamos por WhatsApp o mail que tu fecha esté libre.")] : []),
    step("1", payTitle, ...(methods.length > 1 ? [tabs] : []), panel),
    /* Con el monto exacto (payUrl) el pago se confirma solo; con el link de monto libre hay que mandar el comprobante */
    payUrl && plan.name !== "Portada"
      ? step("2", "Listo, se confirma solo", h("p", "note", `Cuando se aprueba el pago te llega un mail y publicamos tu evento. ¿Dudas? Escribinos con tu referencia ${ref}.`), sendrow)
      : step("2", "Mandanos el comprobante", h("p", "note", `Con tu referencia ${ref}: lo verificamos y publicamos tu evento.`), sendrow)
  );
  done.style.display = "block";
  showMethod(methods[0] || null);

  track("enviar_evento", { plan: plan.name, categoria: data.cat });
  form.reset();
  form.elements.days.value = 7;
  form.elements.start.value = todayIso();
  syncContactField();
  updateTotal();
  done.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

/* La píldora de la forma de pago sigue al botón si cambia el ancho de la pantalla */
addEventListener("resize", () => document.querySelectorAll(".seg").forEach(s => slidePill(s, s.querySelector('[aria-pressed="true"]'), true)));

/* ============ 7. Preguntas frecuentes ============
   Cada respuesta se despliega y se recoge con una animación (en vez de aparecer de golpe).
   Si se toca de nuevo a mitad de camino, sigue desde donde estaba. */
const FAQ_MS = 320;
document.querySelectorAll(".faq details").forEach(d => {
  const body = d.querySelector("p");
  let anim = null;
  d.querySelector("summary").addEventListener("click", ev => {
    ev.preventDefault();
    const opening = !d.classList.contains("is-open");
    d.classList.toggle("is-open", opening);
    const now = d.open ? body.getBoundingClientRect().height : 0;   // alto actual, aunque esté a mitad de la animación
    if (anim) anim.cancel();
    d.open = true;
    const full = body.scrollHeight, pad = getComputedStyle(body).paddingBottom;
    const shut = { height: "0px", paddingBottom: "0px", opacity: 0 }, open = { height: full + "px", paddingBottom: pad, opacity: 1 };
    const from = { height: now + "px", paddingBottom: now ? pad : "0px", opacity: now ? 1 : 0 };
    const ms = matchMedia("(prefers-reduced-motion:reduce)").matches ? 1 : FAQ_MS;
    const a = anim = body.animate([from, opening ? open : shut], { duration: ms, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    a.onfinish = () => { if (!opening) d.open = false; a.cancel(); if (anim === a) anim = null; };
    if (opening) track("faq", { pregunta: d.querySelector("summary").textContent });
  });
});
