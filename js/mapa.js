/* mapa.js · vista de mapa de la home
   Muestra el póster de cada lugar con los eventos filtrados (categoría y búsqueda). Si varios eventos son en el mismo
   lugar, asoman detrás con el número y al tocarlo se abren en abanico; cada póster abre el mismo detalle que las tarjetas.
   Los lugares con eventos hoy tienen un halo que late. Las coordenadas salen de geoOf() (cards.js): geo, map o VENUES (config.js).
   Leaflet y el mapa base (OpenStreetMap, oscurecido con CSS) se cargan recién la primera vez que se abre el mapa.
   Requiere: config.js, utils.js, cards.js, detalle.js (window.openEvent), css/mapa.css */

const MAP_CENTER = [-34.925, -54.88];     // Punta del Este, La Barra y Manantiales a la vista
const MAP_ZOOM = 12;
const LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";

let mapState = null;                      // { map, layer, closeFans } una vez creado
/* Tamaño de los pósters del mapa: más chicos en el celular para que no se tapen tanto */
const MK = matchMedia("(max-width:600px)").matches ? { w: 50, h: 68 } : { w: 62, h: 84 };

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
const DIAS_MAPA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
/* Etiqueta blanca debajo de cada póster: "Hoy 23:00", "Sáb 23:59" o "26 dic" si es lejos y sin hora */
function cardLabel(e) {
  if (isToday(e)) return "Hoy" + (/^\d/.test(e.time) ? ` ${e.time}` : "");
  const wd = DIAS_MAPA[new Date(e.date + "T12:00:00Z").getUTCDay()];
  return /^\d/.test(e.time) ? `${wd} ${e.time}` : `${wd} ${dayLabel(e)}`;
}

/* Un póster chico (foto o, sin foto, el color de la categoría con la inicial) */
const posterHtml = e => e.photo
  ? `<img src="${esc(photoUrl(e))}" alt="" decoding="async">`
  : `<span class="mk-gen">${esc(e.title.charAt(0))}</span>`;

/* Marcador de un lugar: el póster del próximo evento (con otros asomando detrás si hay varios) y, al tocarlo,
   un abanico con todos los pósters del lugar + el nombre del lugar y "Cómo llegar". */
function markerHtml(events) {
  const n = events.length, first = events[0], route = mapUrl(first);
  const stack = events.slice(0, 3).reverse().map((e, i, arr) =>
    `<span class="mk-card s${arr.length - 1 - i}" style="--c:${CATS[e.cat]}">${posterHtml(e)}<b>${esc(cardLabel(e))}</b></span>`).join("");
  const step = n > 1 ? Math.min(16, 100 / (n - 1)) : 0;
  const fan = n > 1 ? `<span class="mk-fan">${events.map((e, i) =>
    `<button type="button" class="mk-card" data-open="${esc(slugOf(e))}" style="--c:${CATS[e.cat]};--a:${((i - (n - 1) / 2) * step).toFixed(1)}deg;--i:${i}" aria-label="${esc(e.title)}, ${esc(longDate(e))}">${posterHtml(e)}<b>${esc(cardLabel(e))}</b></button>`).join("")}</span>
    <span class="mk-place"><b>${esc(shortPlace(first))}</b>${route ? `<a href="${esc(route)}" target="_blank" rel="noopener" data-ev="mapa" data-n="${esc(first.place)}">${ico("pin")}Cómo llegar</a>` : ""}</span>` : "";
  return `<span class="mk${n > 1 ? " multi" : ""}${events.some(isToday) ? " hoy" : ""}" style="--w:${MK.w}px;--h:${MK.h}px">
    <span class="mk-stack"${n === 1 ? ` data-open="${esc(slugOf(first))}"` : ""}>${stack}</span>
    ${n > 1 ? `<span class="mk-n">${n}</span>` : ""}${fan}</span>`;
}

function renderMap(section, list) {
  if (!mapState) section.innerHTML = `<div class="mapa-box" id="mapbox"><p class="mapa-wait">Cargando el mapa…</p></div><p class="mapa-note" id="mapnote"></p>`;
  const note = $("mapnote");

  /* Agrupa por coordenadas: un marcador por lugar */
  const groups = new Map();
  let missing = 0;
  list.forEach(e => {
    const g = geoOf(e);
    if (!g) { missing++; return; }
    const k = g.join(",");
    if (!groups.has(k)) groups.set(k, { geo: g, events: [] });
    groups.get(k).events.push(e);
  });
  note.textContent = `${groups.size} ${groups.size === 1 ? "lugar" : "lugares"} en el mapa. Tocá un póster para ver el evento; si hay varios en el mismo lugar, se abren en abanico.`
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
      const layer = L.layerGroup().addTo(map);
      const closeFans = () => layer.eachLayer(m => { m.getElement()?.querySelector(".mk")?.classList.remove("open"); m.setZIndexOffset(0); });
      map.on("click", () => { closeFans(); map.scrollWheelZoom.enable(); });   // la rueda hace zoom recién después de tocar el mapa
      mapState = { map, layer, closeFans };
    }
    const { map, layer, closeFans } = mapState;
    map.invalidateSize();
    layer.clearLayers();

    const points = [];
    groups.forEach(({ geo, events }) => {
      events.sort(compareEvents);
      const n = events.length;
      const icon = L.divIcon({ className: "mk-icon", html: markerHtml(events), iconSize: [MK.w, MK.h], iconAnchor: [MK.w / 2, MK.h] });
      const marker = L.marker(geo, { icon, title: `${shortPlace(events[0])}: ${n} ${n === 1 ? "evento" : "eventos"}`, keyboard: true, riseOnHover: true, bubblingMouseEvents: false })
        .addTo(layer);
      /* Un toque: con un solo evento abre el detalle; con varios abre o cierra el abanico; en el abanico, cada póster abre su detalle */
      marker.on("click", ev => {
        const target = ev.originalEvent && ev.originalEvent.target;
        if (target && target.closest("a")) return;                       // "Cómo llegar"
        const pick = target && target.closest("[data-open]");
        const mk = marker.getElement().querySelector(".mk");
        if (pick && (n === 1 || mk.classList.contains("open"))) { window.openEvent && window.openEvent(pick.dataset.open); return; }
        if (n === 1) { window.openEvent && window.openEvent(slugOf(events[0])); return; }
        const opening = !mk.classList.contains("open");
        closeFans();
        if (opening) {
          mk.classList.add("open");
          marker.setZIndexOffset(100000);                                     // el abanico queda arriba de los demás pósters
          map.panTo(map.layerPointToLatLng(map.latLngToLayerPoint(geo).subtract([0, MK.h])), { animate: true });   // lugar para el abanico
          track("mapa_abanico", { lugar: events[0].place });
        }
      });
      points.push(geo);
    });
    if (points.length > 1) map.fitBounds(points, { paddingTopLeft: [MK.w, MK.h + 16], paddingBottomRight: [MK.w, 24], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 14);
    else map.setView(MAP_CENTER, MAP_ZOOM);
  }).catch(() => {
    $("mapbox").innerHTML = '<p class="mapa-wait">No se pudo cargar el mapa. Revisá la conexión y probá de nuevo.</p>';
  });
}
