/* cards.js · piezas de una publicación y tarjeta de la grilla
   Las usan la grilla, el calendario y el detalle.
   Requiere: config.js, utils.js */

/* ============ 1. Textos de fecha y hora ============ */
const timeLabel  = e => (/^\d/.test(e.time) ? `${e.time} hs` : e.time);
const dayLabel   = e => parseInt(e.date.slice(8), 10) + (e.endDate ? `–${parseInt(e.endDate.slice(8), 10)}` : "");
const monthLabel = e => MES[+e.date.slice(5, 7) - 1];

/* Orden de las listas: siempre por fecha y hora */
const compareEvents = (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

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

/* ============ 4. Identidad de cada evento ============
   slug: nombre corto para el link compartible (eventospde.com/#solomun-en-open-park-2026-12-29)
   hash: número fijo por título; sirve para que cada portada generada se vea distinta pero siempre igual */
const slugOf = e => (e.title + " " + e.date).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hashOf = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/* "martes 29 de diciembre" · para eventos de varios días: "23 al 29 de enero" */
function longDate(e) {
  const d = n => parseInt(n.slice(8), 10);
  if (e.endDate && e.endDate !== e.date) {
    const sameMonth = e.endDate.slice(0, 7) === e.date.slice(0, 7);
    return sameMonth
      ? `${d(e.date)} al ${d(e.endDate)} de ${MESES[+e.date.slice(5, 7) - 1]}`
      : `${d(e.date)} de ${MESES[+e.date.slice(5, 7) - 1]} al ${d(e.endDate)} de ${MESES[+e.endDate.slice(5, 7) - 1]}`;
  }
  const wd = DIAS[new Date(e.date + "T12:00:00Z").getUTCDay()];
  return `${wd} ${d(e.date)} de ${MESES[+e.date.slice(5, 7) - 1]}`;
}

/* ============ 5. Portada de la tarjeta ============
   Con foto (campo photo en data.js): la foto. Sin foto: un degradé con el color de la categoría,
   en una posición distinta para cada evento. El grano y la sombra los pone tarjetas.css. */
/* photo en data.js puede ser solo el nombre del archivo ("solomun-open-park.webp"): se busca en img/eventos/ */
const photoUrl = e => !e.photo ? "" : /[\/]/.test(e.photo) ? e.photo : "img/eventos/" + e.photo;

/* Si la foto no existe o no carga, la tarjeta queda con el degradé de color (nunca un hueco roto) */
const coverHtml = e => e.photo
  ? `<div class="cover"><img src="${esc(photoUrl(e))}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('gen');this.remove()"></div>`
  : '<div class="cover gen"></div>';

const coverStyle = e => { const h = hashOf(e.title); return `--gx:${18 + h % 64}%;--gy:${12 + (h >> 4) % 50}%`; };

/* Aviso en la tarjeta de los eventos con link de entradas */
const tixHtml = e => (e.tickets ? `<span class="k-tix">${ico("ticket")}Entradas a la venta</span>` : "");

/* ============ 6. Tarjeta de la grilla ============
   Estructura: .cover + .k-top [.k-date, .k-cat] + .k-bottom [h3, .k-meta, .k-go]
   Al tocarla se abre el detalle (detalle.js). Los links y botones viven adentro del detalle. */
function cardEl(e) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = slugOf(e);
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-haspopup", "dialog");
  card.setAttribute("aria-label", `${e.title}, ${longDate(e)}. Ver detalles`);
  card.style.cssText = `--c:${CATS[e.cat]};${coverStyle(e)}`;
  card.innerHTML = `
    ${coverHtml(e)}
    <div class="k-top">
      <div class="k-date"><b>${dayLabel(e)}</b><small>${monthLabel(e)}</small></div>
      <span class="k-cat"><i></i>${esc(e.cat)}</span>
    </div>
    <div class="k-bottom">
      ${tixHtml(e)}
      <h3>${esc(e.title)}</h3>
      <div class="k-row">
        <ul class="k-meta">
          <li><span class="k-ic">${ico("clock")}</span><span>${esc(timeLabel(e))}</span></li>
          <li><span class="k-ic">${ico("pin")}</span><span class="k-place">${esc(e.place)}</span></li>
        </ul>
        <span class="k-go" aria-hidden="true">${ico("arrow")}</span>
      </div>
    </div>`;
  return card;
}
