/* app.js · home: estado, filtros, lista e inicio
   El resto vive en: cards.js (tarjetas), portada.js (slider), calendar.js (calendario).
   Requiere: config.js, data.js, utils.js, analytics.js, site.js, cards.js, portada.js, calendar.js */

/* ============ 1. Eventos vigentes ============
   Un evento desaparece solo en dos casos: pasó su fecha (date, o endDate si dura varios días)
   o terminó la visibilidad pagada (until). Con from, empieza a verse ese día. */
const isLive = e => (e.endDate || e.date) >= TODAY && (!e.until || e.until >= TODAY) && (!e.from || e.from <= TODAY);
const LIVE = EV.filter(isLive);

/* La dirección del inicio queda limpia (eventospde.com, sin /index.html), y los links viejos con #evento
   (los que ya se compartieron) llevan a la página propia del evento */
if (/\/index\.html$/.test(location.pathname)) history.replaceState(null, "", "/" + location.search + location.hash);
const oldHash = decodeURIComponent(location.hash.slice(1));
if (oldHash && LIVE.some(e => slugOf(e) === oldHash)) location.replace(`/evento/${oldHash}/`);

/* ============ 2. Estado ============ */
const ymOf = iso => ({ y: +iso.slice(0, 4), m: +iso.slice(5, 7) - 1 });

const state = {
  cat: "Todos",
  view: "list",                                  // "list" | "cal" | "map"
  day: null,                                     // día elegido en el calendario
  month: (() => { const first = LIVE.map(e => e.date).sort()[0] || TODAY; return ymOf(first < TODAY ? TODAY : first); })()
};

/* El calendario no deja ir a meses pasados ni más allá del último evento */
const bounds = (() => {
  const last = LIVE.map(e => e.endDate || e.date).sort().pop() || TODAY;
  return { min: ymOf(TODAY), max: ymOf(last) };
})();

/* ============ 3. Filtros ============ */
/* Lo que se busca: título, lugar, categoría, descripción y fecha ("diciembre", "sábado", "31") */
const haystack = new Map(LIVE.map(e => [e, norm(`${e.title} ${e.place} ${e.cat} ${e.desc} ${longDate(e)} ${MESES[+e.date.slice(5, 7) - 1]}`)]));

function filtered({ cat = state.cat } = {}) {
  const words = norm($("q").value.trim()).split(/\s+/).filter(Boolean);
  return LIVE
    .filter(e => (cat === "Todos" || e.cat === cat) && words.every(w => haystack.get(e).includes(w)))
    .sort(compareEvents);
}

/* Botón de filtro con su cantidad; sin eventos queda apagado (salvo el elegido, para poder salir de él) */
function chipEl(label, on, count, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.innerHTML = `${esc(label)}${count != null ? `<small class="chip-n" aria-hidden="true">${count}</small>` : ""}`;
  if (count != null) b.setAttribute("aria-label", `${label}, ${count} ${count === 1 ? "evento" : "eventos"}`);   // el lector de pantalla dice "Fiestas, 26 eventos"
  b.setAttribute("aria-pressed", on);
  b.disabled = count === 0 && !on;
  b.onclick = onClick;
  return b;
}

/* El botón elegido de categoría (no el del calendario): ahí va la píldora blanca */
const activeChip = box => box.querySelector('.chip:not(.chip-cal)[aria-pressed="true"]');

function renderChips() {
  const box = $("chips");
  box.querySelectorAll(":scope > :not(.pill)").forEach(n => n.remove());   // la píldora queda y se desliza a la nueva

  /* Botón circular del calendario: va antes de "Todos" y abre/cierra la vista de calendario */
  const cal = document.createElement("button");
  cal.type = "button";
  cal.className = "chip chip-cal";
  cal.innerHTML = ico("calendar");
  cal.setAttribute("aria-label", "Calendario");
  cal.setAttribute("aria-pressed", state.view === "cal");
  cal.onclick = () => { state.view = state.view === "cal" ? "list" : "cal"; render(); };
  box.appendChild(cal);

  /* Botón circular del mapa: al lado del calendario; muestra los lugares de los eventos filtrados */
  const map = document.createElement("button");
  map.type = "button";
  map.className = "chip chip-cal";
  map.innerHTML = ico("pin");
  map.setAttribute("aria-label", "Mapa");
  map.setAttribute("aria-pressed", state.view === "map");
  map.onclick = () => { state.view = state.view === "map" ? "list" : "map"; render(); if (state.view === "map") track("ver_mapa"); };
  box.appendChild(map);

  ["Todos", ...Object.keys(CATS)].forEach(name => {
    box.appendChild(chipEl(name, name === state.cat, name === "Todos" ? null : filtered({ cat: name }).length,
      () => {
        state.cat = name; state.day = null; render();
        const a = activeChip(box);                   // en el celular la fila se desliza para centrar el elegido
        box.scrollTo({ left: a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
      }));
  });
  slidePill(box, activeChip(box));
}

/* ============ 4. Lista ============ */
/* Tarjeta para organizadores: aparece entre los eventos y lleva a publicar.html */
function promoEl() {
  const from = Math.min(...PLANS.map(p => p.tiers[0][1]));
  const a = document.createElement("a");
  a.className = "card promo";
  a.href = "publicar.html";
  a.dataset.ev = "promo_publicar";
  a.innerHTML = `
    <div class="k-top"><span class="k-cat"><i></i>Para organizadores</span></div>
    <div class="k-bottom">
      <h3>¿Organizás un evento en Punta?</h3>
      <p class="promo-text">Publicalo en la agenda desde US$ ${from} por día y llegá a quienes buscan qué hacer esta temporada.</p>
      <span class="s-cta">Publicar evento <i>${ico("arrow")}</i></span>
    </div>`;
  return a;
}

function renderList(list) {
  const grid = $("grid");
  grid.innerHTML = "";
  if (!list.length) {
    const searching = $("q").value.trim();
    grid.innerHTML = `<div class="empty"><p>${searching ? "No encontramos eventos con esa búsqueda." : "Todavía no hay eventos en esta categoría."} Probá con otra o publicá el tuyo.</p>
      <p><button type="button" class="btn ghost" id="reset">Ver todos los eventos</button> <a class="btn" href="publicar.html" data-ev="promo_publicar">Publicar mi evento</a></p></div>`;
    $("reset").onclick = () => { $("q").value = ""; state.cat = "Todos"; render(); };
    return;
  }
  list.forEach(e => grid.appendChild(cardEl(e)));
  grid.insertBefore(promoEl(), grid.children[5] || null);
}

/* ============ 5. Render general ============ */
function render() {
  const list = filtered();
  const view = state.view;

  renderChips();
  $("count").textContent = `${list.length} ${list.length === 1 ? "evento" : "eventos"}`;
  $("grid").hidden = view !== "list";
  $("cal").hidden = view !== "cal";
  $("mapa").hidden = view !== "map";

  if (view === "cal") renderCalendar($("cal"), list, { state, bounds, onChange: render });
  else if (view === "map") renderMap($("mapa"), list);
  else renderList(list);
}

/* ============ 6. Datos para Google ============
   Cada evento vigente va como schema.org/Event: Google puede mostrarlos en sus resultados de eventos. */
(() => {
  const BASE = "https://eventospde.com/";
  const start = e => (/^\d{1,2}:\d{2}$/.test(e.time) ? `${e.date}T${e.time.padStart(5, "0")}:00-03:00` : e.date);
  const data = LIVE.map(e => {
    const t = ticketLink(e);
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.title,
      description: e.desc,
      startDate: start(e),
      ...(e.endDate ? { endDate: e.endDate } : {}),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: e.place,
        address: { "@type": "PostalAddress", addressLocality: "Punta del Este", addressRegion: "Maldonado", addressCountry: "UY" } },
      ...(e.photo ? { image: [new URL(photoUrl(e), BASE).href] } : {}),
      url: BASE + "evento/" + slugOf(e) + "/",
      ...(t ? { offers: { "@type": "Offer", url: t.url, availability: "https://schema.org/InStock" } } : {})
    };
  });
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
})();

/* ============ 7. Inicio ============ */
let typing = 0;
$("q").addEventListener("input", () => {
  render();
  clearTimeout(typing);                          // cuenta la búsqueda cuando se deja de escribir
  typing = setTimeout(() => { const q = $("q").value.trim(); if (q.length > 2) track("buscar", { busqueda: q }); }, 1200);
});

/* Etiqueta del hero: cuántos eventos hay en agenda */
const heroLive = $("hero-live");
if (heroLive) heroLive.textContent = `${LIVE.length} ${LIVE.length === 1 ? "evento" : "eventos"} en agenda`;

renderPortada(LIVE);
render();

/* La píldora sigue al botón si cambia el ancho (fuentes que terminan de cargar, giro del celular, ventana) */
const pillFix = () => slidePill($("chips"), activeChip($("chips")), true);
addEventListener("resize", pillFix);
if (document.fonts) document.fonts.ready.then(pillFix);
