/* publicar.js · página de publicación: 1) elegir plan  2) datos del evento  3) pago
   El cobro es manual: la persona recibe una referencia, paga por depósito o PayPal y manda el
   comprobante por WhatsApp o mail. Vos verificás el pago y cargás el evento en data.js.
   Requiere: config.js, utils.js, analytics.js, site.js */

const plansBox = $("plans");
const step2    = $("paso2");
const form     = $("form");
const done     = $("ok");
let selectedPlan = null;

/* ============ 1. Planes ============ */
function planCard(plan) {
  const card = document.createElement("article");
  card.className = "plan" + (plan.popular ? " hl" : "");
  card.dataset.name = plan.name;
  card.innerHTML = `
    ${plan.popular ? `<div class="badge">${ico("star")}Popular</div>` : ""}
    <h3>${esc(plan.name)}</h3>
    <div class="price">US$ ${plan.price} <small>/ semana</small></div>
    <p class="billed">por semana publicada</p>
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

  $("chosenName").textContent = `${plan.name} (US$ ${plan.price} por semana)`;
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

/* Total = precio semanal x semanas elegidas */
const weeksOf = () => Number(form.elements.weeks.value) || 1;
const totalOf = (plan, weeks) => plan.price * weeks;
function updateTotal() {
  const w = weeksOf();
  $("total").textContent = selectedPlan ? `US$ ${totalOf(selectedPlan, w)} (${w} ${w === 1 ? "semana" : "semanas"})` : "";
}
form.elements.weeks.addEventListener("change", updateTotal);

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
  const weeks = Number(d.weeks) || 1;
  const [yy, mm, dd] = d.date.split("-");
  return [
    `Plan: ${plan.name} (US$ ${plan.price} por semana)`,
    `Semanas: ${weeks} (total US$ ${totalOf(plan, weeks)})`,
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
  const body = JSON.stringify({ ...d, ref, plan: plan.name, total });
  fetch(CONFIG.formUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
}

/* ============ 6. Envío ============ */
form.addEventListener("submit", ev => {
  ev.preventDefault();
  if (!selectedPlan) return;

  const plan = selectedPlan;
  const data = Object.fromEntries(new FormData(form));
  const total = totalOf(plan, Number(data.weeks) || 1);
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
    h("p", "", `${CONFIG.formUrl ? `¡Recibimos “${data.title}”!` : `Armamos tu solicitud de “${data.title}”.`} Falta el pago de US$ ${total} (${data.weeks} ${Number(data.weeks) === 1 ? "semana" : "semanas"}) para publicarlo. Tu referencia es:`),
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
  syncContactField();
  updateTotal();
  done.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
