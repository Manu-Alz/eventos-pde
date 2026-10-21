/* app.js · home: estado, filtros, lista e inicio
   El resto vive en: cards.js (tarjetas), hot.js (portada), calendar.js (calendario).
   Requiere: config.js, data.js, utils.js, analytics.js, site.js, cards.js, hot.js, calendar.js */

/* ============ 1. Eventos vigentes ============
   Un evento desaparece solo en dos casos: pasó su fecha (date, o endDate si dura varios días)
   o terminó la visibilidad pagada (until). Con from, empieza a verse ese día. */
const isLive = e => (e.endDate || e.date) >= TODAY && (!e.until || e.until >= TODAY) && (!e.from || e.from <= TODAY);
const LIVE = EV.filter(isLive);

/* ============ 2. Estado ============ */
const ymOf = iso => ({ y: +iso.slice(0, 4), m: +iso.slice(5, 7) - 1 });

const state = {
  cat: "Todos",
  view: "list",                                  // "list" | "cal"
  day: null,                                     // día elegido en el calendario
  month: (() => { const first = LIVE.map(e => e.date).sort()[0] || TODAY; return ymOf(first < TODAY ? TODAY : first); })()
};

/* El calendario no deja ir a meses pasados ni más allá del último evento */
const bounds = (() => {
  const last = LIVE.map(e => e.endDate || e.date).sort().pop() || TODAY;
  return { min: ymOf(TODAY), max: ymOf(last) };
})();

/* ============ 3. Filtros ============ */
function filtered() {
  const s = $("q").value.trim().toLowerCase();
  return LIVE
    .filter(e => (state.cat === "Todos" || e.cat === state.cat) && (!s || `${e.title} ${e.place} ${e.cat} ${e.desc}`.toLowerCase().includes(s)))
    .sort(compareEvents);
}

function renderChips() {
  const box = $("chips");
  box.innerHTML = "";

  /* Botón circular del calendario: va antes de "Todos" y abre/cierra la vista de calendario */
  const cal = document.createElement("button");
  cal.type = "button";
  cal.className = "chip chip-cal";
  cal.innerHTML = ico("calendar");
  cal.setAttribute("aria-label", "Calendario");
  cal.setAttribute("aria-pressed", state.view === "cal");
  cal.onclick = () => { state.view = state.view === "cal" ? "list" : "cal"; render(); };
  box.appendChild(cal);

  ["Todos", ...Object.keys(CATS)].forEach(name => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = name;
    b.setAttribute("aria-pressed", name === state.cat);
    b.onclick = () => { state.cat = name; state.day = null; render(); };
    box.appendChild(b);
  });
}

/* ============ 4. Lista ============ */
function renderList(list) {
  const grid = $("grid");
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = '<p class="empty">Todavía no hay eventos en esta categoría. Probá otra o publicá el tuyo.</p>';
    return;
  }
  list.forEach(e => grid.appendChild(cardEl(e)));
}

/* ============ 5. Render general ============ */
function render() {
  const list = filtered();
  const cal = state.view === "cal";

  renderChips();
  $("count").textContent = `${list.length} ${list.length === 1 ? "evento" : "eventos"}`;
  $("grid").hidden = cal;
  $("cal").hidden = !cal;

  if (cal) renderCalendar($("cal"), list, { state, bounds, onChange: render });
  else renderList(list);
}

/* ============ 6. Inicio ============ */
$("q").addEventListener("input", render);

/* Etiqueta del hero: cuántos eventos hay en agenda */
const heroLive = $("hero-live");
if (heroLive) heroLive.textContent = `${LIVE.length} ${LIVE.length === 1 ? "evento" : "eventos"} en agenda`;

renderHot(LIVE);
render();
