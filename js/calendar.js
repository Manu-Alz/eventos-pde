/* calendar.js · vista calendario
   - Cada día con eventos muestra el póster del primero (marco blanco y franja del color de la categoría, como en el mapa).
     Si hay más, asoma otro póster detrás y un número con la cantidad. El número del día va arriba, sobre el póster.
   - Los días sin eventos no se pueden tocar. Tocar un día muestra sus eventos abajo.
   - Se puede deslizar a los costados para cambiar de mes.
   Requiere: config.js (CATS), utils.js (esc, pad, MESES, TODAY), cards.js (cardEl, compareEvents) */

const WEEKDAYS = typeof I18N === "object" ? I18N.week() : ["L", "M", "M", "J", "V", "S", "D"];   // del lunes al domingo, en el idioma elegido

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

/* Póster chico de un evento: la foto o, sin foto, la inicial sobre el color de la categoría (queda debajo si la foto no carga) */
const calPoster = (e, back) => `<span class="cp${back ? " back" : ""}" style="--c:${CATS[e.cat]}"><span class="cp-gen">${esc(e.title.charAt(0))}</span>`
  + (e.photo ? `<img src="${esc(photoUrl(e))}" alt="" decoding="async" onerror="this.remove()">` : "") + "</span>";

/* ============ 2. Piezas ============ */
function dayCell(n, key, list, month, selected) {
  /* Primero los eventos que empiezan ese día; los de varios días que solo continúan van detrás.
     Si ese día solo hay continuaciones (ej. el 3.er día de un festival), el póster se ve atenuado (.cont) */
  const evs = [...list.filter(e => e.date === key), ...list.filter(e => e.date !== key)];
  const count = evs.length, cont = count > 0 && evs.every(e => e.date !== key);
  const classes = ["cd", count && "has", cont && "cont", key === TODAY && "today", key < TODAY && "past"].filter(Boolean).join(" ");
  const label = `${n} de ${MESES[month]}, ${count ? `${count} ${count > 1 ? "eventos" : "evento"}: ${evs.map(e => e.title).join(", ")}` : "sin eventos"}`;
  const posters = count ? `<span class="cd-post" aria-hidden="true">${count > 1 ? calPoster(evs[1], true) : ""}${calPoster(evs[0])}</span>` : "";

  return `<button type="button" class="${classes}" data-k="${key}"`
    + ` aria-pressed="${selected === key}"${key === TODAY ? ' aria-current="date"' : ""}${count ? "" : " disabled"} aria-label="${esc(label)}"${count ? ` title="${esc(evs.map(e => e.title).join(" · "))}"` : ""}>`
    + `${posters}<span class="cd-num">${n}</span>${count > 1 ? `<span class="cd-n" aria-hidden="true">${count}</span>` : ""}</button>`;
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

  /* Las flechas saltan al mes anterior o siguiente que tenga eventos (los meses vacíos se saltean) */
  const idx = y * 12 + m;
  const minI = bounds.min.y * 12 + bounds.min.m, maxI = bounds.max.y * 12 + bounds.max.m;
  const withEvents = new Set(Object.keys(byDay).map(k => k.slice(0, 7)));
  const monthWithEvents = dir => {
    for (let i = idx + dir; i >= minI && i <= maxI; i += dir) if (withEvents.has(`${Math.floor(i / 12)}-${pad(i % 12 + 1)}`)) return i;
    return null;
  };
  const prevI = monthWithEvents(-1), nextI = monthWithEvents(1);
  const canPrev = prevI !== null, canNext = nextI !== null;
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
    const next = n < 0 ? prevI : nextI;
    if (next === null) return;
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

/* Al tocar un día con eventos, la página baja sola a la lista de ese día (celular y PC) */
function nudgeToDay(box, state) {
  if (!state.day) return;                                         // al soltar el día (ver todo el mes) no se mueve
  const below = box.querySelector("#calbelow");
  if (!below || !below.querySelector(".card")) return;            // sin eventos ese día, nada que mostrar
  const head = document.querySelector("header.top");
  const top = below.getBoundingClientRect().top + scrollY - (head ? head.offsetHeight : 0) - 12;   // el título queda debajo de la cabecera
  scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" });
}
