/* pagar.js · página de pago de un pedido: el link que le llega al cliente por mail (pagar.html?ref=SRV-XXXXX&k=clave).
   Lee el pedido del script de Google (apps-script/Code.gs, doGet), muestra el resumen tipo comprobante y cobra con
   Mercado Pago por el monto exacto. Al volver de Mercado Pago confirma el pago y muestra "Pagado".
   Si Mercado Pago no está disponible, queda la transferencia bancaria (datos de config.js).
   Requiere: config.js, utils.js, analytics.js, site.js, css/pagar.css */

const qs = new URLSearchParams(location.search);
const REF = qs.get("ref"), KEY = qs.get("k");
const payBox = $("pay");
const api = params => fetch(`${CONFIG.formUrl}?${new URLSearchParams(params)}`).then(r => r.json());

const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

/* Tarjeta con un mensaje (cargando, error, sin precio) */
function message(title, text, withContact = true) {
  const card = node("div", "pay-card");
  card.append(node("h1", "pay-title", title), node("p", "pay-text", text));
  if (withContact) {
    const a = node("a", "btn ghost", "Escribinos");
    a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Pedido " + (REF || ""))}`;
    card.append(a);
  }
  payBox.replaceChildren(card);
}

/* Datos de la transferencia (se muestran al tocar "Pagar por transferencia") */
function bankBox(p) {
  const b = CONFIG.bank, dl = node("dl", "pay-bank");
  [["Monto", `US$ ${p.usd}`], ["Titular", b.titular], ["Banco", b.banco], ["Tipo de cuenta", b.tipo], ["N° de cuenta", b.cuenta], ["Referencia", p.ref]]
    .filter(([, v]) => v)
    .forEach(([k, v]) => dl.append(node("dt", "", k), node("dd", "", v)));
  const wrap = node("div", "pay-bank-wrap");
  wrap.hidden = true;
  wrap.append(dl, node("p", "pay-fine", "Poné la referencia en el concepto y respondé el mail de la cotización con el comprobante."));
  return wrap;
}

function render(p) {
  const card = node("div", "pay-card");
  const head = node("div", "pay-head");
  head.append(node("p", "pay-eyebrow", `Pedido ${p.ref}`), node("h1", "pay-title", p.titulo));
  if (p.evento) head.append(node("p", "pay-text", p.evento));

  /* Comprobante claro: detalle, líneas y total */
  const receipt = node("div", "pay-receipt");
  if (p.detalle) { const inc = node("p", "pay-incl"); inc.append(node("b", "", "Incluye: "), p.detalle); receipt.append(inc); }
  const ul = node("ul", "pay-lines");
  (p.lineas || []).forEach(l => ul.append(node("li", "", l)));
  receipt.append(ul);
  const total = node("div", "pay-total");
  total.append(node("span", "", "Total"), node("b", "", p.usd ? `US$ ${p.usd}` : "A cotizar"));
  receipt.append(total);
  if (p.usd && p.pesos) receipt.append(node("p", "pay-pesos", `En Mercado Pago: ${p.pesos}`));

  card.append(head, receipt);

  if (p.estado === "Pagado") {
    const ok = node("div", "pay-done");
    ok.innerHTML = ico("check");
    ok.append(node("b", "", "Pago confirmado"), node("span", "", "Te escribimos por mail con los próximos pasos."));
    card.append(ok);
  } else if (!p.usd) {
    card.append(node("p", "pay-text", "Estamos armando tu cotización. Te llega por mail con el botón para pagar."));
  } else {
    if (p.portada) card.append(node("p", "pay-note", "La portada tiene lugares limitados: si todavía no te confirmamos la fecha, esperá nuestro mail antes de pagar."));
    const mp = node("button", "btn pay-mp", "Pagar con Mercado Pago");
    mp.type = "button";
    const bank = bankBox(p);
    const other = node("button", "pay-alt", "Prefiero pagar por transferencia");
    other.type = "button";
    other.onclick = () => { bank.hidden = !bank.hidden; track("pago_transferencia", { ref: p.ref }); };
    mp.onclick = async () => {
      mp.disabled = true; mp.textContent = "Abriendo Mercado Pago…";
      track("pago_mercadopago", { ref: p.ref, usd: p.usd });
      try {
        const r = await api({ accion: "pagar", ref: p.ref, k: KEY });
        if (r.ok && r.url) { location.href = r.url; return; }
        alert(r.error || "No pudimos abrir Mercado Pago. Probá por transferencia.");
      } catch (_) { alert("No pudimos abrir Mercado Pago. Revisá la conexión o probá por transferencia."); }
      mp.disabled = false; mp.textContent = "Pagar con Mercado Pago";
    };
    const trust = node("p", "pay-fine", "Pago seguro con Mercado Pago: tarjeta de crédito, débito o efectivo en redes de cobranza. Eventos PDE no ve ni guarda los datos de tu tarjeta.");
    card.append(mp, trust, other, bank);
  }
  payBox.replaceChildren(card);
}

async function start() {
  if (!REF || !KEY || !CONFIG.formUrl) { message("Falta el link completo", "Abrí el link del mail tal como te llegó. Si no lo encontrás, escribinos y te lo reenviamos."); return; }
  /* Volviendo de Mercado Pago: se confirma el pago antes de mostrar el pedido */
  const paymentId = qs.get("payment_id") || qs.get("collection_id");
  const status = qs.get("status") || qs.get("collection_status");
  try {
    if (paymentId && status === "approved") await api({ accion: "verificar", payment_id: paymentId });
    const p = await api({ accion: "pedido", ref: REF, k: KEY });
    if (!p.ok) { message("No encontramos el pedido", p.error || "Revisá el link del mail."); return; }
    render(p);
    if (status && status !== "approved" && p.estado !== "Pagado") {
      payBox.querySelector(".pay-card").prepend(node("p", "pay-note", status === "pending" || status === "in_process"
        ? "Tu pago quedó pendiente en Mercado Pago. Cuando se acredite, te llega la confirmación por mail."
        : "El pago no se completó. Podés intentarlo de nuevo o elegir otro medio."));
    }
  } catch (_) {
    message("No pudimos cargar el pedido", "Revisá tu conexión y recargá la página.");
  }
}
start();
