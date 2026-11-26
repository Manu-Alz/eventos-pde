/* revisar-eventos.js · chequeo general de los eventos vigentes (correrlo después de cargar eventos)
   Uso: node tools/revisar-eventos.js           solo los datos
        node tools/revisar-eventos.js --links   además prueba que respondan los links de entradas
   Avisa: campos que faltan, categoría u hora raras, fotos que no existen o pesadas, eventos sin pin o con el pin fuera
   de la zona, fiestas que deberían tener Uber y no lo tienen, entradas sin precio, links con rastreo, posibles
   duplicados y fotos que ya no usa ningún evento. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const c = {}; vm.createContext(c);
for (const f of ["js/config.js", "js/data.js", "js/utils.js", "js/cards.js"]) vm.runInContext(fs.readFileSync(path.join(R, f), "utf8"), c);
vm.runInContext("this.EV=EV;this.CATS=CATS;this.geoOf=geoOf;this.rideOK=rideOK;this.TODAY=TODAY", c);
const HOY = c.TODAY;
const fotos = new Set(fs.readdirSync(path.join(R, "img/eventos"))), usadas = new Set(c.EV.map(e => e.photo).filter(Boolean));
const live = c.EV.filter(e => (e.endDate || e.date) >= HOY), out = [], titulos = {};
for (const e of live) {
  const p = [];
  for (const k of ["title", "cat", "date", "time", "place", "desc"]) if (!e[k]) p.push("falta " + k);
  if (!c.CATS[e.cat]) p.push("categoría rara");
  if (e.time && e.time !== "A confirmar" && !/^\d\d:\d\d$/.test(e.time)) p.push("hora rara " + e.time);
  if (!/^\d{4}-\d\d-\d\d$/.test(e.date) || (e.endDate && e.endDate < e.date)) p.push("fecha rara");
  if (!e.photo) p.push("sin foto"); else if (!fotos.has(e.photo)) p.push("FOTO NO EXISTE " + e.photo);
  else if (fs.statSync(path.join(R, "img/eventos", e.photo)).size > 420000) p.push("foto pesada");
  const g = c.geoOf(e);
  if (!g) p.push("sin pin" + (/a confirmar|día del evento/i.test(e.place) ? " (lugar a confirmar)" : ""));
  else if (g[0] < -35.1 || g[0] > -34.5 || g[1] < -55.3 || g[1] > -54.4) p.push("PIN FUERA DE LA ZONA " + g);
  if (["Fiestas", "Música en vivo"].includes(e.cat) && e.tickets && !c.rideOK(e) && e.traslado !== false) p.push("debería tener Uber");
  if (e.tickets && !e.price) p.push("sin precio");
  for (const u of [e.tickets, e.link, e.contact].filter(Boolean)) if (/utm_|fbclid|seller_code/i.test(u)) p.push("link con rastreo");
  const k = e.date + " " + e.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  if (titulos[k]) p.push("¿DUPLICADO? de " + titulos[k]); titulos[k] = e.title;
  if (p.length) out.push(`${e.date} ${e.title}: ${p.join(" · ")}`);
}
for (const f of fotos) if (!usadas.has(f)) out.push("foto sin usar: " + f);
console.log(`${c.EV.length} eventos en data.js, ${live.length} vigentes (hoy ${HOY})`);
console.log(out.length ? out.join("\n") : "Todo en orden.");

if (process.argv.includes("--links")) (async () => {
  const urls = [...new Set(live.flatMap(e => [e.tickets, e.link, e.contact].filter(Boolean)))];
  console.log(`\nProbando ${urls.length} links (Passline, Ingresse y GETIN bloquean a los programas: probalos en el navegador)…`);
  for (const u of urls) {
    try { const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" }, redirect: "follow" }); if (r.status !== 200) console.log(r.status, u); }
    catch (_) { console.log("ERROR", u); }
  }
  console.log("Listo.");
})();
