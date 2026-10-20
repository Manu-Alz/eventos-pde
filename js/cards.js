/* cards.js · piezas de una publicación y tarjeta cuadrada
   Las usan la grilla, el Hot topic y el calendario.
   Requiere: config.js, utils.js */

/* ============ 1. Textos de fecha y hora ============ */
const timeLabel  = e => (/^\d/.test(e.time) ? `${e.time} hs` : e.time);
const dayLabel   = e => parseInt(e.date.slice(8), 10) + (e.endDate ? `–${parseInt(e.endDate.slice(8), 10)}` : "");
const monthLabel = e => MES[+e.date.slice(5, 7) - 1];

/* Orden de las listas: destacados primero, después por fecha y hora */
const compareEvents = (a, b) =>
  (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

/* ============ 2. Links ============ */
const trackAttrs = (name, e) => `data-ev="${name}" data-n="${esc(e.title)}" data-c="${esc(e.cat)}"`;

const contactLabel = url =>
  /wa\.me|whatsapp/i.test(url) ? "WhatsApp" : /instagram/i.test(url) ? "Instagram" : /^mailto:/i.test(url) ? "Email" : "Contacto";

/* Google Maps: el campo map manda; si no, se arma con el lugar. "A confirmar" no lleva link. */
function mapUrl(e) {
  if (e.map) return safeUrl(e.map);
  if (/a confirmar/i.test(e.place)) return "";
  let q = e.place.replace(/\(.*?\)/g, "").trim();
  q += /punta del este/i.test(q) ? ", Uruguay" : ", Punta del Este, Uruguay";
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
}

/* Link de entradas. Si el dominio está en AFILIADOS (config.js) se le agrega tu código
   y queda marcado como link de referido. */
function ticketLink(e) {
  const raw = safeUrl(e.tickets);
  if (!raw) return null;
  const rule = AFFILIATES[host(raw)];
  let url = raw;
  if (rule) {
    try {
      const u = new URL(raw);
      if (!u.searchParams.has(rule.param)) u.searchParams.set(rule.param, rule.code);
      url = u.toString();
    } catch (_) { /* link raro: se deja como vino */ }
  }
  return { url, affiliate: Boolean(rule || e.affiliate) };
}

/* ============ 3. Piezas HTML ============ */
/* Mini embed con ícono de link. Una publicación muestra uno solo: entradas, o si no hay, el link libre. */
function embedHtml(e) {
  const t = ticketLink(e);
  const free = safeUrl(e.link);
  if (!t && !free) return "";

  const url   = t ? t.url : free;
  const label = t ? "Comprar entradas" : (e.linkLabel || "Más información");
  const note  = t && t.affiliate ? " · enlace de referido" : "";
  const track = t ? (t.affiliate ? "referido" : "entradas") : "enlace";
  const rel   = t && t.affiliate ? "sponsored noopener" : "noopener";

  return `<a class="ref" href="${esc(url)}" target="_blank" rel="${rel}" ${trackAttrs(track, e)}>`
    + `<span class="ri">${ico("link")}</span>`
    + `<span class="rt"><b>${esc(label)}</b><small>${esc(host(url))}${note}</small></span></a>`;
}

function contactHtml(e) {
  const url = safeUrl(e.contact);
  return url ? `<a class="contact" href="${esc(url)}" target="_blank" rel="noopener" ${trackAttrs("contacto", e)}>${contactLabel(url)}</a>` : "";
}

const whenHtml = e => `<span class="when">${ico("clock")}<span>${esc(timeLabel(e))}</span></span>`;

function whereHtml(e) {
  const url = mapUrl(e);
  const place = url
    ? `<a class="maplink" href="${esc(url)}" target="_blank" rel="noopener" ${trackAttrs("mapa", e)} aria-label="${esc(e.place)}: ver en Google Maps (abre en otra pestaña)">${esc(e.place)} <span aria-hidden="true">↗</span></a>`
    : esc(e.place);
  return `<span class="where">${ico("pin")}<span class="place">${place}</span></span>`;
}

const dateHtml = e => `<div class="date"><b>${dayLabel(e)}</b><small>${monthLabel(e)}</small></div>`;

/* ============ 4. Tarjeta cuadrada de la grilla ============
   Estructura: .band + .body > [.card-head, h3, .ref?, p, .card-foot] */
function cardEl(e) {
  const card = document.createElement("article");
  card.className = "card" + (e.featured ? " top" : "");
  card.style.setProperty("--c", CATS[e.cat]);
  card.innerHTML = `
    <div class="band"></div>
    <div class="body">
      <div class="card-head">
        ${dateHtml(e)}
        <span class="tag">${esc(e.cat)}${e.featured ? '<span class="feat">Destacado</span>' : ""}</span>
      </div>
      <h3>${esc(e.title)}</h3>
      ${embedHtml(e)}
      <p>${esc(e.desc)}</p>
      <div class="card-foot">
        <div class="foot-row">${whenHtml(e)}${contactHtml(e)}</div>
        ${whereHtml(e)}
      </div>
    </div>`;
  return card;
}
