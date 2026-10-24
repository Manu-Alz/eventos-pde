/* planner.js · planificador "Armar plan" (plan.html), pensado sobre todo para quien viene de afuera
   Es el lugar único para pedir entradas, traslados y alojamiento. Cuatro pasos y un resumen fijo al costado:
   1 Tus eventos: la agenda adentro (mini tarjetas con filtro por categoría) para sumar o sacar eventos, y por cada
     evento elegido: entradas (las incluimos o ya las tiene) y chofer (ida y vuelta, solo ida, solo vuelta o no).
   2 Llegada y regreso: cómo llega (avión, barco, ómnibus o por su cuenta) y el traslado desde y hacia el aeropuerto
     o puerto (los dos tramos, solo la llegada, solo el regreso o ninguno).
   3 Dónde te quedás: apagado por defecto ("Necesito alojamiento"); prendido, fechas, zona en un mapa (con los minutos
     hasta sus eventos) y, si hay convenios, el catálogo STAYS (config.js).
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
/* Chofer: solo en los eventos con traslado (rideOK, cards.js: fiestas y música en vivo con entradas); en los demás, "no" */
const trOf = e => (rideOK(e) ? opts.tr[slugOf(e)] || "ida y vuelta" : "no");
const goes = tr => tr === "ida y vuelta" || tr === "solo ida";      // ese tramo necesita hora de búsqueda
/* Entradas: con link de compra, por defecto "Las compro yo" (las paga al instante en la ticketera, con nuestro código de
   afiliado si hay); sin link pero con precio, "Incluilas" (se cotizan); sin ninguno de los dos (gratis o sin datos), nada */
const hasTix = e => Boolean(e.tickets || e.price);
const tixOf = e => (!hasTix(e) ? "no" : opts.tix[slugOf(e)] || (e.tickets ? "no" : "si"));
const stayOn = () => opts.stay === true;                            // alojamiento: apagado hasta que la persona lo prende
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

/* Fechas del viaje: sin datos, llegada el día del primer evento y salida el día después del último (sin eventos, vacías) */
const tripStart = list => (list.length ? list[0].date : "");
const tripEnd = list => (list.length ? list.map(e => e.endDate || e.date).sort().pop() : "");
const arrIn = list => opts.arr.inDate || opts.aIn || tripStart(list);
const arrOut = list => opts.arr.outDate || opts.aOut || (list.length ? addDays(tripEnd(list), 1) : "");
const stayIn = list => opts.aIn || arrIn(list);
const stayOut = list => opts.aOut || arrOut(list);

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
  if (tixOf(e) === "si") return `<span>${plural(people(), "entrada", "entradas")}${e.price ? ` · ${esc(e.price)}` : ""} · van en la cotización</span>`;
  return t ? `<a href="${esc(t.url)}" target="_blank" rel="noopener${t.affiliate ? " sponsored" : ""}" data-ev="entradas" data-n="${esc(e.title)}">Comprar ${ico("arrow")}</a>` : "";
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
        <div class="pl-opt-h"><b>${ico("ticket")}Entradas</b><span class="pl-opt-x" data-note="tix-${id}">${tixNoteHtml(e)}</span></div>
        ${seg("tix", id, e.tickets ? [["no", "Las compro yo"], ["si", "Incluilas en el plan"]] : [["si", "Incluilas en el plan"], ["no", "Ya las tengo"]], tixOf(e), `Entradas para ${e.title}`)}
      </div>` : ""}
      ${rideOK(e) ? `<div class="pl-opt">
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
    ${stepHead(1, "Elegí tus eventos", "Sumá los eventos a los que vas. En fiestas y shows con entrada también podés pedir chofer.")}
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
  }).join("") + `<button type="button" class="pl-zone pl-zone-any" data-zone="${ANY_ZONE}" aria-pressed="${sel === ANY_ZONE}"><b>${ANY_ZONE}</b><span>Te proponemos lo mejor para tus fechas.</span></button>`;
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
        <span class="pl-stay-t"><b>${esc(s.name)}</b><small>${esc(s.zone)} · ${esc(s.type)}${s.sleeps ? ` · hasta ${s.sleeps} personas` : ""}</small>
          ${s.perks && s.perks.length ? `<small>${s.perks.map(esc).join(" · ")}</small>` : ""}
          <span class="pl-stay-f">${s.from ? `<em>desde US$ ${s.from}/noche</em>` : ""}${m != null ? `<small>≈ ${m} min a tus eventos</small>` : ""}</span></span>
        <span class="pl-stay-ok" aria-hidden="true">${ico("check")}</span>
      </button>`;
    }).join("")}</div>`;
}

function stayStep(list) {
  const on = stayOn();
  return `<section class="pl-sec">
    ${stepHead(3, "Dónde te quedás", "Te buscamos alojamiento cerca de tus eventos.")}
    <div class="pl-card">
      <div class="pl-row"><p class="pl-q">Necesito alojamiento</p><label class="pl-switch" aria-label="Necesito alojamiento"><input type="checkbox" id="pl-stay"${on ? " checked" : ""}><span></span></label></div>
      ${on ? `<div class="pl-two">
          <label>Entrada<input type="date" name="aIn" value="${esc(stayIn(list))}" min="${TODAY}" required></label>
          <label>Salida<input type="date" name="aOut" value="${esc(stayOut(list))}" min="${TODAY}" required></label>
        </div>
        <div class="mapa pl-map-wrap"><div class="mapa-box pl-map" id="pl-map"><p class="mapa-wait">Cargando el mapa…</p></div></div>
        <p class="pl-q">Zona <small>(tocala en el mapa o elegí abajo)</small></p>
        <div class="pl-zones" id="pl-zones">${zonesHtml(list)}</div>
        <div id="pl-stays">${staysHtml(list)}</div>
        <div class="pl-two">
          <label>Tipo<select name="aType">${optionTags(TYPES, opts.aType || "Me da igual")}</select></label>
          <label>Presupuesto por noche<select name="aBudget">${optionTags(BUDGETS, opts.aBudget || "A conversar")}</select></label>
        </div>`
      : `<p class="pl-q">¿Dónde te buscamos? <small>(con la zona ves el precio de los traslados al instante)</small></p>
        <div class="pl-two">
          <label>Zona<select name="rideZone"><option value="">Elegí tu zona</option>${ZONES.map(z => `<option${z.name === opts.rideZone ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select></label>
          <label>Dirección u hotel<input name="from" value="${esc(opts.from || "")}" placeholder="Calle y número, o el hotel" autocomplete="off"></label>
        </div>`}
    </div>
  </section>`;
}

function contactStep() {
  return `<section class="pl-sec">
    ${stepHead(4, "Tus datos", "Para mandarte la confirmación y coordinar cada tramo.")}
    <div class="pl-card">
      <label>Nombre y apellido<input name="name" required autocomplete="name" value="${esc(opts.name || "")}"></label>
      <div class="pl-two">
        <label>Mail<input type="email" name="email" required autocomplete="email" inputmode="email" value="${esc(opts.email || "")}" placeholder="ahí te llega la cotización"></label>
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
/* Nada para pedir: ni chofer, ni aeropuerto, ni alojamiento, ni entradas incluidas */
const nothingToDo = list => { const t = totals(list); return !t.rides && !t.airport && !stayOn() && !t.tix.length; };

function instant(list) {
  const t = totals(list), zone = opts.rideZone, p = people(), a = opts.arr, items = [];
  if (stayOn() || t.tix.length || (!t.rides && !t.airport) || !zoneByName(zone)) return null;
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
    t.airport ? line("plane", TF_TEXT[t.tf], esc(t.arr.place)) : "",
    stayOn() ? (t.nights
      ? line("bed", `${plural(t.nights, "noche", "noches")} de alojamiento`, `${dmy2(stayIn(list))} al ${dmy2(stayOut(list))} · ${esc(stay ? stay.name : zone)}`)
      : line("bed", "Alojamiento", "Elegí las fechas en el paso 3")) : "",
    t.rides ? line("car", `${plural(t.rides, "viaje", "viajes")} con chofer`, `a ${plural(t.withRide.length, "evento", "eventos")}`) : ""
  ].join("") || line("check", "Elegí qué incluir", "Entradas, traslados o alojamiento");
}
function summaryTitle(list) {
  if (!list.length) return "Tu viaje";
  const start = tripStart(list), end = tripEnd(list);
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
    ${list.length ? `<button type="button" class="pl-share" id="pl-share">${ico("share")}Compartir mi plan</button>` : ""}
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
  const start = tripStart(list), end = tripEnd(list);
  const when = start === end ? `el ${dow(start).toLowerCase()} ${dmy2(start)}` : `del ${dow(start).toLowerCase()} ${dmy2(start)} al ${dow(end).toLowerCase()} ${dmy2(end)}`;
  return `${plural(list.length, "evento", "eventos")}, ${when}. Elegí qué querés que resolvamos y pedí una sola cotización con todo.`;
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
  const needZone = !stayOn() && !t.tix.length && (t.rides || t.airport) && !zoneByName(opts.rideZone);
  $("pl-total").hidden = !ins;
  if (ins) $("pl-total").querySelector("b").textContent = `US$ ${ins.usd}`;
  $("pl-cta").textContent = ins ? `Pagar US$ ${ins.usd} con tarjeta` : "Pedir cotización";
  $("pl-fine").textContent = ins ? "Precio final, sin esperar cotización. Pagás con tarjeta y te confirmamos el chofer por WhatsApp."
    : needZone ? "Elegí tu zona en el paso 3 y ves el precio de los traslados al instante."
    : nothingToDo(list) ? "Sumá chofer, traslado del aeropuerto o alojamiento para pedir tu plan."
    : t.tix.length || stayOn() ? "Con entradas o alojamiento te mandamos el total por mail, sin costo ni compromiso, y pagás online con tarjeta."
    : "Sin costo ni compromiso. Te mandamos el total por mail y pagás online con tarjeta solo si te sirve.";
  $("pl-bar-s").textContent = ins ? `Total US$ ${ins.usd}` : "Sin costo ni compromiso";
  $("pl-bar-go").textContent = ins ? "Pagar" : "Pedir cotización";
  list.forEach(e => {
    const id = slugOf(e);
    const tn = box.querySelector(`[data-note="tix-${id}"]`); if (tn) tn.innerHTML = tixNoteHtml(e);
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
  const list = planEvents();
  $("pl-chosen").innerHTML = chosenHtml(list);
  $("pl-sub").textContent = subText(list);
  syncDates(list);
  pills();
  refreshStay(list);
  const share = $("pl-share");
  if (!list.length && share) share.remove();
}

/* Zona y catálogo: se actualizan en el lugar (el mapa no se vuelve a armar) */
function refreshStay(list = planEvents()) {
  const z = $("pl-zones"); if (z) z.innerHTML = zonesHtml(list);
  const s = $("pl-stays"); if (s) s.innerHTML = staysHtml(list);
  const type = box.querySelector('[name="aType"]'); if (type) type.value = opts.aType || "Me da igual";
  drawMap(list);
  refresh(list);
}
function pickZone(name) {
  opts.aZone = name;
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
      + (rideOK(e) ? ` · ${RIDE_TEXT[tr]}${goes(tr) && pickOf(e) ? `, te buscamos ${pickOf(e)}` : ""}` : ""));
  });
  if (t.real) {
    lines.push(`• Regreso: ${legDay(arrOut(list))}${a.outTime ? ` ${a.outTime}` : ""} · ${t.arr.place}${a.outRef ? ` · ${t.arr.ref.toLowerCase()} ${a.outRef}` : ""}`
      + (t.tf === "ambos" || t.tf === "regreso" ? " · traslado desde el alojamiento" : " · sin traslado"));
  }
  return lines.join("\n");
}

function planPayload(ref, f, list) {
  const t = totals(list), stay = stayOn(), st = stayById(opts.stayId);
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
    notes: `${itin ? `Itinerario:\n${itin}\n\n` : ""}País: ${f.country} · Idioma: ${f.lang}${!stay && f.from ? ` · Se queda en: ${f.from}` : ""}${f.notes ? `\nAlgo más: ${f.notes}` : ""}`
  };
}

function doneHtml(ref, f, ok, msg) {
  const name = esc(f.name.trim().split(/\s+/)[0]);
  if (ok) return `<div class="pl-done">
      <p class="pl-eyebrow" style="color:#46d9a0">Pedido ${esc(ref)}</p>
      <h2>¡Listo, ${name}! Recibimos tu plan.</h2>
      <p>Te mandamos la cotización a <b>${esc(f.email)}</b> con todo lo que incluye, el total y el botón para pagar online. Revisá también promociones o spam.</p>
      <ol class="pl-how">
        <li><b>Cotizamos</b><span>Entradas, traslados y alojamiento para tus fechas.</span></li>
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
  /* Tiene que pedir algo para resolver: chofer, traslado del aeropuerto, alojamiento o entradas */
  if (nothingToDo(list)) {
    $("pl-s1").closest(".pl-sec").scrollIntoView({ behavior: "smooth", block: "start" });
    $("pl-warn")?.remove();
    $("pl-chosen").insertAdjacentHTML("afterbegin", `<p class="pl-none pl-warn" id="pl-warn">${ico("car")}<span><b>Elegí qué querés que resolvamos:</b> chofer a una fiesta, traslado del aeropuerto (paso 2), alojamiento (paso 3) o entradas incluidas.</span></p>`);
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
    const from = form.querySelector('[name="from"]');
    if (from && !from.value.trim()) { from.closest(".pl-sec").scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => { from.focus({ preventScroll: true }); }, 450); return; }
    btn.disabled = true; btn.textContent = "Abriendo el pago…";
    track("plan_pagar", { eventos: list.length, usd: ins.usd, llegada: opts.arr.via || "" });
    try {
      const res = await fetch(CONFIG.formUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({
        kind: "traslado", zone: opts.rideZone, address: f.from || "", people: people(), name: f.name, email: f.email, phone: f.phone,
        notes: `País: ${f.country} · Idioma: ${f.lang}${f.notes ? ` · ${f.notes}` : ""}`, items: ins.items.map(({ usd, ...it }) => it) }) });
      const r = await res.json();
      /* Solo se va a pagar si el script devolvió una reserva de traslado (TRS-…): un script viejo, sin traslados,
         contestaría ok pero sin reserva, y la página de pago diría "No encontramos el pedido" */
      if (r.ok && /^TRS-/.test(r.ref || "") && (r.url || r.pagina)) { location.href = r.url || r.pagina; return; }
      alert((!r.ok && r.error) || "No pudimos abrir el pago en este momento. Escribinos por WhatsApp y te mandamos el link.");
    } catch (_) { alert("No pudimos abrir el pago. Revisá la conexión y probá de nuevo."); }
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
  track("plan_cotizar", { eventos: list.length, via: ok ? "sistema" : "manual", llegada: opts.arr.via || "", alojamiento: stayOn() ? zoneOf(list) : "no" });
  scrollTo({ top: 0, behavior: "smooth" });
}

async function sharePlan() {
  const url = `${location.origin}/plan.html?e=${planIds().join(",")}`;
  track("plan_compartir", { eventos: planIds().length });
  if (navigator.share) { navigator.share({ title: "Mi plan en Punta", url }).catch(() => {}); return; }
  try { await navigator.clipboard.writeText(url); $("pl-share").lastChild.textContent = "Link copiado"; }
  catch (_) { prompt("Copiá el link de tu plan:", url); }
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
  const stay = t.closest("[data-stay]");
  if (stay) { pickStay(stay.dataset.stay); return; }
  const step = t.closest("[data-people]");
  if (step) {
    opts.people = Math.min(30, Math.max(1, people() + Number(step.dataset.people))); saveOpts();
    $("pl-people").textContent = opts.people;
    refresh();
    return;
  }
  if (t.closest("#pl-share")) { sharePlan(); return; }
  if (t.closest("#pl-save")) {
    Plan.set([...new Set([...Plan.get(), ...shared])]);
    location.replace("/plan.html");
  }
});

box.addEventListener("change", ev => {
  const t = ev.target;
  if (t.matches("[data-pick]")) { opts.pick[t.dataset.pick] = t.value; saveOpts(); return; }
  if (t.id === "pl-stay") { opts.stay = t.checked; saveOpts(); swapStep(3, stayStep(planEvents())); return; }
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
