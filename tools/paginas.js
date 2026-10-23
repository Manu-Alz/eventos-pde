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
      ${mapEmbed(e, route)}
      <div class="ev-actions">
        ${main}
        <div class="ev-row">${second}</div>
      </div>
      <a class="ev-trip" href="/plan.html?add=${esc(slugOf(e))}" data-ev="plan_evento" data-n="${esc(e.title)}">
        <span class="ev-trip-i">${ico("car")}</span>
        <span class="ev-trip-t"><small>Si venís de afuera</small><b>Armá tu plan con este evento</b><span>Te llevamos y te traemos con chofer, sumamos tus entradas y, si querés, dónde quedarte. Una sola cotización, sin compromiso.</span></span>
        <span class="ev-trip-go">${ico("arrow")}</span>
      </a>
    </div>
  </main>

  ${more.length ? `<section class="ev-more" aria-label="Más eventos">
    <h2>Más eventos en Punta</h2>
    <div class="ev-more-grid">${more.map(moreCard).join("")}
    </div>
    <a class="btn ghost ev-all" href="/">Ver toda la agenda</a>
  </section>` : ""}
</div>

${t ? `<div class="ev-buybar"><a class="btn" href="${esc(t.url)}" target="_blank" rel="${t.affiliate ? "sponsored noopener" : "noopener"}" data-ev="${t.affiliate ? "referido" : "entradas"}" data-n="${esc(e.title)}">${ico("ticket")}Comprar entradas${e.price ? ` · ${esc(e.price.replace(/^Desde /, "desde "))}` : ""}</a></div>` : ""}
<div class="wrap"><footer class="foot" id="site-footer"><span>Punta del Este, Uruguay</span></footer></div>

<script src="/js/config.js?v=${v}"></script>
<script src="/js/utils.js?v=${v}"></script>
<script src="/js/analytics.js?v=${v}"></script>
<script src="/js/site.js?v=${v}"></script>
<script src="/js/plan.js?v=${v}"></script>
</body>
</html>
`;
}

/* ============ 4. Sitemap ============ */
function sitemapXml(live) {
  const row = (loc, pri, freq) => `  <url><loc>${SITE}${loc}</loc><lastmod>${TODAY}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(([loc, pri, freq]) => row(loc, pri, freq)).join("\n")}
${live.map(e => row(eventPath(e), "0.8", "weekly")).join("\n")}
</urlset>
`;
}

/* ============ 5. Todo junto ============
   Devuelve { "ruta/del/archivo": "contenido" }. v = número de versión de los CSS/JS (el mismo ?v= que usa index.html). */
function buildSite(v) {
  const live = EV.filter(isLiveEvent).sort(compareEvents);
  const files = { "sitemap.xml": sitemapXml(live) };
  live.forEach(e => { files[`evento/${slugOf(e)}/index.html`] = eventPage(e, live, v); });
  return files;
}
