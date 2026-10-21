/* publicar.js · página de publicación: 1) elegir plan  2) datos del evento  3) pago
   El cobro es manual: la persona recibe una referencia, paga por depósito o PayPal y manda el
   comprobante por WhatsApp o mail. Vos verificás el pago y cargás el evento en data.js.
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

/* Fechas: sumar días a "AAAA-MM-DD" y mostrar "dd/mm/aaaa" */
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
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
const bankAmount = total => (CONFIG.bank.moneda === "UYU" && CONFIG.bank.uyuRate > 0 ? `$U ${Math.round(total * CONFIG.bank.uyuRate)}` : `US$ ${total}`);

const h = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
};

function bankPanel(total, ref) {
  const b = CONFIG.bank;
  const dl = h("dl", "dl");
  [["Monto", bankAmount(total)], ["Titular", b.titular], ["Banco", b.banco], ["Tipo de cuenta", b.tipo], ["N° de cuenta", b.cuenta], ["Referencia", ref]]
    .filter(([label, value]) => label === "Monto" || label === "Referencia" || isSet(value))
    .forEach(([label, value]) => { dl.append(h("dt", "", label), h("dd", "", value)); });
  return [dl, h("p", "note", "Depositá el monto indicando la referencia y mandanos el comprobante por WhatsApp o mail.")];
}

function paypalPanel(plan, total, ref) {
  const a = h("a", "btn", `Pagar US$ ${total} con PayPal`);
  a.target = "_blank";
  a.rel = "noopener";
  a.href = `https://www.paypal.me/${encodeURIComponent(CONFIG.paypal)}/${total}USD`;
  a.dataset.ev = "pago_paypal";
  a.dataset.c = plan.name;
  return [a, h("p", "note", `Escribí la referencia ${ref} en la nota del pago y después avisanos por WhatsApp o mail.`)];
}

/* ============ 5. Aviso automático ============
   Si CONFIG.formUrl está cargado, manda la solicitud al script de Google (ver apps-script/Code.gs):
   queda en la planilla y te llega un mail. Si falla, la persona igual puede avisar por WhatsApp o mail. */
function notifyRequest(plan, d, ref, total) {
  if (!CONFIG.formUrl) return;
  const days = clampDays(d.days);
  const body = JSON.stringify({ ...d, days, until: addDays(d.start || todayIso(), days - 1), ref, plan: plan.name, total });
  fetch(CONFIG.formUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
}

/* ============ 6. Envío ============ */
form.addEventListener("submit", ev => {
  ev.preventDefault();
  if (!selectedPlan) return;

  const plan = selectedPlan;
  const data = Object.fromEntries(new FormData(form));
  const days = clampDays(data.days);
  const total = priceOf(plan, days);
  const start = data.start || todayIso();
  const ref = newRef();
  notifyRequest(plan, data, ref, total);
  const methods = [isSet(CONFIG.bank.cuenta) && "Depósito bancario", isSet(CONFIG.paypal) && "PayPal"].filter(Boolean);

  const tabs  = h("div", "paytabs");
  const panel = h("div", "pay");
  const wa    = h("a", "btn", "Enviar por WhatsApp");
  const mail  = h("a", "btn ghost", "Enviar por mail");
  [wa, mail].forEach(a => { a.dataset.ev = "enviar_comprobante"; a.dataset.n = data.title; a.dataset.c = plan.name; });
  wa.target = "_blank"; wa.rel = "noopener";

  function showMethod(method) {
    panel.replaceChildren(...(method === "Depósito bancario" ? bankPanel(total, ref) : method === "PayPal" ? paypalPanel(plan, total, ref) : []));
    tabs.querySelectorAll("button").forEach(t => t.setAttribute("aria-pressed", t.textContent === method));
    const msg = buildMessage(ref, method, plan, data);
    wa.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
    mail.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Publicar evento " + ref)}&body=${encodeURIComponent(msg)}`;
  }

  methods.forEach(m => {
    const t = h("button", "chip", m);
    t.type = "button";
    t.onclick = () => showMethod(m);
    tabs.appendChild(t);
  });

  done.replaceChildren(
    h("p", "", `${CONFIG.formUrl ? `¡Recibimos “${data.title}”!` : `Armamos tu solicitud de “${data.title}”.`} Falta el pago de US$ ${total} (${daysText(days)}, del ${dmy(start)} al ${dmy(addDays(start, days - 1))}) para publicarlo. Tu referencia es:`),
    h("div", "refcode", ref),
    ...(plan.name === "Portada" ? [h("p", "note", "La portada tiene lugares limitados: antes de cobrarte confirmamos por WhatsApp o mail que tu fecha esté libre.")] : []),
    /* Un solo método: se muestra directo, sin botón. Dos o más: botones para elegir. */
    ...(methods.length > 1 ? [h("p", "", "Elegí cómo pagar:"), tabs]
      : methods.length === 1 ? [h("p", "", `Pagá por ${methods[0] === "PayPal" ? "PayPal" : "depósito bancario"}:`)]
      : [h("p", "note", "Te pasamos los datos de pago por WhatsApp o mail.")]),
    panel,
    h("p", "", "Cuando pagues, mandanos el comprobante:"),
    h("div", "sendrow")
  );
  done.querySelector(".sendrow").append(wa, mail);
  showMethod(methods[0] || null);

  done.style.display = "block";
  track("enviar_evento", { plan: plan.name, categoria: data.cat });
  form.reset();
  form.elements.days.value = 7;
  form.elements.start.value = todayIso();
  syncContactField();
  updateTotal();
  done.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
