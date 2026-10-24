/* tarifas.js · zonas de Punta del Este y precio de los traslados con chofer
   Lo usan la página de cada evento (js/traslado.js) y Armar plan (js/planner.js). Los precios están en TARIFAS (config.js).
   apps-script/Code.gs tiene una copia de ZONES (solo nombre y geo) y de TARIFAS, y vuelve a calcular el precio antes
   de cobrar: si cambiás algo acá o en config.js, cambialo también allá.
   Requiere: config.js (TARIFAS) */

/* Zonas: centro aproximado (mapa, minutos y precio) y una línea para elegir dónde alojarse */
const ZONES = [
  { name: "Península",           geo: [-34.9615, -54.9480], r: 1100, blurb: "El centro: puerto, restaurantes y noche. Todo a pie." },
  { name: "Playa Brava o Mansa", geo: [-34.9360, -54.9330], r: 1500, blurb: "Torres y hoteles frente al mar, en el medio de todo." },
  { name: "La Barra",            geo: [-34.9130, -54.8660], r: 1200, blurb: "Playas, movida y las fiestas grandes a minutos." },
  { name: "Manantiales",         geo: [-34.8990, -54.8290], r: 1300, blurb: "Más tranquilo y de playa, cerca de La Barra." },
  { name: "José Ignacio",        geo: [-34.8445, -54.6340], r: 1500, blurb: "Exclusivo y relajado, lejos del ruido." },
  { name: "Maldonado",           geo: [-34.9080, -54.9560], r: 1400, blurb: "La ciudad, a 10 minutos. La opción más económica." }
];
const zoneByName = name => ZONES.find(z => z.name === name) || null;

/* Kilómetros en auto entre dos puntos: línea recta × 1,35 (las rutas no van derecho) */
function roadKm(a, b) {
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2)) * 1.35;
}

/* Cuántos "autos" cuesta un grupo: hasta 4 personas, 1; de 5 a 8, una camioneta (× grupo); más, una camioneta cada 8 */
const groupFactor = people => (people <= 4 ? 1 : Math.ceil(people / 8) * TARIFAS.grupo);
const vehicleText = people => (people <= 4 ? "auto hasta 4 personas" : people <= 8 ? "camioneta hasta 8 personas" : `${Math.ceil(people / 8)} camionetas`);

/* Precio de un traslado a un evento: zona de la persona → lugar del evento, por tramo (legs: 1 o 2). null = no se puede calcular */
function rideUSD(zoneName, geo, legs, people) {
  const z = zoneByName(zoneName);
  if (!z || !geo || !legs) return null;
  const km = roadKm(z.geo, geo);
  const tramo = TARIFAS.tramos.find(([hasta]) => km <= hasta)[1];
  return Math.round(tramo * legs * groupFactor(people));
}

/* Precio del traslado de llegada o regreso (aeropuerto, puerto o terminal ↔ alojamiento). null = no hay precio para esa llegada */
function arrivalUSD(via, legs, people) {
  const p = TARIFAS.llegadas[via];
  return p && legs ? Math.round(p * legs * groupFactor(people)) : null;
}
