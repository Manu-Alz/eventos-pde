/* paginas.js · arma una página propia para cada evento vigente (eventospde.com/evento/<id>/) y el sitemap.
   No se edita a mano ni se sube nada a mano: lo corre GitHub solo (tools/build-eventos.js, .github/workflows/eventos.yml)
   cada vez que cambia data.js y todos los días a la mañana (así los eventos vencidos dejan de tener página).
   Cada página es HTML completo: Google la lee sin JavaScript, y al compartirla en WhatsApp o Instagram se ve el póster.
   Usa lo mismo que la web: config.js, data.js, utils.js y cards.js (se cargan antes que este archivo).
   Índice: 1 Ajustes · 2 Piezas · 3 Página de un evento · 4 Sitemap · 5 Todo junto */

/* ============ 1. Ajustes ============ */
const SITE = "https://eventospde.com";
const MORE_EVENTS = 6;                        // "Más eventos en Punta" al pie de cada página
const STATIC_PAGES = [                        // páginas fijas del sitemap: [dirección, prioridad, frecuencia]
  ["/", "1.0", "daily"], ["/plan.html", "0.8", "monthly"], ["/publicar.html", "0.6", "monthly"], ["/nosotros.html", "0.5", "monthly"]
];

/* ============ 2. Piezas ============ */
const isLiveEvent = e => (e.endDate || e.date) >= TODAY && (!e.until || e.until >= TODAY) && (!e.from || e.from <= TODAY);
const eventPath = e => `/evento/${slugOf(e)}/`;
const absPhoto = e => (e.photo ? new URL("/" + photoUrl(e), SITE).href : `${SITE}/img/og.jpg?v=2`);
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);
const hasTime = e => /^\d{1,2}:\d{2}$/.test(e.time);
const DIAS_C = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/* Google Calendar (igual que el botón Agendar del detalle) */
function gcalUrl(e) {
  const flat = iso => iso.replace(/-/g, "");
  let dates;
  if (hasTime(e)) {
    const t0 = new Date(`${e.date}T${e.time.padStart(5, "0")}:00Z`), t1 = new Date(t0.getTime() + 3 * 36e5);
    const fmt = d => d.toISOString().slice(0, 19).replace(/[-:]/g, "");
    dates = `${fmt(t0)}/${fmt(t1)}`;
  } else dates = `${flat(e.date)}/${flat(addDays(e.endDate || e.date, 1))}`;
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, ctz: "America/Montevideo",
    details: `${e.desc}\n\n${SITE}${eventPath(e)}`, location: /a confirmar/i.test(e.place) ? "Punta del Este, Uruguay" : e.place });
  return "https://calendar.google.com/calendar/render?" + p;
}

/* Datos para Google: el evento y el camino Agenda > evento */
function eventJsonLd(e) {
  const t = ticketLink(e), geo = geoOf(e);
  const start = hasTime(e) ? `${e.date}T${e.time.padStart(5, "0")}:00-03:00` : e.date;
  return [{
    "@context": "https://schema.org", "@type": "Event",
    name: e.title, description: e.desc, startDate: start,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: shortPlace(e),
      address: { "@type": "PostalAddress", streetAddress: e.place, addressLocality: "Punta del Este", addressRegion: "Maldonado", addressCountry: "UY" },
      ...(geo ? { geo: { "@type": "GeoCoordinates", latitude: geo[0], longitude: geo[1] } } : {}) },
    image: [absPhoto(e)],
    url: SITE + eventPath(e),
    organizer: { "@type": "Organization", name: "Eventos PDE", url: SITE + "/" },
    ...(t ? { offers: { "@type": "Offer", url: t.url, availability: "https://schema.org/InStock" } } : {})
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Agenda de Punta del Este", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: e.title, item: SITE + eventPath(e) }
    ]
  }];
}

/* Mapa del lugar (Google Maps sin cuenta ni clave): con las coordenadas si se conocen, si no con la dirección */
function mapEmbed(e, route) {
  if (!route) return "";
  const g = geoOf(e);
  const q = g ? g.join(",") : (new URL(route).searchParams.get("query") || e.place);
  return `<div class="ev-map"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&amp;z=15&amp;output=embed" title="Mapa: ${esc(e.place)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        <a class="ev-go" href="${esc(route)}" target="_blank" rel="noopener" data-ev="mapa" data-n="${esc(e.title)}">${ico("pin")}Cómo llegar</a></div>`;
}

const fact = (icon, label, value) =>
  `<li><span class="ev-ic">${ico(icon)}</span><div><small>${label}</small><b>${value}</b></div></li>`;

/* Tarjetita de "Más eventos en Punta" */
const moreCard = e => `
      <a class="ev-mini" href="${eventPath(e)}" style="--c:${CATS[e.cat]}">
        ${e.photo ? `<img src="/${esc(photoUrl(e))}" alt="" loading="lazy" decoding="async">` : '<span class="ev-mini-gen"></span>'}
        <span class="ev-mini-t"><small><i></i>${esc(dayLabel(e))} ${esc(monthLabel(e))} · ${esc(e.cat)}</small><b>${esc(e.title)}</b></span>
      </a>`;

/* "Traslado con chofer": solo en los eventos que cumplen rideOK (cards.js: entradas a la venta, fiesta o música en vivo).
   Con chofer propio (CHOFER.propio en config.js) es la reserva con pago (traslado.js); sin chofer propio, Uber.
   js/traslado.js arma el bloque con estos datos (precio al instante y pago con tarjeta); sin JavaScript queda el título.
   En los demás eventos va solo una línea discreta a Armar plan (aeropuerto y alojamiento). */
function rideBox(e) {
  const id = esc(slugOf(e));
  /* Sin chofer propio todavía (CHOFER.propio en config.js): "Cómo ir y volver" con Uber, con el lugar del evento ya cargado */
  if (rideOK(e) && !choferPropio()) return `<section class="ride ride-uber" aria-labelledby="uber-h">
        <div class="ride-head">
          <span class="ride-i">${ico("car")}</span>
          <div class="ride-ht">
            <p class="ride-eb">Cómo ir y volver</p>
            <h2 id="uber-h">Volvé seguro, sin manejar</h2>
            <p>Pedí un Uber con el lugar del evento ya cargado. Para la vuelta, tocá el botón cuando estés saliendo.</p>
          </div>
        </div>
        <div class="uber-btns">
          <a class="btn uber-go" href="${esc(uberUrl(e, "ir"))}" target="_blank" rel="noopener" data-ev="uber_ir" data-n="${esc(e.title)}"><span><b>Para ir</b><small>Hasta ${esc(shortPlace(e))}</small></span>${ico("arrow")}</a>
          <a class="btn uber-go" href="${esc(uberUrl(e, "volver"))}" target="_blank" rel="noopener" data-ev="uber_volver" data-n="${esc(e.title)}"><span><b>Para volver</b><small>Desde ${esc(shortPlace(e))}</small></span>${ico("arrow")}</a>
        </div>
        <p class="uber-fine">Se abre la app de Uber (o su web, si no la tenés). El precio lo ves en Uber antes de confirmar.</p>
        <a class="ride-plan" href="/plan.html?add=${id}" data-ev="plan_evento" data-n="${esc(e.title)}">¿Venís de afuera? Armá tu plan con aeropuerto y alojamiento ${ico("arrow")}</a>
      </section>`;
  if (!rideOK(e)) return `<a class="ev-planlink" href="/plan.html?add=${id}" data-ev="plan_evento" data-n="${esc(e.title)}">${ico("plane")}<span><b>¿Venís de afuera?</b> Armá tu plan con traslado del aeropuerto y alojamiento</span>${ico("arrow")}</a>`;
  return `<section class="ride" id="ride" aria-labelledby="ride-h" data-id="${id}" data-title="${esc(e.title)}" data-date="${e.date}"${e.endDate && e.endDate !== e.date ? ` data-end="${e.endDate}"` : ""} data-time="${esc(e.time)}" data-place="${esc(shortPlace(e))}" data-geo="${rideGeo(e).join(",")}">
        <h2 id="ride-h">Traslado con chofer</h2>
        <p>Te llevamos y te traemos, con precio final y pago con tarjeta.</p>
      </section>`;
}

/* ============ 3. Página de un evento ============ */
function eventPage(e, live, v) {
  const t = ticketLink(e), free = safeUrl(e.link), contact = safeUrl(e.contact), route = mapUrl(e);
  const url = SITE + eventPath(e);
  const when = `${cap1(longDate(e))}${hasTime(e) ? `, ${e.time} hs` : ""}`;
  const title = `${e.title} · ${when.replace(/, \d.*$/, "")} | Eventos PDE`;
  const desc = cut(`${e.title}: ${longDate(e)} en ${shortPlace(e)}, Punta del Este. ${e.desc}`, 158);
  const eyebrowWhen = e.endDate && e.endDate !== e.date ? "Varios días"
    : DIAS_C[new Date(e.date + "T12:00:00Z").getUTCDay()] + (hasTime(e) ? ` ${e.time}` : "");
  const others = live.filter(x => x !== e);                 // primero los que vienen después de este, después los de antes
  const more = [...others.filter(x => x.date >= e.date), ...others.filter(x => x.date < e.date)].slice(0, MORE_EVENTS);

  const main = t
    ? `<a class="btn ev-cta" href="${esc(t.url)}" target="_blank" rel="${t.affiliate ? "sponsored noopener" : "noopener"}" data-ev="${t.affiliate ? "referido" : "entradas"}" data-n="${esc(e.title)}" data-c="${esc(e.cat)}">${ico("ticket")}Comprar entradas</a>`
    : free ? `<a class="btn ev-cta" href="${esc(free)}" target="_blank" rel="noopener" data-ev="enlace" data-n="${esc(e.title)}">${ico("link")}${esc(e.linkLabel || "Más información")}</a>` : "";
  const second = [
    contact && `<a class="btn ghost" href="${esc(contact)}" target="_blank" rel="noopener" data-ev="contacto" data-n="${esc(e.title)}">${ico(contactLabel(contact) === "Instagram" ? "instagram" : contactLabel(contact) === "WhatsApp" ? "chat" : "mail")}${contactLabel(contact)}</a>`,
    `<a class="btn ghost" href="${esc(gcalUrl(e))}" target="_blank" rel="noopener" data-ev="agendar" data-n="${esc(e.title)}">${ico("calendar")}Agendar</a>`,
    `<a class="btn ghost" href="https://wa.me/?text=${encodeURIComponent(`${e.title} · ${longDate(e)}\n${url}`)}" target="_blank" rel="noopener" data-ev="compartir" data-n="${esc(e.title)}">${ico("share")}Compartir</a>`
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="format-detection" content="telephone=no">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#151518">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Eventos PDE">
<meta property="og:locale" content="es_UY">
<meta property="og:title" content="${esc(`${e.title} · ${cap1(longDate(e))}`)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(absPhoto(e))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css?v=${v}">
<link rel="stylesheet" href="/css/evento.css?v=${v}">
<link rel="stylesheet" href="/css/plan.css?v=${v}">
<script type="application/ld+json">${JSON.stringify(eventJsonLd(e)).replace(/</g, "\\u003c")}</script>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="logo" href="/" aria-label="Eventos PDE, inicio">Eventos<span>PDE</span></a>
    <div class="hact"><a class="btn ghost hide-sm" href="/plan.html">Armar plan</a><a class="btn" href="/publicar.html">Publicar evento</a></div>
  </header>

  <a class="ev-back" href="/">‹ Todos los eventos de Punta del Este</a>

  <main class="ev" style="--c:${CATS[e.cat]}">
    <div class="ev-poster">${e.photo ? `<img src="/${esc(photoUrl(e))}" alt="Póster de ${esc(e.title)}" fetchpriority="high">` : '<span class="ev-gen"></span>'}</div>
    <div class="ev-body">
      <p class="ev-eyebrow"><i></i>${esc(e.cat)}<span aria-hidden="true">·</span>${esc(eyebrowWhen)}</p>
      <h1>${esc(e.title)}</h1>
      <p class="ev-desc">${esc(e.desc)}</p>
      <ul class="ev-facts">
        ${fact("calendar", "Fecha", esc(cap1(longDate(e))))}
        ${fact("clock", "Hora", esc(timeLabel(e)))}
        ${fact("pin", "Lugar", route ? `<a href="${esc(route)}" target="_blank" rel="noopener" data-ev="mapa" data-n="${esc(e.title)}">${esc(e.place)} ↗</a>` : esc(e.place))}
        ${e.price ? fact("ticket", "Entradas (puede cambiar según el lote)", esc(e.price)) : ""}
      </ul>
      <div class="ev-actions">
        ${main}
        <div class="ev-row">${second}</div>
      </div>
      ${rideBox(e)}
      ${mapEmbed(e, route)}
    </div>
  </main>

  ${more.length ? `<section class="ev-more" aria-label="Más eventos">
    <h2>Más eventos en Punta</h2>
    <div class="ev-more-grid">${more.map(moreCard).join("")}
    </div>
    <a class="btn ghost ev-all" href="/agenda/">Ver toda la agenda</a>
    ${CAT_GUIDE[e.cat] ? `<a class="ev-catlink" href="/agenda/${CAT_GUIDE[e.cat].slug}/">${CAT_GUIDE[e.cat].more} →</a>` : ""}
  </section>` : ""}
</div>

${t ? `<div class="ev-buybar"><a class="btn" href="${esc(t.url)}" target="_blank" rel="${t.affiliate ? "sponsored noopener" : "noopener"}" data-ev="${t.affiliate ? "referido" : "entradas"}" data-n="${esc(e.title)}">${ico("ticket")}Comprar entradas${e.price ? ` · ${esc(e.price.replace(/^Desde /, "desde "))}` : ""}</a></div>` : ""}
<div class="wrap"><footer class="foot" id="site-footer"><span>Punta del Este, Uruguay</span></footer></div>

<script src="/js/config.js?v=${v}"></script>
<script src="/js/utils.js?v=${v}"></script>
<script src="/js/i18n.js?v=${v}"></script>
<script src="/js/analytics.js?v=${v}"></script>
<script src="/js/site.js?v=${v}"></script>
<script src="/js/plan.js?v=${v}"></script>
<script src="/js/tarifas.js?v=${v}"></script>
<script src="/js/traslado.js?v=${v}"></script>
</body>
</html>
`;
}

/* ============ 4. Sitemap ============ */
function sitemapXml(live, guides = []) {
  const row = (loc, pri, freq) => `  <url><loc>${SITE}${loc}</loc><lastmod>${TODAY}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(([loc, pri, freq]) => row(loc, pri, freq)).join("\n")}
${guides.map(g => row(g.path, g.path === "/agenda/" ? "0.9" : "0.8", "daily")).join("\n")}
${live.map(e => row(eventPath(e), "0.8", "weekly")).join("\n")}
</urlset>
`;
}

/* ============ 5. Todo junto ============
   Devuelve { "ruta/del/archivo": "contenido" }. v = número de versión de los CSS/JS (el mismo ?v= que usa index.html). */
function buildSite(v) {
  const live = EV.filter(isLiveEvent).sort(compareEvents);
  const guides = guideList(live);
  const files = { "sitemap.xml": sitemapXml(live, guides) };
  live.forEach(e => { files[`evento/${slugOf(e)}/index.html`] = eventPage(e, live, v); });
  guides.forEach(g => { files[g.path.slice(1) + "index.html"] = guidePage(g, guides, v); });
  return files;
}

/* ============ 6. Páginas de la agenda para Google ============
   Páginas fijas (HTML que Google lee directo) para lo que la gente busca: "eventos en Punta del Este" (/agenda/),
   cada categoría ("fiestas en Punta del Este"), Año Nuevo, cada mes y este fin de semana. Se arman con los eventos
   vigentes cada vez que corre el build (GitHub lo corre todos los días), y van en el sitemap.
   El texto de arriba de cada una está en CAT_GUIDE y en guideList: es lo que Google muestra, conviene que sea propio. */
const CAT_GUIDE = {
  "Fiestas": { slug: "fiestas-en-punta-del-este", h1: "Fiestas en Punta del Este", more: "Más fiestas en Punta del Este",
    intro: "Las fiestas de la temporada en Punta del Este, La Barra, Manantiales y José Ignacio: DJs internacionales, fiestas de Año Nuevo, sunsets y noches en Open Park, Narbona, Medellín Polo Club, Cipriani y más. Cada una con fecha, hora, lugar y link de entradas." },
  "Música en vivo": { slug: "musica-en-vivo-en-punta-del-este", h1: "Música en vivo en Punta del Este", more: "Más música en vivo en Punta del Este",
    intro: "Conciertos, shows y festivales de música en vivo en Punta del Este y Maldonado: clásica, jazz, rock y pop, con fecha, hora, lugar y entradas." },
  "Náutica": { slug: "nautica-en-punta-del-este", h1: "Náutica en Punta del Este", more: "Más náutica en Punta del Este",
    intro: "Regatas, circuitos de vela y eventos náuticos en el puerto de Punta del Este y la costa de Maldonado." },
  "Autos": { slug: "autos-en-punta-del-este", h1: "Autos en Punta del Este", more: "Más eventos de autos en Punta del Este",
    intro: "Karting, autos clásicos, exposiciones y carreras en Punta del Este: fechas, lugares y cómo llegar." },
  "Deportes": { slug: "deportes-en-punta-del-este", h1: "Deportes en Punta del Este", more: "Más deportes en Punta del Este",
    intro: "Triatlón, ciclismo, golf, running y torneos en Punta del Este y alrededores, con fecha, lugar e inscripción." },
  "Festivales": { slug: "festivales-en-punta-del-este", h1: "Festivales en Punta del Este", more: "Más festivales en Punta del Este",
    intro: "Festivales de cine, música y cultura en Punta del Este y Maldonado durante toda la temporada." },
  "Gastronomía": { slug: "gastronomia-en-punta-del-este", h1: "Gastronomía en Punta del Este", more: "Más gastronomía en Punta del Este",
    intro: "Ferias, cenas, catas y eventos gastronómicos en Punta del Este, La Barra y José Ignacio." }
};
const monthKey = iso => iso.slice(0, 7);
const monthName = ym => `${MESES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const touches = (e, from, to) => e.date <= to && (e.endDate || e.date) >= from;     // el evento cae entre esas fechas

function guideList(live) {
  const year = live.find(e => e.date >= `${TODAY.slice(0, 4)}-12-31`)?.date.slice(0, 4) || TODAY.slice(0, 4);
  const nye = `${year}-12-31`, nyeNext = addDays(nye, 1);
  /* Este fin de semana: del viernes al domingo (si hoy ya es fin de semana, el de ahora) */
  const wd = new Date(TODAY + "T12:00:00Z").getUTCDay();
  const fri = wd === 0 ? addDays(TODAY, -2) : wd === 6 ? addDays(TODAY, -1) : addDays(TODAY, 5 - wd), sun = addDays(fri, 2);
  const weekend = live.filter(e => touches(e, fri < TODAY ? TODAY : fri, sun));
  const guides = [{ path: "/agenda/", h1: "Eventos en Punta del Este", eyebrow: "Agenda completa",
    title: `Eventos en Punta del Este ${TODAY.slice(0, 4)}–${+TODAY.slice(0, 4) + 1}: agenda completa | Eventos PDE`,
    intro: "Todos los eventos de la temporada en Punta del Este, La Barra, Manantiales, José Ignacio y Maldonado: fiestas, música en vivo, deportes, náutica, autos, festivales y gastronomía. Ordenados por fecha, con hora, lugar y link de entradas.",
    events: live, byMonth: true }];
  guides.push({ path: "/agenda/este-fin-de-semana-en-punta-del-este/", h1: "Qué hacer este fin de semana en Punta del Este", eyebrow: "Este fin de semana",
    title: "Qué hacer este fin de semana en Punta del Este | Eventos PDE",
    intro: weekend.length ? `Eventos del ${parseInt(fri.slice(8), 10)} al ${parseInt(sun.slice(8), 10)} de ${MESES[+sun.slice(5, 7) - 1]} en Punta del Este: fiestas, shows, deportes y más, con hora, lugar y entradas.`
      : "Este fin de semana no hay eventos cargados en Punta del Este. Estos son los próximos, ordenados por fecha.",
    events: weekend.length ? weekend : live.slice(0, 12) });
  const nyeEvents = live.filter(e => touches(e, nye, nyeNext));
  if (nyeEvents.length) guides.push({ path: "/agenda/ano-nuevo-en-punta-del-este/", h1: `Año Nuevo ${+year + 1} en Punta del Este`, eyebrow: "Fin de año",
    title: `Año Nuevo ${+year + 1} en Punta del Este: fiestas y entradas | Eventos PDE`,
    intro: `Dónde recibir el ${+year + 1} en Punta del Este: las fiestas del 31 de diciembre en La Barra, Manantiales, José Ignacio y Punta, con open bar, DJs y links de entradas.`,
    events: nyeEvents });
  for (const [cat, g] of Object.entries(CAT_GUIDE)) {
    const evs = live.filter(e => e.cat === cat);
    if (evs.length) guides.push({ path: `/agenda/${g.slug}/`, h1: g.h1, eyebrow: cat, title: `${g.h1}: agenda y entradas | Eventos PDE`, intro: g.intro, events: evs, byMonth: evs.length > 6 });
  }
  for (const ym of [...new Set(live.map(e => monthKey(e.date)))]) {
    const evs = live.filter(e => touches(e, `${ym}-01`, `${ym}-31`)), m = monthName(ym);
    guides.push({ path: `/agenda/eventos-en-punta-del-este-${MESES[+ym.slice(5, 7) - 1]}-${ym.slice(0, 4)}/`, h1: `Eventos en Punta del Este en ${m}`, eyebrow: cap1(m), month: true,
      title: `Eventos en Punta del Este en ${m} | Eventos PDE`,
      intro: `Qué hacer en Punta del Este en ${m}: ${evs.length} ${evs.length === 1 ? "evento" : "eventos"} entre fiestas, música en vivo, deportes y más, con fecha, hora, lugar y entradas.`, events: evs });
  }
  return guides;
}

/* Tarjetita con hora (para las listas de la agenda) */
const guideCard = e => moreCard(e).replace("</small>", `${hasTime(e) ? ` · ${e.time}` : ""}</small>`);

function guidePage(g, guides, v) {
  const url = SITE + g.path;
  const desc = cut(g.intro, 158);
  const groups = g.byMonth
    ? [...new Set(g.events.map(e => monthKey(e.date)))].map(ym => [cap1(monthName(ym)), g.events.filter(e => monthKey(e.date) === ym)])
    : [[null, g.events]];
  const others = guides.filter(x => x !== g);
  const ld = [{
    "@context": "https://schema.org", "@type": "ItemList", name: g.h1, url,
    itemListElement: g.events.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + eventPath(e), name: e.title }))
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [{ "@type": "ListItem", position: 1, name: "Eventos PDE", item: SITE + "/" },
      ...(g.path === "/agenda/" ? [] : [{ "@type": "ListItem", position: 2, name: "Agenda", item: SITE + "/agenda/" }]),
      { "@type": "ListItem", position: g.path === "/agenda/" ? 2 : 3, name: g.h1, item: url }]
  }];
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(g.title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="format-detection" content="telephone=no">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#151518">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Eventos PDE">
<meta property="og:locale" content="es_UY">
<meta property="og:title" content="${esc(g.h1)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(g.events[0] ? absPhoto(g.events[0]) : SITE + "/img/og.jpg?v=2")}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css?v=${v}">
<link rel="stylesheet" href="/css/evento.css?v=${v}">
<link rel="stylesheet" href="/css/plan.css?v=${v}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="logo" href="/" aria-label="Eventos PDE, inicio">Eventos<span>PDE</span></a>
  </header>

  <a class="ev-back" href="${g.path === "/agenda/" ? "/" : "/agenda/"}">‹ ${g.path === "/agenda/" ? "Inicio" : "Toda la agenda de Punta del Este"}</a>

  <main class="ag">
    <p class="ag-eyebrow">${esc(g.eyebrow)}</p>
    <h1>${esc(g.h1)}</h1>
    <p class="ag-intro">${esc(g.intro)}</p>
    ${groups.map(([h, evs]) => `<section class="ev-more ag-sec">
      ${h ? `<h2>${esc(h)}</h2>` : ""}
      <div class="ev-more-grid">${evs.map(guideCard).join("")}
      </div>
    </section>`).join("\n    ")}
    <nav class="ag-links" aria-label="Más de la agenda">
      <h2>Más de la agenda</h2>
      <div>${others.map(x => `<a href="${x.path}">${esc(x.h1)}</a>`).join("")}</div>
    </nav>
    <div class="ag-acts"><a class="btn" href="/">Ver la agenda con calendario y mapa</a><a class="btn ghost" href="/plan.html">Armar mi plan</a></div>
  </main>
</div>

<div class="wrap"><footer class="foot" id="site-footer"><span>Punta del Este, Uruguay</span></footer></div>

<script src="/js/config.js?v=${v}"></script>
<script src="/js/utils.js?v=${v}"></script>
<script src="/js/i18n.js?v=${v}"></script>
<script src="/js/analytics.js?v=${v}"></script>
<script src="/js/site.js?v=${v}"></script>
<script src="/js/plan.js?v=${v}"></script>
</body>
</html>
`;
}
