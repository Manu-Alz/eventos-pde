/* pagar.js · página de pago de un pedido: el link que le llega al cliente por mail (pagar.html?ref=SRV-XXXXX&k=clave).
   Lee el pedido del script de Google (apps-script/Code.gs, doGet), muestra el resumen tipo comprobante y cobra con
   Mercado Pago por el monto exacto, solo con tarjeta (crédito o débito) o saldo de Mercado Pago. Al volver confirma el pago y muestra "Pagado".
   Si Mercado Pago no está disponible, ofrece escribirnos por WhatsApp (no se ofrece transferencia).
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

/* Si Mercado Pago no abre: aviso con un link de WhatsApp que ya trae la referencia */
function payHelp(card, p, text) {
  card.querySelector(".pay-help")?.remove();
  const help = node("p", "pay-note pay-help", text + " ");
  const a = node("a", "", "Escribinos por WhatsApp");
  a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Hola! No pude pagar el pedido ${p.ref} con tarjeta.`)}`;
  a.target = "_blank"; a.rel = "noopener";
  help.append(a, " y te mandamos otro link.");
  card.append(help);
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
    const label = `Pagar US$ ${p.usd} con tarjeta`;
    const mp = node("button", "btn pay-mp", label);
    mp.type = "button";
    mp.onclick = async () => {
      mp.disabled = true; mp.textContent = "Abriendo el pago…";
      track("pago_mercadopago", { ref: p.ref, usd: p.usd });
      try {
        const r = await api({ accion: "pagar", ref: p.ref, k: KEY });
        if (r.ok && r.url) { location.href = r.url; return; }
        payHelp(card, p, r.error || "No pudimos abrir el pago.");
      } catch (_) { payHelp(card, p, "No pudimos abrir el pago. Revisá la conexión y probá de nuevo, o"); }
      mp.disabled = false; mp.textContent = label;
    };
    const trust = node("p", "pay-fine pay-trust");
    trust.innerHTML = `${ico("check")}<span>Pago seguro con tarjeta de crédito o débito, a través de Mercado Pago. Eventos PDE no ve ni guarda los datos de tu tarjeta.</span>`;
    card.append(mp, trust);
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
        : "El pago no se completó. Podés intentarlo de nuevo con la misma u otra tarjeta."));
    }
  } catch (_) {
    message("No pudimos cargar el pedido", "Revisá tu conexión y recargá la página.");
  }
}
start();
