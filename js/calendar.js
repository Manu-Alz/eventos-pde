/* calendar.js · vista calendario
   - Pantallas anchas: cada día muestra hasta 3 líneas (si hay más, 2 + "+N más").
   - Celulares: cada día muestra puntos de color por categoría.
   - Los días sin eventos no se pueden tocar. Tocar un día muestra sus eventos abajo.
   - Se puede deslizar a los costados para cambiar de mes.
   Requiere: config.js (CATS), utils.js (esc, pad, MESES, TODAY), cards.js (cardEl, compareEvents) */

const CAL_MAX_LINES = 3;                         // líneas de eventos por celda antes de pasar a "+N más"
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/* ============ 1. Datos ============ */
/* Mapa "AAAA-MM-DD" -> eventos (los de varios días aparecen en cada día) */
function eventsByDay(list) {
  const map = {};
  list.forEach(e => {
    const end = e.endDate || e.date;
    const t = new Date(e.date + "T12:00:00Z");
    for (let k = e.date; k <= end; t.setUTCDate(t.getUTCDate() + 1), k = t.toISOString().slice(0, 10)) {
      (map[k] = map[k] || []).push(e);
    }
  });
  return map;
}

/* Cuántos eventos se escriben en la celda y cuántos pasan a "+N más" */
function splitVisible(evs) {
  if (evs.length <= CAL_MAX_LINES) return { shown: evs, extra: 0 };
  const shown = evs.slice(0, CAL_MAX_LINES - 1);
  return { shown, extra: evs.length - shown.length };
}

/* ============ 2. Piezas ============ */
function dayCell(n, key, evs, month, selected) {
  const count = evs.length;
  const { shown, extra } = splitVisible(evs);
  const classes = ["cd", count && "has", key === TODAY && "today", key < TODAY && "past"].filter(Boolean).join(" ");
  const label = `${n} de ${MESES[month]}, ${count ? `${count} ${count > 1 ? "eventos" : "evento"}` : "sin eventos"}`;

  const lines = shown.map(e => `<span class="ev" style="--c:${CATS[e.cat]}" title="${esc(e.title)}">${esc(e.title)}</span>`).join("")
    + (extra ? `<span class="more">+${extra} más</span>` : "");
  const maxDots = count > 3 ? 2 : 3;                // con más de 3 eventos: 2 puntos y un "+"
  const dots = evs.slice(0, maxDots).map(e => `<i style="--c:${CATS[e.cat]}"></i>`).join("")
    + (count > 3 ? '<b class="plus" aria-hidden="true">+</b>' : "");

  return `<button type="button" class="${classes}" data-k="${key}" data-n="${Math.min(count, 4)}"`
    + ` aria-pressed="${selected === key}"${key === TODAY ? ' aria-current="date"' : ""}${count ? "" : " disabled"} aria-label="${label}">`
    + `<span class="cd-num">${n}</span><span class="cd-evs">${lines}</span><span class="dots">${dots}</span></button>`;
}

const legendHtml = evs =>
  [...new Set(evs.map(e => e.cat))].map(c => `<li><i style="--c:${CATS[c]}"></i>${esc(c)}</li>`).join("");

/* ============ 3. Dibujo ============
   box: contenedor · list: eventos filtrados
   ctx: { state: {month, day}, bounds: {min, max}, onChange: () => void } */
function renderCalendar(box, list, { state, bounds, onChange }) {
  const { y, m } = state.month;
  const prefix = `${y}-${pad(m + 1)}-`;
  const byDay = eventsByDay(list);
  const monthEvents = [...new Set(Object.keys(byDay).filter(k => k.startsWith(prefix)).flatMap(k => byDay[k]))].sort(compareEvents);
  const picked = state.day && state.day.startsWith(prefix) ? state.day : null;
  const shown = picked ? (byDay[picked] || []) : monthEvents;

  const idx = y * 12 + m;
  const canPrev = idx > bounds.min.y * 12 + bounds.min.m;
  const canNext = idx < bounds.max.y * 12 + bounds.max.m;
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;           // la semana empieza el lunes
  const days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: days }, (_, i) => {
    const key = prefix + pad(i + 1);
    return dayCell(i + 1, key, byDay[key] || [], m, picked);
  }).join("");

  const title = picked ? `Eventos del ${parseInt(picked.slice(8), 10)} de ${MESES[m]}` : `Eventos de ${MESES[m]}`;
  const countText = `${monthEvents.length} ${monthEvents.length === 1 ? "evento" : "eventos"} este mes`;

  box.innerHTML = `
    <div class="calhead">
      <div><h2>${MESES[m]} ${y}</h2><p class="calsub">${countText}</p></div>
      <div class="calnav">
        <button type="button" class="chip" id="pv" aria-label="Mes anterior"${canPrev ? "" : " disabled"}>‹</button>
        <button type="button" class="chip" id="nx" aria-label="Mes siguiente"${canNext ? "" : " disabled"}>›</button>
      </div>
    </div>
    <div class="cgrid">${WEEKDAYS.map(w => `<span class="cw" aria-hidden="true">${w}</span>`).join("")}${'<span class="cd off" aria-hidden="true"></span>'.repeat(offset)}${cells}</div>
    ${monthEvents.length ? `<ul class="legend" aria-label="Categorías de este mes">${legendHtml(monthEvents)}</ul>` : ""}
    <div class="calbelow" id="calbelow">
      <div class="calbelow-head"><h3>${title}</h3>${picked ? '<button type="button" class="chip" id="clearday">Ver todo el mes</button>' : ""}</div>
      <div class="grid" id="calgrid"></div>
    </div>`;

  const grid = $("calgrid");
  if (shown.length) shown.forEach(e => grid.appendChild(cardEl(e)));
  else grid.outerHTML = '<p class="empty">No hay eventos este mes con estos filtros.</p>';

  /* ---------- Acciones ---------- */
  const redraw = focusSelector => { onChange(); const el = focusSelector && box.querySelector(focusSelector); if (el && !el.disabled) el.focus({ preventScroll: true }); };

  const shift = n => {
    const next = idx + n;
    if (next < bounds.min.y * 12 + bounds.min.m || next > bounds.max.y * 12 + bounds.max.m) return;
    state.month = { y: Math.floor(next / 12), m: next % 12 };
    state.day = null;
    redraw(n < 0 ? "#pv" : "#nx");
  };
  $("pv").onclick = () => shift(-1);
  $("nx").onclick = () => shift(1);

  if (picked) $("clearday").onclick = () => { state.day = null; redraw(); };

  box.querySelectorAll(".cd[data-k]").forEach(btn => {
    btn.onclick = () => {
      state.day = state.day === btn.dataset.k ? null : btn.dataset.k;
      redraw(`.cd[data-k="${btn.dataset.k}"]`);
      nudgeToDay(box, state);
    };
  });

  /* Deslizar a los costados cambia de mes (solo celulares) */
  let sx = 0, sy = 0;
  const cgrid = box.querySelector(".cgrid");
  cgrid.addEventListener("touchstart", ev => { sx = ev.touches[0].clientX; sy = ev.touches[0].clientY; }, { passive: true });
  cgrid.addEventListener("touchend", ev => {
    const dx = ev.changedTouches[0].clientX - sx, dy = ev.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) shift(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* En celulares, si la lista del día quedó muy abajo, se acerca para que se vea sin buscarla */
function nudgeToDay(box, state) {
  if (!matchMedia("(max-width:700px)").matches || !state.day) return;
  const below = box.querySelector("#calbelow");
  if (below && below.getBoundingClientRect().top > innerHeight * 0.55) below.scrollIntoView({ behavior: "smooth", block: "start" });
}
