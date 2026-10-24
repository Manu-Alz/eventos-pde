/* cards.js · piezas de una publicación y tarjeta de la grilla
   Las usan la grilla, el calendario, el mapa y las páginas de eventos (tools/paginas.js).
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

/* Coordenadas para el mapa: geo del evento, o las del link "map" (query=lat,lng), o el lugar conocido en VENUES (config.js).
   Sin ninguna de las tres, el evento no tiene pin (null). */
function geoOf(e) {
  if (Array.isArray(e.geo)) return e.geo;
  const m = /query=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(e.map || "");
  if (m) return [+m[1], +m[2]];
  const place = norm(e.place);
  const key = Object.keys(typeof VENUES === "object" ? VENUES : {}).find(k => place.includes(norm(k)));
  return key ? VENUES[key] : null;
}

/* Punto para calcular el traslado: el del mapa (geoOf) o, si el lugar solo nombra una zona ("La Barra, Punta del Este"),
   el centro de esa zona. No se usa para el mapa, donde un pin aproximado confundiría. */
const RIDE_AREAS = { "la barra": [-34.9130, -54.8660], "manantiales": [-34.8990, -54.8290], "jose ignacio": [-34.8445, -54.6340],
  "maldonado": [-34.9080, -54.9560], "peninsula": [-34.9615, -54.9480], "playa brava": [-34.9360, -54.9330], "playa mansa": [-34.9360, -54.9330] };
function rideGeo(e) {
  const g = geoOf(e);
  if (g) return g;
  const place = norm(e.place);
  const key = Object.keys(RIDE_AREAS).find(k => place.includes(k));
  return key ? RIDE_AREAS[key] : null;
}

/* ¿Se ofrece traslado con chofer para este evento? Una sola regla para la página del evento y Armar plan:
   entradas a la venta + categoría de RIDE_CATS (config.js) + un lugar para calcular el precio.
   traslado: true / false en data.js lo fuerza o lo apaga. */
const rideOK = e => Boolean(rideGeo(e)) && (e.traslado === true
  || (e.traslado !== false && Boolean(e.tickets) && typeof RIDE_CATS !== "undefined" && RIDE_CATS.includes(e.cat)));

/* ¿Se reserva chofer propio en la web? (CHOFER.propio en config.js). Si no, en esos eventos sale Uber */
const choferPropio = () => typeof CHOFER === "object" && CHOFER.propio === true;
const rideBookable = e => rideOK(e) && choferPropio();

/* Uber con el lugar del evento ya cargado (link universal: abre la app o, si no la tiene, la web de Uber).
   "ir": desde donde está la persona hasta el evento. "volver": desde el evento; el destino lo pone en Uber. */
function uberUrl(e, way) {
  const g = rideGeo(e);
  if (!g) return "";
  const end = way === "ir" ? "dropoff" : "pickup";
  const q = [`action=setPickup`, way === "ir" ? "pickup=my_location" : "",
    `${end}[latitude]=${g[0]}`, `${end}[longitude]=${g[1]}`,
    `${end}[nickname]=${encodeURIComponent(shortPlace(e))}`, `${end}[formatted_address]=${encodeURIComponent(e.place)}`].filter(Boolean);
  return "https://m.uber.com/ul/?" + q.join("&");
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

/* ============ 3. Identidad de cada evento ============
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

/* ============ 4. Portada de la tarjeta ============
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
const tixHtml = e => (e.tickets ? `<span class="k-tix">${ico("ticket")}Entradas</span>` : "");

/* Línea chica sobre el título: "Fiestas · Sáb 23:00" (sin hora: "Fiestas · Sáb"; varios días: "Festivales · Varios días") */
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function eyebrowHtml(e) {
  const when = e.endDate && e.endDate !== e.date ? "Varios días"
    : DIAS_CORTOS[new Date(e.date + "T12:00:00Z").getUTCDay()] + (/^\d/.test(e.time) ? ` ${e.time}` : "");
  return `<p class="k-eyebrow"><i></i>${esc(e.cat)}<span aria-hidden="true">·</span>${esc(when)}</p>`;
}

/* Lugar corto para la tarjeta: sin paréntesis y hasta la primera coma ("Open Park, El Placer (puente…)" -> "Open Park").
   La página del evento muestra el lugar completo. */
const shortPlace = e => e.place.replace(/\s*\(.*?\)/g, "").split(", ")[0];

/* ============ 5. Tarjeta de la grilla ============
   Estructura: .cover + .k-top [.k-day, .k-acts (.k-tix?)] + .k-bottom [.k-eyebrow, h3 > a.k-link, .k-row (.k-place, .k-go)]
   Toda la tarjeta lleva a la página del evento (/evento/<id>/): el link del título se estira sobre la tarjeta (tarjetas.css).
   La tarjeta no ofrece Armar plan: eso se pide una sola vez, adentro de la página del evento. */
function cardEl(e) {
  const id = slugOf(e);
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = id;
  card.style.cssText = `--c:${CATS[e.cat]};${coverStyle(e)}`;
  card.innerHTML = `
    ${coverHtml(e)}
    <div class="k-top">
      <div class="k-day"><small>${monthLabel(e)}</small><b>${dayLabel(e)}</b></div>
      <div class="k-acts">${tixHtml(e)}</div>
    </div>
    <div class="k-bottom">
      ${eyebrowHtml(e)}
      <h3><a class="k-link" href="/evento/${id}/">${esc(e.title)}</a></h3>
      <div class="k-row">
        <p class="k-place">${ico("pin")}<span>${esc(shortPlace(e))}</span></p>
        <span class="k-go" aria-hidden="true">${ico("arrow")}</span>
      </div>
    </div>`;
  return card;
}
