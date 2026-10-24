/* planner.js · planificador "Armar plan" (plan.html), pensado sobre todo para quien viene de afuera
   Es el lugar único para pedir entradas, traslados y alojamiento. Cuatro pasos y un resumen fijo al costado:
   1 Tus eventos: la agenda adentro (mini tarjetas con filtro por categoría) para sumar o sacar eventos, y por cada
     evento elegido: entradas (las incluimos o ya las tiene) y chofer (ida y vuelta, solo ida, solo vuelta o no).
   2 Llegada y regreso: cómo llega (avión, barco, ómnibus o por su cuenta) y el traslado desde y hacia el aeropuerto
     o puerto (los dos tramos, solo la llegada, solo el regreso o ninguno).
   3 Dónde te quedás: apagado por defecto ("Necesito alojamiento"); prendido, fechas, zona en un mapa (con los minutos
     hasta sus eventos) y tipo, y elige cómo reservar: "Lo reservo yo en Booking" (abre Booking ya filtrado; paga ahí y
     Eventos PDE cobra comisión, BOOKING en config.js) o "Que me lo busquen ustedes" (pedido a inmobiliarias y hoteles
     aliados: se cotiza; el script les reenvía el pedido, AVISO_ALOJAMIENTO). El catálogo STAYS (config.js) también se cotiza.
     Abajo, la zona y dirección donde lo buscamos (para los traslados).
   4 Tus datos: nombre, mail, WhatsApp, país e idioma.
   Se puede pedir sin eventos (solo traslado o alojamiento). Manda un solo pedido de cotización a la planilla
   (pestaña "Servicios", referencia PLN-XXXXX) y de ahí sale el mail con el pago online. El itinerario viaja en "Algo más",
   una línea "• ..." por tramo: el script la muestra completa en el mail de cotización y en pagar.html.
   "Compartir plan": link plan.html?e=id1,id2 para los amigos. Las elecciones se recuerdan en este navegador.
   Índice: 1 Datos · 2 Cálculos · 3 Pasos · 4 Resumen · 5 Mapa · 6 Dibujo · 7 Pedido · 8 Inicio
   Requiere: config.js, data.js, utils.js, analytics.js, site.js, cards.js, plan.js, tarifas.js (ZONES y precios), mapa.js (Leaflet y pósters del mapa) */

/* ============ 1. Datos ============ */
const PL_KEY = "epde-plan-opts";
const plLive = EV.filter(e => (e.endDate || e.date) >= TODAY && (!e.until || e.until >= TODAY) && (!e.from || e.from <= TODAY)).sort(compareEvents);
const byId = id => plLive.find(e => slugOf(e) === id);
const plQs = new URLSearchParams(location.search);
const shared = plQs.get("e") ? plQs.get("e").split(",").filter(Boolean) : null;   // plan compartido por link
/* plan.html?add=<id>: llega desde "Traslado" (tarjeta de la agenda) o "Armá tu plan con este evento" (página del evento);
   se suma al plan y la dirección queda limpia */
if (plQs.get("add") && byId(plQs.get("add"))) {
  if (!Plan.has(plQs.get("add"))) Plan.set([...Plan.get(), plQs.get("add")]);
  history.replaceState(null, "", "/plan.html");
}

const opts = (() => { try { return JSON.parse(localStorage.getItem(PL_KEY)) || {}; } catch (_) { return {}; } })();
opts.tr = opts.tr || {};          // chofer por evento: "ida y vuelta" | "solo ida" | "solo vuelta" | "no"
opts.pick = opts.pick || {};      // hora a la que lo buscamos, por evento
opts.tix = opts.tix || {};        // entradas por evento: "si" (las incluimos) | "no" (ya las tiene)
opts.arr = opts.arr || {};        // llegada y regreso: via, inDate, inTime, inRef, outDate, outTime, outRef, transfer
if (typeof opts.arr.transfer !== "string") opts.arr.transfer = opts.arr.transfer === false ? "no" : "ambos";   // versión anterior: true/false
const saveOpts = () => { try { localStorage.setItem(PL_KEY, JSON.stringify(opts)); } catch (_) {} };

const planIds = () => shared || Plan.get();
const planEvents = () => planIds().map(byId).filter(Boolean).sort(compareEvents);
/* Las fechas que eligió para el alojamiento valen para esos eventos: si el plan cambió (o son de antes), vuelven a las de
   por defecto, un día antes y uno después */
const datesKey = () => planIds().slice().sort().join();
if ((opts.aIn || opts.aOut) && opts.datesFor !== datesKey()) { opts.aIn = ""; opts.aOut = ""; }
let plCat = "Todos";              // filtro de categoría de la agenda del paso 1

/* Cómo se llega a Punta: lugar de llegada y tiempo aproximado de viaje hasta Punta del Este */
const ARRIVALS = [
  { id: "mvd",   label: "Avión a Montevideo",     place: "Aeropuerto de Carrasco",         trip: "1 h 30 min", ref: "Vuelo" },
  { id: "pde",   label: "Avión a Punta del Este", place: "Aeropuerto de Laguna del Sauce", trip: "25 min",     ref: "Vuelo" },
  { id: "bqmvd", label: "Barco a Montevideo",     place: "Puerto de Montevideo",           trip: "2 h",        ref: "Barco" },
  { id: "bqcol", label: "Barco a Colonia",        place: "Puerto de Colonia",              trip: "3 h 45 min", ref: "Barco" },
  { id: "bus",   label: "Ómnibus",                place: "Terminal de Punta del Este",     trip: "10 min",     ref: "" },
  { id: "own",   label: "Por mi cuenta",          place: "",                               trip: "",           ref: "" }
];
const arrOf = () => ARRIVALS.find(a => a.id === opts.arr.via) || null;
const TRANSFERS = [["ambos", "Ida y vuelta"], ["llegada", "Solo llegada"], ["regreso", "Solo regreso"], ["no", "No"]];
const RIDES = [["ida y vuelta", "Ida y vuelta"], ["solo ida", "Solo ida"], ["solo vuelta", "Solo vuelta"], ["no", "No"]];

const ANY_ZONE = "Me da igual";
const TYPES = ["Me da igual", "Hotel", "Apartamento", "Casa"];
const BUDGETS = ["A conversar", "Hasta US$ 100", "US$ 100 a 250", "US$ 250 a 500", "Más de US$ 500"];
const COUNTRIES = ["Argentina", "Brasil", "Uruguay", "Chile", "Paraguay", "Estados Unidos", "España", "Otro"];
const LANGS = ["Español", "Português", "English"];
const STAY_LIST = typeof STAYS !== "undefined" ? STAYS : [];   // catálogo de alojamientos con convenio (config.js)

/* ============ 2. Cálculos ============ */
const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const dow = iso => DOW[new Date(iso + "T12:00:00Z").getUTCDay()];
const dmy2 = iso => (iso ? iso.split("-").reverse().slice(0, 2).join("/") : "");
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const hasHour = e => /^\d{1,2}:\d{2}$/.test(e.time);
/* Chofer: solo en los eventos con traslado (rideOK, cards.js: fiestas y música en vivo con entradas) y si hay chofer propio
   (CHOFER.propio en config.js; sin chofer propio, la página del evento ofrece Uber); en los demás, "no" */
const trOf = e => (rideBookable(e) ? opts.tr[slugOf(e)] || "ida y vuelta" : "no");
const goes = tr => tr === "ida y vuelta" || tr === "solo ida";      // ese tramo necesita hora de búsqueda
/* Entradas: con link de compra, por defecto "Las compro yo" (las paga al instante en la ticketera, con nuestro código de
   afiliado si hay); sin link pero con precio, "Incluilas" (se cotizan); sin ninguno de los dos (gratis o sin datos), nada */
const hasTix = e => Boolean(e.tickets || e.price);
const tixOf = () => "no";                    // las entradas se compran en la ticketera, con nuestro código de afiliado
const stayOn = () => opts.stay === true;                            // alojamiento: apagado hasta que la persona lo prende
/* El alojamiento se reserva en Booking (la persona paga ahí), salvo que pida que se lo busquemos (inmobiliarias y hoteles
   aliados) o elija uno con convenio del catálogo: esos se cotizan */
const quoteStay = () => stayOn() && (opts.stayMode === "aliados" || Boolean(stayById(opts.stayId)));
const viaBooking = () => stayOn() && !quoteStay();
const people = () => opts.people || 2;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/* Lo buscamos media hora antes, en hora o media hora */
function defaultPick(e) {
  if (!hasHour(e)) return "";
  const [h, m] = e.time.split(":").map(Number);
  const t = (Math.round((((h * 60 + m - 30) % 1440) + 1440) % 1440 / 30) * 30) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
const pickOf = e => opts.pick[slugOf(e)] || defaultPick(e);

/* Fechas del viaje: sin datos, llegada un día antes del primer evento (nunca antes de hoy) y salida el día después del
   último (sin eventos, vacías). Así la persona llega con tiempo y el alojamiento cubre la noche del evento. */
const tripStart = list => (list.length ? [addDays(list[0].date, -1), TODAY].sort().pop() : "");
const tripEnd = list => (list.length ? list.map(e => e.endDate || e.date).sort().pop() : "");
const arrIn = list => opts.arr.inDate || opts.aIn || tripStart(list);
const arrOut = list => opts.arr.outDate || opts.aOut || (list.length ? addDays(tripEnd(list), 1) : "");
/* Alojamiento: siempre cubre los eventos del plan. La llegada es a más tardar el día del primer evento (y nunca antes de
   hoy) y la salida, como mínimo, el día después del último. Por defecto, un día antes y uno después. */
const minOut = list => (list.length ? addDays(tripEnd(list), 1) : "");
const stayIn = list => {
  const d = opts.aIn || arrIn(list), first = list.length ? list[0].date : "";
  return first && d > first ? first : d && d < TODAY ? TODAY : d;
};
const stayOut = list => { const d = opts.aOut || arrOut(list), min = minOut(list); return min && (!d || d < min) ? min : d; };

/* Minutos en auto entre dos puntos: kilómetros en ruta (roadKm, tarifas.js) a 40 km/h, redondeado a 5 */
const driveMin = (a, b) => Math.max(5, Math.round(roadKm(a, b) / 40 * 60 / 5) * 5);
/* Promedio de minutos desde un punto a los eventos del plan que tienen ubicación (null si ninguno la tiene) */
function avgMin(geo, list) {
  const mins = list.map(geoOf).filter(Boolean).map(g => driveMin(geo, g));
  return mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
}
/* Zona recomendada: la más cerca, en promedio, de los eventos del plan */
function bestZone(list) {
  const ranked = ZONES.map(z => ({ z, m: avgMin(z.geo, list) })).filter(x => x.m != null).sort((a, b) => a.m - b.m);
  return ranked.length ? ranked[0].z.name : ANY_ZONE;
}
const zoneOf = list => opts.aZone || bestZone(list);
const stayById = id => STAY_LIST.find(s => s.id === id);
const BOOKING_AREA = { "Península": "Punta del Este", "Playa Brava o Mansa": "Punta del Este", [ANY_ZONE]: "Punta del Este" };
const BOOKING_TYPE = { Hotel: "ht_id=204", Apartamento: "ht_id=201", Casa: "ht_id=220" };   // filtros de Booking por tipo
function bookingUrl(list) {
  const zone = zoneOf(list), area = BOOKING_AREA[zone] || zone;
  const q = new URLSearchParams({ ss: `${area}, Maldonado, Uruguay`, group_adults: people(), no_rooms: 1, group_children: 0 });
  if (stayIn(list)) q.set("checkin", stayIn(list));
  if (stayOut(list)) q.set("checkout", stayOut(list));
  if (BOOKING_TYPE[opts.aType]) q.set("nflt", BOOKING_TYPE[opts.aType]);
  const B = typeof BOOKING === "object" ? BOOKING : {};
  if (B.aid) q.set("aid", B.aid);
  q.set("label", "eventospde-plan");
  if (typeof I18N === "object") q.set("lang", I18N.booking);          // Booking se abre en español, inglés o portugués
  const dest = "https://www.booking.com/searchresults.es.html?" + q;
  return B.link ? B.link + encodeURIComponent(dest) : dest;          // link de afiliado (Travelpayouts, CJ o Awin) + la búsqueda
}
const bookingText = list => {
  const zone = zoneOf(list), area = zone === ANY_ZONE ? "Punta del Este" : zone, a = stayIn(list), b = stayOut(list);
  return `${esc(area)}${a && b ? ` · del ${dmy2(a)} al ${dmy2(b)}` : ""} · ${plural(people(), "persona", "personas")}`;
};

/* Lo que incluye el pedido, para el resumen y el pedido */
function totals(list) {
  const arr = arrOf();
  const real = Boolean(arr && arr.id !== "own");
  const tf = real ? opts.arr.transfer : "no";
  const rides = list.reduce((n, e) => n + (trOf(e) === "ida y vuelta" ? 2 : trOf(e) === "no" ? 0 : 1), 0);
  const a = stayIn(list), b = stayOut(list);
  const nights = stayOn() && a && b ? Math.max(daysBetween(a, b), 0) : 0;
  return { arr, real, tf, airport: tf !== "no", rides, nights, tix: list.filter(e => tixOf(e) === "si"), withRide: list.filter(e => trOf(e) !== "no") };
}

/* ============ 3. Pasos ============ */
const box = $("pl-body");
const optionTags = (list, sel) => list.map(o => `<option${o === sel ? " selected" : ""}>${esc(o)}</option>`).join("");
const seg = (name, id, options, sel, label) => `<div class="pl-seg has-pill${options.length > 3 ? " four" : ""}" role="group" aria-label="${esc(label)}">
  ${options.map(([v, t]) => `<button type="button" data-seg="${name}" data-id="${esc(id)}" data-v="${esc(v)}" aria-pressed="${v === sel}">${esc(t)}</button>`).join("")}</div>`;
const stepHead = (n, title, sub) => `<header class="pl-sh"><span class="pl-n">${n}</span><div><h2 id="pl-s${n}">${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div></header>`;
const dateShort = iso => `${dow(iso)} ${parseInt(iso.slice(8), 10)} ${MES[+iso.slice(5, 7) - 1]}`;

/* Agenda adentro del plan: mini tarjetas (póster, fecha y nombre) que se tocan para sumar o sacar el evento */
function miniHtml(e, chosen) {
  const id = slugOf(e), on = chosen.includes(id);
  return `<button type="button" class="pl-mini" data-add="${esc(id)}" aria-pressed="${on}" style="--c:${CATS[e.cat]}" aria-label="${esc(e.title)}, ${esc(dateShort(e.date))}${on ? ", en tu plan" : ""}">
    <span class="pl-mini-img">${e.photo ? `<img src="${esc(photoUrl(e))}" alt="" loading="lazy" decoding="async">` : `<span class="pl-mini-gen">${esc(e.title.charAt(0))}</span>`}
      <span class="pl-mini-d"><b>${parseInt(e.date.slice(8), 10)}</b>${MES[+e.date.slice(5, 7) - 1]}</span>
      <span class="pl-mini-ok">${ico("plus")}${ico("check")}</span></span>
    <b class="pl-mini-t">${esc(e.title)}</b>
    <small>${esc(DOW[new Date(e.date + "T12:00:00Z").getUTCDay()])} · ${esc(shortPlace(e))}</small>
  </button>`;
}
/* Lo que se busca en la agenda del plan: nombre, lugar y categoría, sin tildes */
const plHay = new Map(plLive.map(e => [e, norm(`${e.title} ${e.place} ${e.cat}`)]));
function stripHtml() {
  const chosen = planIds();
  const q = $("pl-q") ? norm($("pl-q").value.trim()).split(/\s+/).filter(Boolean) : [];
  const list = plLive.filter(e => (plCat === "Todos" || e.cat === plCat) && q.every(w => plHay.get(e).includes(w)));
  return list.map(e => miniHtml(e, chosen)).join("")
    || `<p class="pl-none">${q.length ? "No encontramos eventos con esa búsqueda." : "No hay eventos en esta categoría."}</p>`;
}
function catChips() {
  const cats = ["Todos", ...Object.keys(CATS).filter(c => plLive.some(e => e.cat === c))];
  return cats.map(c => `<button type="button" class="pl-cchip" data-cat="${esc(c)}" aria-pressed="${c === plCat}">${esc(c)}</button>`).join("");
}

function pickHtml(e) {
  const id = slugOf(e), tr = trOf(e);
  if (tr === "no") return "";
  if (tr === "solo vuelta") return "<span>te traemos al terminar</span>";
  return hasHour(e)
    ? `<label class="pl-pick">te buscamos <input type="time" data-pick="${id}" value="${esc(pickOf(e))}"></label>`
    : "<span>hora a coordinar</span>";
}
function tixNoteHtml(e) {
  const t = ticketLink(e);
  return t ? `<a class="pl-buy" href="${esc(t.url)}" target="_blank" rel="noopener${t.affiliate ? " sponsored" : ""}" data-ev="entradas" data-n="${esc(e.title)}">Comprar${e.price ? ` · ${esc(e.price.replace(/^desde /i, "desde "))}` : ""} ${ico("arrow")}</a>`
    : e.price ? `<span>${esc(e.price)}</span>` : "";
}
/* Con el chofer propio apagado: Uber para ir y volver, con el lugar del evento ya cargado (como en la página del evento) */
function uberHtml(e) {
  if (choferPropio() || !rideOK(e) || !uberUrl(e, "ir")) return "";
  return `<div class="pl-opt">
        <div class="pl-opt-h"><b>${ico("car")}Cómo ir y volver</b><span class="pl-opt-x">con Uber, sin manejar</span></div>
        <div class="pl-uber">
          <a href="${esc(uberUrl(e, "ir"))}" target="_blank" rel="noopener" data-ev="uber_ir" data-n="${esc(e.title)}">Para ir ${ico("arrow")}</a>
          <a href="${esc(uberUrl(e, "volver"))}" target="_blank" rel="noopener" data-ev="uber_volver" data-n="${esc(e.title)}">Para volver ${ico("arrow")}</a>
        </div>
      </div>`;
}

function eventCard(e) {
  const id = slugOf(e);
  return `<article class="pl-ev" style="--c:${CATS[e.cat]}">
    <a class="pl-poster" href="/evento/${id}/" aria-label="${esc(e.title)}">${e.photo ? `<img src="${esc(photoUrl(e))}" alt="" loading="lazy">` : ""}</a>
    <div class="pl-info">
      <p class="pl-eb"><i></i>${esc(e.cat)} · ${esc(timeLabel(e))}</p>
      <h3><a href="/evento/${id}/">${esc(e.title)}</a></h3>
      <p class="pl-place">${ico("pin")}<span>${esc(e.place)}</span></p>
      ${hasTix(e) ? `<div class="pl-opt">
        <div class="pl-opt-h"><b>${ico("ticket")}Entradas</b><span class="pl-opt-x">${tixNoteHtml(e)}</span></div>
      </div>` : ""}
      ${uberHtml(e)}
      ${rideBookable(e) ? `<div class="pl-opt">
        <div class="pl-opt-h"><b>${ico("car")}Chofer</b><span class="pl-opt-x" data-note="tr-${id}">${pickHtml(e)}</span></div>
        ${seg("tr", id, RIDES, trOf(e), `Chofer para ${e.title}`)}
      </div>` : ""}
    </div>
    <button type="button" class="pl-x" data-add="${id}" aria-label="Sacar ${esc(e.title)} de mi plan">${ico("close")}</button>
  </article>`;
}

function chosenHtml(list) {
  if (!list.length) return `<p class="pl-none">${ico("ticket")}<span><b>Todavía no elegiste eventos.</b> Tocá los que te interesan arriba. ¿Solo necesitás traslado o alojamiento? Seguí al paso 2.</span></p>`;
  const days = {};
  list.forEach(e => { (days[e.date] = days[e.date] || []).push(e); });
  return `<p class="pl-lbl">En tu plan <small>${plural(list.length, "evento", "eventos")}</small></p>
    <div class="pl-days">${Object.keys(days).sort().map(d => `<section class="pl-day" aria-label="${esc(longDate({ date: d }))}">
      <div class="pl-date"><small>${dow(d)}</small><b>${parseInt(d.slice(8), 10)}</b><small>${MES[+d.slice(5, 7) - 1]}</small></div>
      <div class="pl-evs">${days[d].map(eventCard).join("")}</div>
    </section>`).join("")}</div>`;
}

function eventsStep(list) {
  return `<section class="pl-sec">
    ${stepHead(1, "Elegí tus eventos", choferPropio() ? "Sumá los eventos a los que vas. En fiestas y shows con entrada también podés pedir chofer." : "Sumá los eventos a los que vas: en cada uno tenés las entradas y cómo ir y volver.")}
    <div class="pl-cat">
      <p class="pl-lbl">Agenda <small>tocá un evento para sumarlo</small></p>
      <label class="pl-find">${ico("search")}<input type="search" id="pl-q" placeholder="Buscar evento, artista o lugar" aria-label="Buscar evento" enterkeyhint="search" autocomplete="off" spellcheck="false"></label>
      <div class="pl-cchips" role="group" aria-label="Categorías">${catChips()}</div>
      <div class="pl-strip-wrap">
        <button type="button" class="pl-strip-nav prev" data-strip="-1" aria-label="Eventos anteriores">${ico("arrow")}</button>
        <div class="pl-strip" id="pl-strip">${stripHtml()}</div>
        <button type="button" class="pl-strip-nav next" data-strip="1" aria-label="Más eventos">${ico("arrow")}</button>
      </div>
    </div>
    <div class="pl-chosen" id="pl-chosen">${chosenHtml(list)}</div>
  </section>`;
}

function arrivalStep(list) {
  const a = opts.arr, arr = arrOf();
  const real = arr && arr.id !== "own";
  return `<section class="pl-sec">
    ${stepHead(2, "Llegada y regreso", "Te esperamos al llegar con tu nombre y te llevamos de vuelta.")}
    <div class="pl-card">
      <p class="pl-q">¿Cómo llegás a Punta del Este?</p>
      <div class="pl-chips" role="radiogroup" aria-label="Cómo llegás">
        ${ARRIVALS.map(o => `<button type="button" class="pl-chip" role="radio" data-via="${o.id}" aria-checked="${a.via === o.id}">${esc(o.label)}</button>`).join("")}
      </div>
      ${real ? `<p class="pl-tip">${ico("plane")}<span><b>${esc(arr.place)}</b> → Punta del Este: ${esc(arr.trip)} aprox.</span></p>
        <div class="pl-opt pl-opt-flat">
          <div class="pl-opt-h"><b>${ico("car")}Traslado con chofer</b><span>${esc(arr.place)} ↔ tu alojamiento</span></div>
          ${seg("arr", "transfer", TRANSFERS, a.transfer, "Traslado de llegada y regreso")}
        </div>
        <div class="pl-legs">
          <fieldset class="pl-leg"><legend>Llegada</legend>
            <div class="pl-three">
              <label>Día<input type="date" name="inDate" value="${esc(arrIn(list))}" min="${TODAY}"></label>
              <label>Hora<input type="time" name="inTime" value="${esc(a.inTime || "")}"></label>
              ${arr.ref ? `<label><span>${arr.ref} <small>(opcional)</small></span><input name="inRef" value="${esc(a.inRef || "")}" placeholder="${arr.ref === "Vuelo" ? "AR 1234" : "Buquebus"}" autocomplete="off"></label>` : ""}
            </div>
          </fieldset>
          <fieldset class="pl-leg"><legend>Regreso</legend>
            <div class="pl-three">
              <label>Día<input type="date" name="outDate" value="${esc(arrOut(list))}" min="${TODAY}"></label>
              <label>Hora<input type="time" name="outTime" value="${esc(a.outTime || "")}"></label>
              ${arr.ref ? `<label><span>${arr.ref} <small>(opcional)</small></span><input name="outRef" value="${esc(a.outRef || "")}" placeholder="${arr.ref === "Vuelo" ? "AR 1235" : "Buquebus"}" autocomplete="off"></label>` : ""}
            </div>
          </fieldset>
        </div>`
      : arr ? `<p class="pl-tip">${ico("check")}<span>Perfecto. Si cambiás de idea, elegí cómo llegás y lo sumamos.</span></p>`
      : `<p class="pl-tip">${ico("plane")}<span>Si venís de afuera, el traslado desde el aeropuerto o el puerto es lo que más tiempo te ahorra.</span></p>`}
    </div>
    ${pickupHtml()}
  </section>`;
}

function zonesHtml(list) {
  const sel = zoneOf(list), best = list.length ? bestZone(list) : "";
  return ZONES.map(z => {
    const m = avgMin(z.geo, list);
    return `<button type="button" class="pl-zone" data-zone="${esc(z.name)}" aria-pressed="${z.name === sel}">
      <b>${esc(z.name)}${z.name === best ? '<em>Recomendada</em>' : ""}</b>
      <span>${esc(z.blurb)}</span>
      ${m != null ? `<small>${ico("car")}≈ ${m} min a tus eventos</small>` : ""}
    </button>`;
  }).join("") + `<button type="button" class="pl-zone pl-zone-any" data-zone="${ANY_ZONE}" aria-pressed="${sel === ANY_ZONE}"><b>${ANY_ZONE}</b><span>Te mostramos todo Punta del Este.</span></button>`;
}

function staysHtml(list) {
  if (!STAY_LIST.length) return "";
  const zone = zoneOf(list);
  const sorted = [...STAY_LIST].sort((a, b) => (b.zone === zone) - (a.zone === zone) || (avgMin(a.geo, list) || 99) - (avgMin(b.geo, list) || 99));
  return `<p class="pl-q" style="margin-top:6px">Alojamientos con convenio</p>
    <div class="pl-stays">${sorted.map(s => {
      const m = s.geo ? avgMin(s.geo, list) : null;
      return `<button type="button" class="pl-stay-card" data-stay="${esc(s.id)}" aria-pressed="${opts.stayId === s.id}">
        <span class="pl-stay-img">${s.photo ? `<img src="img/alojamientos/${esc(s.photo)}" alt="" loading="lazy">` : ico("bed")}</span>
        <span class="pl-stay-t"><b>${esc(s.name)}</b><small>${esc(s.zone)} · ${esc(s.type)}${s.sleeps ? ` · hasta ${s.sleeps} personas` : ""}${s.partner ? ` · de ${esc(s.partner)}` : ""}</small>
          ${s.perks && s.perks.length ? `<small>${s.perks.map(esc).join(" · ")}</small>` : ""}
          <span class="pl-stay-f">${s.from ? `<em>desde US$ ${s.from}/noche</em>` : ""}${m != null ? `<small>≈ ${m} min a tus eventos</small>` : ""}</span></span>
        <span class="pl-stay-ok" aria-hidden="true">${ico("check")}</span>
      </button>`;
    }).join("")}</div>`;
}

function stayStep(list) {
  const on = stayOn();
  return `<section class="pl-sec">
    ${stepHead(3, "Dónde te quedás", "Elegí la zona y reservá tu alojamiento en Booking. Si sumás traslados, te buscamos ahí.")}
    <div class="pl-card">
      <div class="pl-row"><p class="pl-q">Necesito alojamiento</p><label class="pl-switch" aria-label="Necesito alojamiento"><input type="checkbox" id="pl-stay"${on ? " checked" : ""}><span></span></label></div>
      ${on ? `<p class="pl-q">¿Qué días te quedás? <small>${list.length ? "Tocá un día para cambiar la llegada o la salida" : "Tocá el día que llegás y el día que te vas"}</small></p>
        <div class="pl-cal" id="pl-cal">${calHtml(list)}</div>
        <input type="hidden" name="aIn" value="${esc(stayIn(list))}"><input type="hidden" name="aOut" value="${esc(stayOut(list))}">
        ${nightsHtml(list)}
        <div class="mapa pl-map-wrap"><div class="mapa-box pl-map" id="pl-map"><p class="mapa-wait">Cargando el mapa…</p></div></div>
        <p class="pl-q">Zona <small>(tocala en el mapa o elegí abajo)</small></p>
        <div class="pl-zones" id="pl-zones">${zonesHtml(list)}</div>
        <label>Tipo de alojamiento<select name="aType">${optionTags(TYPES, opts.aType || "Me da igual")}</select></label>
        <p class="pl-q">¿Cómo querés reservarlo?</p>
        <div class="pl-ways" role="radiogroup" aria-label="Cómo reservar el alojamiento">
          ${[["booking", "Lo reservo yo en Booking", "Elegís entre todos los hoteles y apartamentos y pagás ahí."],
             ["aliados", "Que me lo busquen ustedes", "Te mandamos opciones de inmobiliarias y hoteles aliados de Punta, con precio final."]]
            .map(([v, t, sub]) => `<button type="button" class="pl-way" role="radio" data-staymode="${v}" aria-checked="${(opts.stayMode || "booking") === v}"><span class="pl-dot" aria-hidden="true"></span><span><b>${t}</b><small>${sub}</small></span></button>`).join("")}
        </div>
        <div class="pl-booking${opts.stayMode === "aliados" ? " is-aliados" : ""}" id="pl-booking">${bookingHtml(list)}</div>
        <div id="pl-stays">${staysHtml(list)}</div>` : ""}
    </div>
  </section>`;
}

/* Booking: un bloque claro con lo que se va a buscar y el botón; aviso de que es un link de referido */
/* Mini calendario de la estadía: la llegada y la salida llenas y las noches del medio pintadas. Los días de los eventos del
   plan van con el número en celeste. Con eventos, un toque cambia la llegada (hasta el día del primer evento) o la salida
   (desde el día después del último); los días del medio son fijos. Sin eventos: primero la llegada, después la salida. */
let calMonth = "", calFirst = "";                 // mes a la vista (AAAA-MM) y entrada ya tocada que espera la salida
const SEMANA = typeof I18N === "object" ? I18N.week() : ["L", "M", "M", "J", "V", "S", "D"];
function calHtml(list) {
  const a = calFirst || stayIn(list), b = calFirst ? "" : stayOut(list);
  const month = calMonth || (a || TODAY).slice(0, 7), [y, m] = month.split("-").map(Number);
  const lead = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const evDay = {};
  list.forEach(e => { for (let d = e.date; d <= (e.endDate || e.date); d = addDays(d, 1)) evDay[d] = true; });
  const cells = Array.from({ length: lead }, () => "<span></span>");
  for (let i = 1; i <= days; i++) {
    const d = `${month}-${pad(i)}`, mid = Boolean(a && b && d > a && d < b);
    const fixed = list.length && d > list[0].date && d < minOut(list);       // noches de los eventos: no se pueden sacar
    const cls = [d === a && "is-in", d === a && !b && "is-alone", d === b && "is-out", mid && "is-mid", evDay[d] && "has-ev"].filter(Boolean).join(" ");
    cells.push(`<button type="button" class="pl-cal-d ${cls}" data-day="${d}"${d < TODAY || fixed ? " disabled" : ""} aria-pressed="${d === a || d === b || mid}" aria-label="${dateShort(d)}${evDay[d] ? ", día de evento" : ""}">${i}</button>`);
  }
  return `<div class="pl-cal-h"><button type="button" class="pl-cal-nav" data-calnav="-1" aria-label="Mes anterior"${month > TODAY.slice(0, 7) ? "" : " disabled"}><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <b>${MESES[m - 1].replace(/^./, c => c.toUpperCase())} ${y}</b>
      <button type="button" class="pl-cal-nav" data-calnav="1" aria-label="Mes siguiente"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div>
    <div class="pl-cal-w" aria-hidden="true">${SEMANA.map(s => `<span>${s}</span>`).join("")}</div>
    <div class="pl-cal-g">${cells.join("")}</div>
    ${Object.keys(evDay).length ? `<small class="pl-cal-key">En <b>celeste</b>, los días de tus eventos: siempre quedan dentro de tu estadía.</small>` : ""}`;
}
/* Un toque en un día: primero la entrada, después la salida (si toca un día anterior, ese pasa a ser la entrada) */
function pickDay(d) {
  const list = planEvents();
  if (list.length) {                                                   // con eventos: un toque, llegada o salida
    if (d <= list[0].date) opts.aIn = d; else if (d >= minOut(list)) opts.aOut = d; else return;
    opts.datesFor = datesKey(); saveOpts(); syncDates(list);
  } else if (calFirst && d > calFirst) { opts.aIn = calFirst; opts.aOut = d; calFirst = ""; opts.datesFor = datesKey(); saveOpts(); syncDates(list); }
  else calFirst = d;
  refresh(list);
}

/* Noches: se cambian con − y + (mueve la salida) o en el calendario. Por defecto, un día antes y uno después de los eventos. */
const nightsOf = list => (stayIn(list) && stayOut(list) ? daysBetween(stayIn(list), stayOut(list)) : 0);
function nightsText(list) {
  const n = nightsOf(list);
  if (!stayIn(list) || !stayOut(list)) return "Elegí la entrada y la salida.";
  if (n < 1) return "La salida tiene que ser después de la entrada.";
  const byDefault = list.length && stayIn(list) === tripStart(list) && tripStart(list) < list[0].date && stayOut(list) === addDays(tripEnd(list), 1);
  return `Del ${dmy2(stayIn(list))} al ${dmy2(stayOut(list))}${byDefault ? ": un día antes y uno después de tus eventos" : ""}.`;
}
function nightsHtml(list) {
  const n = nightsOf(list);
  return `<div class="pl-row pl-nights"><b>Noches</b>
      <div class="pl-stepper"><button type="button" data-nights="-1" aria-label="Una noche menos">−</button><output id="pl-nights">${Math.max(n, 0)}</output><button type="button" data-nights="1" aria-label="Una noche más">+</button></div></div>
    <small class="pl-hint${n < 1 && stayIn(list) && stayOut(list) ? " is-bad" : ""}" id="pl-nights-t">${nightsText(list)}</small>`;
}

function bookingHtml(list) {
  if (opts.stayMode === "aliados") return `<div class="pl-booking-t"><b>Te lo buscamos nosotros</b><span>Le pasamos tu pedido a inmobiliarias y hoteles aliados de Punta y te mandamos por mail las mejores opciones para <b>${bookingText(list)}</b>, con precio final. Pagás online solo si te sirve.</span></div>
    <label>Presupuesto por noche<select name="aBudget">${optionTags(BUDGETS, opts.aBudget || "A conversar")}</select></label>`;
  if (quoteStay()) return `<p class="pl-tip">${ico("check")}<span>Elegiste un alojamiento con convenio: te lo cotizamos junto con el resto del plan.</span></p>`;
  return `<div class="pl-booking-t"><b>Elegí tu alojamiento en Booking</b><span>Te mostramos los de <b>${bookingText(list)}</b>. Elegís, reservás y pagás directo en Booking; muchos tienen cancelación gratis.</span></div>
    <a class="btn pl-booking-go" id="pl-booking-go" href="${esc(bookingUrl(list))}" target="_blank" rel="sponsored noopener" data-ev="booking">Ver alojamientos en Booking ${ico("arrow")}</a>
    <small class="pl-booking-fine">Enlace de referido: Eventos PDE puede recibir una comisión de Booking, sin costo extra para vos.</small>`;
}

/* Dónde lo buscamos (para los traslados): la zona da el precio al instante; la dirección puede quedar para después */
/* Para los traslados: dónde se aloja (el chofer lo lleva o lo busca ahí). Una sola pregunta clara, al final del paso 2;
   se ve solo si pidió algún traslado. La zona se completa sola con la del alojamiento del paso 3. */
function pickupHtml() {
  return `<div class="pl-card pl-pickup" id="pl-pickup">
    <p class="pl-q">Para el chofer: ¿dónde te alojás?</p>
    <div class="pl-two">
      <label>Zona<select name="rideZone"><option value="">Elegí la zona</option>${ZONES.map(z => `<option${z.name === opts.rideZone ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></label>
      <label><span>Dirección u hotel <small>(si ya la sabés)</small></span><input name="from" value="${esc(opts.from || "")}" placeholder="Ej.: Calle 20 y Gorlero" autocomplete="off"></label>
    </div>
    <small class="pl-hint">Si todavía no la sabés, dejala vacía: te la pedimos por WhatsApp antes del viaje.</small></div>`;
}

function contactStep() {
  return `<section class="pl-sec" id="pl-contact">
    ${stepHead(4, "Tus datos", "Para mandarte el precio por mail y coordinar.")}
    <div class="pl-card">
      <label>Nombre y apellido<input name="name" required autocomplete="name" value="${esc(opts.name || "")}"></label>
      <div class="pl-two">
        <label>Mail<input type="email" name="email" required autocomplete="email" inputmode="email" value="${esc(opts.email || "")}" placeholder="ahí te llega el precio"></label>
        <label>WhatsApp<input type="tel" name="phone" required autocomplete="tel" value="${esc(opts.phone || "")}" placeholder="con código de país: +54 9 11…"></label>
      </div>
      <div class="pl-two">
        <label>País<select name="country">${optionTags(COUNTRIES, opts.country || "Argentina")}</select></label>
        <label>Idioma<select name="lang">${optionTags(LANGS, opts.lang || "Español")}</select></label>
      </div>
      <label><span>Algo más <small>(opcional)</small></span><input name="notes" value="${esc(opts.notes || "")}" placeholder="Ej.: vamos 2 parejas, uno es vegetariano…" autocomplete="off"></label>
    </div>
  </section>`;
}

/* Pago al instante: si el pedido es solo de traslados con precio (sin alojamiento ni entradas para conseguir) se cobra
   al reservar, con TARIFAS (tarifas.js). Devuelve { usd, items } o null (entonces se pide cotización). */
/* ¿Hay algo que resolvemos nosotros? Traslado del aeropuerto o puerto, alojamiento con aliados o chofer (si está prendido).
   Si no, el plan ya está completo: entradas en la ticketera, alojamiento en Booking y Uber; no hace falta pedir nada. */
const needsUs = list => { const t = totals(list); return Boolean(t.rides || t.airport || quoteStay() || t.tix.length); };
const nothingToDo = list => !needsUs(list);
const usText = list => { const t = totals(list); return [t.airport && "del traslado", quoteStay() && "del alojamiento", t.rides && "del chofer"].filter(Boolean).join(" y "); };

function instant(list) {
  const t = totals(list), zone = opts.rideZone, p = people(), a = opts.arr, items = [];
  if (!choferPropio() || quoteStay() || t.tix.length || (!t.rides && !t.airport) || !zoneByName(zone)) return null;
  for (const e of t.withRide) {
    const tr = trOf(e), legs = tr === "ida y vuelta" ? 2 : 1, g = geoOf(e);
    const usd = rideUSD(zone, g, legs, p);
    if (!usd) return null;                                             // un evento sin ubicación: se cotiza a mano
    items.push({ tipo: "evento", titulo: e.title, fecha: legDay(e.date), lugar: shortPlace(e), geo: g, legs, sentido: tr,
      busca: goes(tr) ? pickOf(e) : "", vuelta: tr !== "solo ida" ? "a la hora que nos avises por WhatsApp" : "", usd });
  }
  if (t.airport) {
    const legs = t.tf === "ambos" ? 2 : 1, usd = arrivalUSD(t.arr.id, legs, p);
    if (!usd) return null;
    const inn = t.tf !== "regreso", out = t.tf !== "llegada";
    items.unshift({ tipo: "llegada", via: t.arr.id, legs, sentido: t.tf,
      inFecha: inn ? legDay(arrIn(list)) : "", inHora: inn ? a.inTime || "" : "", inRef: inn ? a.inRef || "" : "",
      outFecha: out ? legDay(arrOut(list)) : "", outHora: out ? a.outTime || "" : "", outRef: out ? a.outRef || "" : "", usd });
  }
  return { usd: items.reduce((s, i) => s + i.usd, 0), items };
}

/* ============ 4. Resumen (columna fija en PC, al final en el celular) ============ */
const TF_TEXT = { ambos: "Traslado de llegada y regreso", llegada: "Traslado de llegada", regreso: "Traslado de regreso" };
function summaryLines(list) {
  const t = totals(list), p = people();
  const zone = zoneOf(list), stay = stayById(opts.stayId);
  const line = (icon, b, s) => `<li>${ico(icon)}<span><b>${b}</b>${s ? `<small>${s}</small>` : ""}</span></li>`;
  return [
    t.tix.length ? line("ticket", plural(t.tix.length * p, "entrada", "entradas"), `${plural(t.tix.length, "evento", "eventos")} × ${plural(p, "persona", "personas")}`) : "",
    list.some(e => ticketLink(e)) ? line("ticket", "Entradas", `las comprás en cada evento, con el botón Comprar`) : "",
    !choferPropio() && list.some(e => rideOK(e)) ? line("car", "Ir y volver con Uber", `botones en ${plural(list.filter(e => rideOK(e)).length, "evento", "eventos")}`) : "",
    t.airport ? line("plane", TF_TEXT[t.tf], esc(t.arr.place)) : "",
    viaBooking() ? line("bed", "Alojamiento en Booking", `${bookingText(list)} · lo reservás vos`)
    : opts.stayMode === "aliados" && !stay ? line("bed", "Alojamiento con aliados", `${bookingText(list)} · te mandamos opciones`)
    : quoteStay() ? (t.nights
      ? line("bed", `${plural(t.nights, "noche", "noches")} de alojamiento`, `${dmy2(stayIn(list))} al ${dmy2(stayOut(list))} · ${esc(stay ? stay.name : zone)}`)
      : line("bed", "Alojamiento", "Elegí las fechas en el paso 3")) : "",
    t.rides ? line("car", `${plural(t.rides, "viaje", "viajes")} con chofer`, `a ${plural(t.withRide.length, "evento", "eventos")}`) : ""
  ].join("") || line("check", "Tu plan está vacío", "Sumá eventos, traslado o alojamiento");
}
function summaryTitle(list) {
  if (!list.length) return "Tu viaje";
  const start = list[0].date, end = tripEnd(list);
  return `${plural(list.length, "evento", "eventos")} · ${dmy2(start)}${start !== end ? ` al ${dmy2(end)}` : ""}`;
}

function summaryHtml(list) {
  return `<aside class="pl-sum" id="pl-sum">
    <p class="pl-eyebrow">Tu viaje</p>
    <h2 id="pl-sum-h">${summaryTitle(list)}</h2>
    <div class="pl-row pl-people"><b>Personas</b>
      <div class="pl-stepper"><button type="button" data-people="-1" aria-label="Una persona menos">−</button><output id="pl-people">${people()}</output><button type="button" data-people="1" aria-label="Una persona más">+</button></div>
    </div>
    <ul class="pl-inc" id="pl-inc">${summaryLines(list)}</ul>
    <div class="pl-total" id="pl-total" hidden><span>Total</span><b></b></div>
    <button class="btn pl-cta" id="pl-cta" type="submit">Pedir cotización</button>
    <p class="pl-fine" id="pl-fine"></p>
  </aside>`;
}

/* ============ 5. Mapa de zonas ============
   Zonas como círculos (se tocan para elegir), los eventos del plan con su póster y los alojamientos del catálogo. */
let plMap = null;
function drawMap(list) {
  const el = $("pl-map");
  if (!el) { plMap = null; return; }
  loadLeaflet().then(() => {
    if (!$("pl-map")) return;
    if (plMap && plMap.getContainer() !== $("pl-map")) { plMap.remove(); plMap = null; }
    if (!plMap) {
      $("pl-map").innerHTML = "";
      plMap = L.map($("pl-map"), { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(plMap);
      plMap.on("click", () => plMap.scrollWheelZoom.enable());
      plMap.layer = L.layerGroup().addTo(plMap);
    }
    const layer = plMap.layer, sel = zoneOf(list), points = [], zonePts = [];
    layer.clearLayers();
    ZONES.forEach(z => {
      const on = z.name === sel;
      L.circle(z.geo, { radius: z.r, color: on ? "#7C4DFF" : "#F4F4F5", weight: on ? 2.5 : 1, opacity: on ? 1 : .5, fillColor: on ? "#7C4DFF" : "#F4F4F5", fillOpacity: on ? .28 : .06 })
        .on("click", () => pickZone(z.name)).addTo(layer)
        .bindTooltip(z.name, { permanent: true, direction: "center", className: `pl-ztip${on ? " on" : ""}` });
      if (on || z.name !== "José Ignacio") zonePts.push(z.geo);   // José Ignacio queda lejos: entra en el encuadre solo si está elegida
    });
    const groups = new Map();
    list.forEach(e => { const g = geoOf(e); if (g) { const k = g.join(); if (!groups.has(k)) groups.set(k, { g, evs: [] }); groups.get(k).evs.push(e); } });
    groups.forEach(({ g, evs }) => {
      L.marker(g, { icon: L.divIcon({ className: "mk-icon", html: markerHtml(evs), iconSize: [MK.w, MK.h], iconAnchor: [MK.w / 2, MK.h] }), title: shortPlace(evs[0]), keyboard: false, interactive: false }).addTo(layer);
      points.push(g);
    });
    STAY_LIST.filter(s => s.geo).forEach(s => {
      L.marker(s.geo, { icon: L.divIcon({ className: "mk-icon", html: `<span class="pl-spin${opts.stayId === s.id ? " on" : ""}">${ico("bed")}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }), title: s.name, zIndexOffset: 1000 })
        .on("click", () => pickStay(s.id)).addTo(layer);
    });
    plMap.invalidateSize();
    if (!plMap.fitted) { plMap.fitBounds([...zonePts, ...points], { paddingTopLeft: [24, MK.h + 10], paddingBottomRight: [24, 24], maxZoom: 13 }); plMap.fitted = true; }
  }).catch(() => { const m = $("pl-map"); if (m) m.innerHTML = '<p class="mapa-wait">No se pudo cargar el mapa. Elegí la zona abajo.</p>'; });
}

/* ============ 6. Dibujo ============ */
const SUB_DEFAULT = $("pl-sub").textContent;
function subText(list) {
  if (!list.length) return SUB_DEFAULT;
  const start = list[0].date, end = tripEnd(list);
  const when = start === end ? `el ${dow(start).toLowerCase()} ${dmy2(start)}` : `del ${dow(start).toLowerCase()} ${dmy2(start)} al ${dow(end).toLowerCase()} ${dmy2(end)}`;
  return `${plural(list.length, "evento", "eventos")}, ${when}. Comprá las entradas, sumá el traslado del aeropuerto si lo necesitás y elegí dónde quedarte.`;
}

function render() {
  const list = planEvents();
  $("pl-sub").textContent = subText(list);
  plMap = null;
  box.innerHTML = `${shared && shared.join() !== Plan.get().join() ? `<div class="pl-banner"><p>Te compartieron este plan.</p><button type="button" class="btn" id="pl-save">Guardarlo en mi plan</button></div>` : ""}
    <form class="pl-grid" id="pl-form" novalidate>
      <div class="pl-steps">${eventsStep(list)}${arrivalStep(list)}${stayStep(list)}${contactStep()}</div>
      ${summaryHtml(list)}
    </form>
    <div class="pl-bar" id="pl-bar"><span><b id="pl-bar-n"></b><small id="pl-bar-s">Sin costo ni compromiso</small></span><a class="btn" id="pl-bar-go" href="#pl-sum">Pedir cotización</a></div>`;
  pills();
  refresh(list);
  drawMap(list);
  watchBar();
  stripNav();
}

const pills = () => box.querySelectorAll(".pl-seg").forEach(s => slidePill(s, s.querySelector('[aria-pressed="true"]'), true));

/* Resumen y textos chicos, sin redibujar todo (para no perder lo que se está escribiendo) */
function refresh(list = planEvents()) {
  if (!$("pl-inc")) return;
  $("pl-inc").innerHTML = summaryLines(list);
  $("pl-sum-h").textContent = summaryTitle(list);
  const t = totals(list);
  const parts = [t.tix.length && "entradas", (t.airport || t.rides) && "traslados", stayOn() && "alojamiento"].filter(Boolean);
  $("pl-bar-n").textContent = list.length ? summaryTitle(list) : parts.length ? parts.join(", ").replace(/^./, c => c.toUpperCase()) : "Tu viaje";
  if (!nothingToDo(list)) $("pl-warn")?.remove();                   // el aviso "elegí qué resolvemos" se va solo
  /* Solo traslados con precio: total a la vista y pago con tarjeta; si no, cotización */
  const ins = instant(list);
  const needZone = choferPropio() && !quoteStay() && !t.tix.length && (t.rides || t.airport) && !zoneByName(opts.rideZone);
  if ($("pl-pickup")) $("pl-pickup").hidden = !(t.rides || t.airport);   // "¿Dónde te alojás?" solo si hay traslados
  if ($("pl-booking")) {                                                   // el link a Booking y el texto siguen a fechas, zona, personas y tipo
    if ($("pl-booking-go")) $("pl-booking-go").href = bookingUrl(list);
    const bt = $("pl-booking").querySelector(".pl-booking-t span b"); if (bt) bt.innerHTML = bookingText(list);
  }
  if ($("pl-nights")) {                                                   // noches: siguen a las fechas
    const n = nightsOf(list);
    $("pl-nights").textContent = Math.max(n, 0);
    $("pl-nights-t").textContent = calFirst ? `Llegás el ${dmy2(calFirst)}. Ahora tocá el día que te vas.` : nightsText(list);
    $("pl-nights-t").classList.toggle("is-bad", !calFirst && n < 1 && Boolean(stayIn(list) && stayOut(list)));
  }
  if ($("pl-cal")) $("pl-cal").innerHTML = calHtml(list);
  $("pl-total").hidden = !ins;
  if (ins) $("pl-total").querySelector("b").textContent = `US$ ${ins.usd}`;
  const us = needsUs(list);
  if ($("pl-contact")) $("pl-contact").hidden = !us;                   // "Tus datos" solo si hay algo que resolvemos nosotros
  $("pl-cta").textContent = ins ? `Pagar US$ ${ins.usd} con tarjeta` : us ? `Pedir precio ${usText(list)}` : viaBooking() ? "Ver alojamientos en Booking" : list.length ? "Buscar alojamiento" : "Elegí tus eventos";
  $("pl-fine").textContent = ins ? "Precio final, sin esperar cotización. Pagás con tarjeta y te confirmamos el chofer por WhatsApp."
    : needZone ? "Elegí la zona de tu alojamiento en el paso 2 y ves el precio de los traslados al instante."
    : us ? `Te mandamos el precio ${usText(list)} por mail. Sin costo ni compromiso: pagás online solo si te sirve.`
    : viaBooking() ? `Se abre Booking con tus fechas (${dmy2(stayIn(list))} al ${dmy2(stayOut(list))}), la zona y ${plural(people(), "persona", "personas")}. Las entradas las comprás en cada evento. ¿Te buscamos en el aeropuerto? Sumalo en el paso 2.`
    : list.length ? "Las entradas las comprás en cada evento, con Comprar. ¿Te falta dónde dormir o el traslado del aeropuerto? Sumalos en los pasos 2 y 3."
    : "Sumá eventos en el paso 1, o pedí el traslado del aeropuerto (paso 2) o que te busquemos alojamiento (paso 3).";
  $("pl-bar-s").textContent = ins ? `Total US$ ${ins.usd}` : us ? "Sin costo ni compromiso" : viaBooking() ? "Alojamiento en Booking" : list.length ? "Entradas en cada evento" : "Empezá por tus eventos";
  $("pl-bar-go").textContent = ins ? "Pagar" : us ? "Pedir precio" : viaBooking() ? "Ver en Booking" : list.length ? "Alojamiento" : "Ver plan";
  list.forEach(e => {
    const id = slugOf(e);
    const rn = box.querySelector(`[data-note="tr-${id}"]`); if (rn && !rn.contains(document.activeElement)) rn.innerHTML = pickHtml(e);
  });
}

/* Barra fija abajo en el celular: se esconde cuando el resumen está a la vista */
let barObs = null;
function watchBar() {
  if (barObs) barObs.disconnect();
  const bar = $("pl-bar"), sum = $("pl-sum");
  if (!bar || !sum || !("IntersectionObserver" in window)) return;
  barObs = new IntersectionObserver(([en]) => bar.classList.toggle("off", en.isIntersecting), { threshold: .15 });
  barObs.observe(sum);
}

/* Flechas de la agenda (PC): se apagan en los extremos */
function stripNav() {
  const s = $("pl-strip");
  if (!s) return;
  const upd = () => {
    box.querySelector(".pl-strip-nav.prev").disabled = s.scrollLeft < 8;
    box.querySelector(".pl-strip-nav.next").disabled = s.scrollLeft + s.clientWidth > s.scrollWidth - 8;
  };
  if (!s.dataset.nav) { s.addEventListener("scroll", upd, { passive: true }); s.dataset.nav = "1"; }   // una sola vez por fila
  upd();
}

const FIELDS = ["name", "email", "phone", "from", "rideZone", "notes", "aIn", "aOut", "aType", "aBudget", "country", "lang"];
const ARR_FIELDS = ["inDate", "inTime", "inRef", "outDate", "outTime", "outRef"];
/* Las fechas no se guardan acá: solo cuando la persona las cambia (evento "change"). Así, mientras no las toque,
   siguen a los eventos que suma o saca (ver syncDates). */
const DATES = ["aIn", "aOut", "inDate", "outDate"];
function keepFields(form) {
  const f = Object.fromEntries(new FormData(form));
  FIELDS.forEach(k => { if (f[k] !== undefined && !DATES.includes(k)) opts[k] = f[k]; });
  ARR_FIELDS.forEach(k => { if (f[k] !== undefined && !DATES.includes(k)) opts.arr[k] = f[k]; });
  saveOpts();
  return f;
}
function syncDates(list) {
  const set = (name, val) => { const i = box.querySelector(`[name="${name}"]`); if (i) i.value = val; };
  set("aIn", stayIn(list)); set("aOut", stayOut(list));
  set("inDate", arrIn(list)); set("outDate", arrOut(list));
}

/* Cambia un paso entero sin tocar el resto de la página */
function swapStep(n, html) {
  const form = $("pl-form");
  if (form) keepFields(form);
  const sec = $(`pl-s${n}`).closest(".pl-sec");
  sec.outerHTML = html;
  if (n === 3) { plMap = null; drawMap(planEvents()); }
  pills();
  refresh();
}

/* Sumar o sacar un evento: la agenda se marca en el lugar (no pierde el desplazamiento) y se rehacen
   los eventos elegidos, el resumen, las zonas y el mapa */
function toggleEvent(id) {
  if (shared) { Plan.set([...new Set([...Plan.get(), ...shared])]); Plan.toggle(id); location.replace("/plan.html"); return; }
  const on = Plan.toggle(id);
  const e = byId(id);
  box.querySelectorAll(`.pl-mini[data-add="${CSS.escape(id)}"]`).forEach(b => {
    b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", `${e.title}, ${dateShort(e.date)}${on ? ", en tu plan" : ""}`);
  });
  resetStayDates();
  const list = planEvents();
  $("pl-chosen").innerHTML = chosenHtml(list);
  $("pl-sub").textContent = subText(list);
  syncDates(list);
  pills();
  refreshStay(list);
}

/* Fechas del alojamiento de vuelta a las de por defecto (un día antes y uno después de los eventos) */
function resetStayDates() { opts.aIn = ""; opts.aOut = ""; calMonth = ""; calFirst = ""; saveOpts(); }

/* Zona y catálogo: se actualizan en el lugar (el mapa no se vuelve a armar) */
function refreshStay(list = planEvents()) {
  const z = $("pl-zones"); if (z) z.innerHTML = zonesHtml(list);
  const s = $("pl-stays"); if (s) s.innerHTML = staysHtml(list);
  const bk = $("pl-booking"); if (bk) bk.innerHTML = bookingHtml(list);       // Booking o "te lo cotizamos" según el catálogo
  const type = box.querySelector('[name="aType"]'); if (type) type.value = opts.aType || "Me da igual";
  drawMap(list);
  refresh(list);
}
function pickZone(name) {
  opts.aZone = name;
  /* La zona donde se queda es también donde lo buscamos (si todavía no eligió otra): así ve el precio de los traslados */
  if (!opts.rideZone && zoneByName(name)) { opts.rideZone = name; const rz = box.querySelector('[name="rideZone"]'); if (rz) rz.value = name; }
  const s = stayById(opts.stayId);
  if (s && s.zone !== name) opts.stayId = "";
  saveOpts();
  refreshStay();
  track("plan_zona", { zona: name });
}
function pickStay(id) {
  const s = stayById(id);
  opts.stayId = opts.stayId === id ? "" : id;
  if (opts.stayId && s) { opts.aZone = s.zone; opts.aType = s.type; }
  saveOpts();
  refreshStay();
  if (opts.stayId) track("plan_alojamiento", { alojamiento: s.name });
}

/* ============ 7. Pedido ============ */
const plRef = () => "PLN-" + Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const legDay = iso => (iso ? `${dow(iso)} ${dmy2(iso)}` : "día a confirmar");
const RIDE_TEXT = { "ida y vuelta": "chofer ida y vuelta", "solo ida": "chofer solo ida", "solo vuelta": "chofer solo vuelta", no: "sin chofer" };

/* Una línea "• ..." por tramo: llegada, cada evento y regreso (el script las muestra tal cual en la cotización) */
function itinerary(list) {
  const t = totals(list), a = opts.arr, p = people();
  const lines = [];
  if (t.real) {
    lines.push(`• Llegada: ${legDay(arrIn(list))}${a.inTime ? ` ${a.inTime}` : ""} · ${t.arr.label} · ${t.arr.place}${a.inRef ? ` · ${t.arr.ref.toLowerCase()} ${a.inRef}` : ""}`
      + (t.tf === "ambos" || t.tf === "llegada" ? " · traslado al alojamiento" : " · sin traslado"));
  }
  list.forEach(e => {
    const tr = trOf(e);
    lines.push(`• ${legDay(e.date)} ${hasHour(e) ? e.time + " " : ""}· ${e.title} · ${shortPlace(e)}`
      + (tixOf(e) === "si" ? ` · ${plural(p, "entrada", "entradas")}` : hasTix(e) ? " · entradas por su cuenta" : "")
      + (rideBookable(e) ? ` · ${RIDE_TEXT[tr]}${goes(tr) && pickOf(e) ? `, te buscamos ${pickOf(e)}` : ""}` : ""));
  });
  if (t.real) {
    lines.push(`• Regreso: ${legDay(arrOut(list))}${a.outTime ? ` ${a.outTime}` : ""} · ${t.arr.place}${a.outRef ? ` · ${t.arr.ref.toLowerCase()} ${a.outRef}` : ""}`
      + (t.tf === "ambos" || t.tf === "regreso" ? " · traslado desde el alojamiento" : " · sin traslado"));
  }
  return lines.join("\n");
}

function planPayload(ref, f, list) {
  const t = totals(list), stay = quoteStay(), st = stayById(opts.stayId);
  const parts = [t.tix.length && "entradas", (t.airport || t.rides) && "traslados", stay && "alojamiento"].filter(Boolean);
  const need = "plan: " + (parts.length ? parts.join(", ").replace(/, ([^,]*)$/, " y $1") : "a medida");
  const first = t.withRide[0];
  const itin = itinerary(list);
  return {
    kind: "servicio", ref, need,
    event: list.map(e => `${e.title} (${dmy2(e.date)})`).join(" + "),
    people: String(people()), name: f.name, email: f.email, phone: f.phone,
    tDate: t.airport ? arrIn(list) : first ? first.date : "",
    tGo: t.airport ? (opts.arr.inTime || "") : first ? pickOf(first) : "",
    tFrom: t.airport ? t.arr.place : first ? (stay ? "Su alojamiento" : (f.from || "")) : "",
    tBack: t.airport || first ? "según el itinerario" : "", tBackTime: "",
    aIn: stay ? f.aIn : "", aOut: stay ? f.aOut : "", aZone: stay ? zoneOf(list) : "",
    aType: stay ? (st ? `${st.name} (convenio)` : f.aType) : "", aBudget: stay ? (st && st.from ? `desde US$ ${st.from}` : f.aBudget) : "",
    notes: `${itin ? `Itinerario:\n${itin}\n\n` : ""}País: ${f.country} · Idioma: ${f.lang}${viaBooking() ? ` · Alojamiento: lo reserva en Booking (${zoneOf(list)}, ${dmy2(stayIn(list))} al ${dmy2(stayOut(list))})` : ""}${!stay && f.from ? ` · Se queda en: ${f.from}` : ""}${f.notes ? `\nAlgo más: ${f.notes}` : ""}`
  };
}

function doneHtml(ref, f, ok, msg) {
  const name = esc(f.name.trim().split(/\s+/)[0]);
  if (ok) return `<div class="pl-done">
      <p class="pl-eyebrow" style="color:#46d9a0">Pedido ${esc(ref)}</p>
      <h2>¡Listo, ${name}! Recibimos tu plan.</h2>
      <p>Te mandamos el precio a <b>${esc(f.email)}</b> con todo lo que incluye, el total y el botón para pagar online. Revisá también promociones o spam.</p>
      <ol class="pl-how">
        <li><b>Cotizamos</b><span>Traslado y alojamiento para tus fechas.</span></li>
        <li><b>Te llega por mail</b><span>Con el detalle y el total en dólares.</span></li>
        <li><b>Pagás online y listo</b><span>Después te escribimos para coordinar cada tramo.</span></li>
      </ol>
      <a class="btn ghost" href="/">Volver a la agenda</a>
    </div>`;
  return `<div class="pl-done">
      <h2>¡Casi listo, ${name}!</h2>
      <p>No pudimos enviarlo automáticamente. Mandanos el plan con un toque y te respondemos con opciones y precio.</p>
      <a class="btn pl-cta" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" data-ev="plan_whatsapp">Enviar por WhatsApp</a>
      <a class="btn ghost" href="mailto:${CONFIG.email}?subject=${encodeURIComponent("Mi plan " + ref)}&body=${encodeURIComponent(msg)}" data-ev="plan_mail">Enviar por mail</a>
    </div>`;
}

async function submitPlan(form) {
  const list = planEvents();
  const t = totals(list);
  /* Sin nada que resolvamos nosotros, el botón comparte el plan (o, sin eventos, lleva a elegirlos) */
  if (!needsUs(list)) { nextStep(list); return; }
  if (stayOn() && (calFirst || nightsOf(list) < 1)) {                // alojamiento sin fechas completas
    $("pl-cal").scrollIntoView({ behavior: "smooth", block: "center" });
    $("pl-nights-t").textContent = calFirst ? "Falta el día que te vas: tocalo en el calendario." : "Tocá en el calendario el día que llegás y el día que te vas.";
    $("pl-nights-t").classList.add("is-bad");
    return;
  }
  /* Los datos obligatorios se piden al final; si falta alguno, se marca y se lleva la vista ahí */
  const bad = [...form.querySelectorAll("[required]")].find(i => !i.checkValidity());
  if (bad) {
    bad.closest(".pl-sec")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { bad.focus({ preventScroll: true }); bad.reportValidity(); }, 450);
    return;
  }
  const f = keepFields(form);
  const btn = form.querySelector('[type="submit"]');
  /* Solo traslados con precio: se reserva y se paga ya (el script vuelve a calcular el precio y abre Mercado Pago) */
  const ins = instant(list);
  if (ins) {
    btn.disabled = true; btn.textContent = "Abriendo el pago…";
    track("plan_pagar", { eventos: list.length, usd: ins.usd, llegada: opts.arr.via || "" });
    try {
      const res = await fetch(CONFIG.formUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({
        kind: "traslado", zone: opts.rideZone, address: f.from || "A confirmar por WhatsApp", people: people(), name: f.name, email: f.email, phone: f.phone,
        notes: `País: ${f.country} · Idioma: ${f.lang}${viaBooking() ? ` · Alojamiento: lo reserva en Booking (${zoneOf(list)}, ${dmy2(stayIn(list))} al ${dmy2(stayOut(list))})` : ""}${f.notes ? ` · ${f.notes}` : ""}`, items: ins.items.map(({ usd, ...it }) => it) }) });
      const r = await res.json();
      /* Solo se va a pagar si el script devolvió una reserva de traslado (TRS-…): un script viejo, sin traslados,
         contestaría ok pero sin reserva, y la página de pago diría "No encontramos el pedido" */
      if (r.ok && /^TRS-/.test(r.ref || "") && (r.url || r.pagina)) { location.href = r.url || r.pagina; return; }
      alert((!r.ok && r.error) || (typeof I18N === "object" ? I18N.t("No pudimos abrir el pago en este momento. Escribinos por WhatsApp y te mandamos el link.") : "No pudimos abrir el pago en este momento. Escribinos por WhatsApp y te mandamos el link."));
    } catch (_) { alert(typeof I18N === "object" ? I18N.t("No pudimos abrir el pago. Revisá la conexión y probá de nuevo.") : "No pudimos abrir el pago. Revisá la conexión y probá de nuevo."); }
    btn.disabled = false; refresh(list);
    return;
  }
  const ref = plRef();
  const data = planPayload(ref, f, list);
  btn.disabled = true; btn.textContent = "Enviando…";
  let ok = false;
  if (CONFIG.formUrl && CONFIG.formServicios) {
    try {
      const res = await fetch(CONFIG.formUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(data) });
      ok = Boolean((await res.json()).ok);
    } catch (_) { /* plan B: WhatsApp o mail */ }
  }
  const msg = `Hola! Quiero cotizar mi plan en Punta con Eventos PDE.\nPedido: ${ref}\nPersonas: ${data.people}\n${data.aIn ? `Alojamiento: del ${dmy2(data.aIn)} al ${dmy2(data.aOut)} · ${data.aZone} · ${data.aType} · ${data.aBudget}\n` : "Sin alojamiento\n"}\n${data.notes}\n\n${f.name} · ${f.email} · ${f.phone}`;
  $("pl-sub").textContent = "";
  box.innerHTML = doneHtml(ref, f, ok, msg);
  track("plan_cotizar", { eventos: list.length, via: ok ? "sistema" : "manual", llegada: opts.arr.via || "", alojamiento: quoteStay() ? zoneOf(list) : viaBooking() ? "booking" : "no" });
  scrollTo({ top: 0, behavior: "smooth" });
}

/* Sin nada que resolvamos nosotros, el botón lleva a lo que le falta: Booking, sumar alojamiento o elegir eventos */
function nextStep(list) {
  if (viaBooking()) { track("booking", { desde: "resumen" }); window.open(bookingUrl(list), "_blank", "noopener"); return; }
  if (list.length) {
    opts.stay = true; resetStayDates(); swapStep(3, stayStep(list));
    $("pl-s3").closest(".pl-sec").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  $("pl-s1").closest(".pl-sec").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ============ 8. Inicio ============ */
box.addEventListener("click", ev => {
  const t = ev.target;
  const add = t.closest("[data-add]");
  if (add) { ev.preventDefault(); toggleEvent(add.dataset.add); return; }
  const cat = t.closest("[data-cat]");
  if (cat) {
    plCat = cat.dataset.cat;
    box.querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-pressed", b === cat));
    $("pl-strip").innerHTML = stripHtml();
    $("pl-strip").scrollLeft = 0;
    stripNav();
    return;
  }
  const nav = t.closest("[data-strip]");
  if (nav) { const s = $("pl-strip"); s.scrollBy({ left: Number(nav.dataset.strip) * s.clientWidth * .85, behavior: "smooth" }); return; }
  const sg = t.closest("[data-seg]");
  if (sg) {
    const { seg: kind, id, v } = sg.dataset;
    if (kind === "arr") opts.arr.transfer = v; else (kind === "tix" ? opts.tix : opts.tr)[id] = v;
    saveOpts();
    const group = sg.parentElement;
    group.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === sg));
    slidePill(group, sg);
    refresh();
    return;
  }
  const via = t.closest("[data-via]");
  if (via) { opts.arr.via = opts.arr.via === via.dataset.via ? "" : via.dataset.via; saveOpts(); swapStep(2, arrivalStep(planEvents())); track("plan_llegada", { via: opts.arr.via }); return; }
  const zone = t.closest("[data-zone]");
  if (zone) { pickZone(zone.dataset.zone); return; }
  const mode = t.closest("[data-staymode]");
  if (mode) { opts.stayMode = mode.dataset.staymode; saveOpts(); swapStep(3, stayStep(planEvents())); track("plan_alojamiento_modo", { modo: opts.stayMode }); return; }
  const stay = t.closest("[data-stay]");
  if (stay) { pickStay(stay.dataset.stay); return; }
  const step = t.closest("[data-people]");
  if (step) {
    opts.people = Math.min(30, Math.max(1, people() + Number(step.dataset.people))); saveOpts();
    $("pl-people").textContent = opts.people;
    refresh();
    return;
  }
  const day = t.closest("[data-day]");
  if (day) { pickDay(day.dataset.day); return; }
  const cn = t.closest("[data-calnav]");
  if (cn) {
    const [y, m] = (calMonth || (calFirst || stayIn(planEvents()) || TODAY).slice(0, 7)).split("-").map(Number);
    calMonth = new Date(Date.UTC(y, m - 1 + Number(cn.dataset.calnav), 1)).toISOString().slice(0, 7);
    refresh();
    return;
  }
  const nt = t.closest("[data-nights]");
  if (nt) {
    calFirst = "";                                                                // − / + noches: mueve la salida, mínimo una noche
    const list = planEvents(), a = stayIn(list) || TODAY;
    opts.aIn = a;
    opts.aOut = addDays(a, Math.min(60, Math.max(1, nightsOf(list) + Number(nt.dataset.nights))));
    opts.datesFor = datesKey(); saveOpts(); syncDates(list); refresh(list);
    return;
  }
  if (t.closest("#pl-bar-go") && !needsUs(planEvents())) { ev.preventDefault(); nextStep(planEvents()); return; }
  if (t.closest("#pl-save")) {
    Plan.set([...new Set([...Plan.get(), ...shared])]);
    location.replace("/plan.html");
  }
});

box.addEventListener("change", ev => {
  const t = ev.target;
  if (t.matches("[data-pick]")) { opts.pick[t.dataset.pick] = t.value; saveOpts(); return; }
  if (t.id === "pl-stay") { opts.stay = t.checked; resetStayDates(); swapStep(3, stayStep(planEvents())); return; }
  if (ARR_FIELDS.includes(t.name)) { opts.arr[t.name] = t.value; saveOpts(); refresh(); return; }
  if (FIELDS.includes(t.name)) { opts[t.name] = t.value; saveOpts(); refresh(); }
});

box.addEventListener("submit", ev => { ev.preventDefault(); submitPlan(ev.target); });

/* Buscador de la agenda del plan: filtra mientras se escribe; Enter no manda el pedido (cierra el teclado) */
const refreshStrip = () => { $("pl-strip").innerHTML = stripHtml(); $("pl-strip").scrollLeft = 0; stripNav(); };
box.addEventListener("input", ev => { if (ev.target.id === "pl-q") refreshStrip(); });
box.addEventListener("keydown", ev => { if (ev.target.id === "pl-q" && ev.key === "Enter") { ev.preventDefault(); ev.target.blur(); } });

addEventListener("resize", pills);
render();
if (document.fonts) document.fonts.ready.then(pills);
