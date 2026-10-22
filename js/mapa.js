/* mapa.js · vista de mapa de la home
   Muestra un pin por lugar con los eventos filtrados (categoría y búsqueda). Si varios eventos son en el mismo
   lugar, el pin lleva el número y al tocarlo se listan; cada uno abre el mismo detalle que las tarjetas.
   Los pines de eventos que son hoy laten. Las coordenadas salen de geoOf() (cards.js): geo, map o VENUES (config.js).
   Leaflet y el mapa base (OpenStreetMap, oscurecido con CSS) se cargan recién la primera vez que se abre el mapa.
   Requiere: config.js, utils.js, cards.js, detalle.js (window.openEvent), css/mapa.css */

const MAP_CENTER = [-34.925, -54.88];     // Punta del Este, La Barra y Manantiales a la vista
const MAP_ZOOM = 12;
const LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";

let mapState = null;                      // { map, layer, box, note } una vez creado

/* Carga Leaflet una sola vez (css + js) */
let leafletReady = null;
function loadLeaflet() {
  if (leafletReady) return leafletReady;
  leafletReady = new Promise((ok, fail) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET + "leaflet.min.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = LEAFLET + "leaflet.min.js";
    s.onload = ok;
    s.onerror = () => { leafletReady = null; fail(); };
    document.head.appendChild(s);
  });
  return leafletReady;
}

const isToday = e => e.date <= TODAY && (e.endDate || e.date) >= TODAY;
const shortDate = e => `${dayLabel(e)} ${monthLabel(e)}`;

/* Contenido del globo de un lugar: nombre, eventos (fecha, título, día y hora) y "Cómo llegar" */
function popupHtml(events) {
  const first = events[0];
  const route = mapUrl(first);
  return `<div class="mp">
    <b class="mp-place">${esc(shortPlace(first))}</b>
    <ul>${events.map(e => `<li><button type="button" data-open="${esc(slugOf(e))}">
      <span class="mp-d" style="--c:${CATS[e.cat]}">${esc(shortDate(e))}</span>
      <span class="mp-t"><b>${esc(e.title)}</b><small>${isToday(e) ? "Hoy · " : ""}${esc(timeLabel(e))}</small></span>
    </button></li>`).join("")}</ul>
    ${route ? `<a class="mp-go" href="${esc(route)}" target="_blank" rel="noopener" data-ev="mapa" data-n="${esc(first.place)}">${ico("pin")}Cómo llegar</a>` : ""}
  </div>`;
}

function renderMap(section, list) {
  if (!mapState) {
    section.innerHTML = `<div class="mapa-box" id="mapbox"><p class="mapa-wait">Cargando el mapa…</p></div><p class="mapa-note" id="mapnote"></p>`;
    section.addEventListener("click", ev => {
      const b = ev.target.closest("[data-open]");
      if (b && window.openEvent) window.openEvent(b.dataset.open);
    });
  }
  const note = $("mapnote");

  /* Agrupa por coordenadas: un pin por lugar */
  const groups = new Map();
  let missing = 0;
  list.forEach(e => {
    const g = geoOf(e);
    if (!g) { missing++; return; }
    const k = g.join(",");
    if (!groups.has(k)) groups.set(k, { geo: g, events: [] });
    groups.get(k).events.push(e);
  });
  note.textContent = `${groups.size} ${groups.size === 1 ? "lugar" : "lugares"} en el mapa. Los pines con número juntan varios eventos en el mismo lugar.`
    + (missing ? ` ${missing} ${missing === 1 ? "evento todavía no tiene" : "eventos todavía no tienen"} ubicación exacta: están en la lista y el calendario.` : "");

  loadLeaflet().then(() => {
    if (!mapState) {
      const box = $("mapbox");
      box.innerHTML = "";
      const map = L.map(box, { center: MAP_CENTER, zoom: MAP_ZOOM, scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      map.on("click", () => map.scrollWheelZoom.enable());          // la rueda del mouse hace zoom recién después de tocar el mapa
      mapState = { map, layer: L.layerGroup().addTo(map) };
    }
    const { map, layer } = mapState;
    map.invalidateSize();
    layer.clearLayers();

    const points = [];
    groups.forEach(({ geo, events }) => {
      events.sort(compareEvents);
      const n = events.length, today = events.some(isToday);
      const icon = L.divIcon({
        className: "",
        html: `<span class="pin${today ? " hoy" : ""}" style="--c:${CATS[events[0].cat]}">${n > 1 ? n : ""}</span>`,
        iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16]
      });
      L.marker(geo, { icon, title: `${shortPlace(events[0])}: ${n} ${n === 1 ? "evento" : "eventos"}`, keyboard: true })
        .bindPopup(popupHtml(events), { maxWidth: 300, minWidth: 240, className: "mp-pop" })
        .addTo(layer);
      points.push(geo);
    });
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 14);
    else map.setView(MAP_CENTER, MAP_ZOOM);
  }).catch(() => {
    $("mapbox").innerHTML = '<p class="mapa-wait">No se pudo cargar el mapa. Revisá la conexión y probá de nuevo.</p>';
  });
}
