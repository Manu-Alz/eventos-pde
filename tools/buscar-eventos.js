/* buscar-eventos.js · lista los eventos de Punta del Este que están a la venta y marca los que todavía no están en data.js
   Uso: node tools/buscar-eventos.js        (Node 18 o más nuevo; no instala nada)
   Revisa Venti, Entraste, CobraTicket y RedTickets. No carga nada: muestra qué hay para revisar a mano.
   "NUEVO" = el link no está en data.js. "ya" = ya está cargado (se muestra el precio en venta para compararlo).
   Passline pide verificación anti-robots: esa se revisa en el navegador. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(R, "js/data.js"), "utf8") + ";this.EV=EV", ctx);
const HOY = new Date().toISOString().slice(0, 10);
const cargados = ctx.EV.map(e => decodeURIComponent(e.tickets || "") + " " + (e.link || "")).join("\n");
const UA = { headers: { "User-Agent": "Mozilla/5.0" } };
const get = async u => { try { const r = await fetch(u, UA); return r.ok ? await r.text() : ""; } catch (_) { return ""; } };
const PDE = /punta|maldonado|barra|manantiales|ignacio|ballena|solanas|juanita|garz|piri|pan de az|laguna del sauce/i;   // zona permitida (CLAUDE.md, punto 1)
const linea = (ya, fecha, titulo, lugar, extra, link) => console.log(`${ya ? "ya    " : "NUEVO "} ${fecha} | ${titulo} | ${lugar || "SIN LUGAR"} | ${extra || ""} | ${link}`);

(async () => {
  console.log("=== Venti");
  const venti = [];
  for (let p = 1; p <= 40; p++) {
    const t = await get(`https://api.venti.live/api/home/events?limit=50&page=${p}`);
    let ev = []; try { ev = JSON.parse(t).events || []; } catch (_) {}
    if (!ev.length) break; venti.push(...ev);
  }
  const vistos = new Set();
  for (const e of venti) {
    const v = e.venue || {}, c = v.city || {};
    if (c.country !== "UY" || vistos.has(e.urlName)) continue; vistos.add(e.urlName);
    if (!PDE.test(`${c.name} ${v.readableAddress} ${v.placeName}`)) continue;
    const loc = new Date(new Date(e.startDate).getTime() - 3 * 3600e3).toISOString().slice(0, 16).replace("T", " ");   // hora de Uruguay
    linea(cargados.includes(e.urlName), loc, e.name, `${v.placeName}, ${v.readableAddress}`, "", `https://venti.live/evento/${e.urlName}`);
  }

  console.log("\n=== Entraste");
  const h = (await get("https://app.entraste.com/")).replace(/\\\\\\"/g, '"').replace(/\\"/g, '"');
  const re = /"name":"([^"]+)","(?:producer_name":"([^"]*)","hide_producer_byline|hide_producer_byline)":[^,]*,"name_seo":"([^"]+)"/g;
  const ent = new Map(); let m;
  while ((m = re.exec(h))) {
    const a = h.slice(m.index, m.index + 14000);
    const d = (a.match(/"start_date":"([^"]+)"/) || [])[1] || "";
    const v = a.match(/"venue":\{[^{}]*?"name":"([^"]*)"[^{}]*?"address":"([^"]*)"/), city = (a.match(/"city":"([^"]*)"/) || [])[1] || "";
    const lugar = v ? `${v[1]} ${v[2]} ${city}`.trim() : city;
    if (lugar && !PDE.test(lugar)) continue;   // sin lugar se muestra igual: el póster suele decir dónde es
    const loc = d ? new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 16).replace("T", " ") : "?";
    if (!ent.has(m[3])) ent.set(m[3], [cargados.includes(m[3]), loc, m[1], lugar, `por ${m[2] || "?"}`, `https://app.entraste.com/events/${m[3]}`]);
  }
  [...ent.values()].sort((a, b) => a[1].localeCompare(b[1])).forEach(x => linea(...x));

  console.log("\n=== CobraTicket");
  const cobra = [...new Set(((await get("https://www.cobraticket.uy/eventos")).match(/\/e\/[a-z0-9-]+/g) || []))];
  for (const s of cobra) {
    const t = await get("https://www.cobraticket.uy" + s);
    const d = (t.match(/startAt:"([^"]+)"/) || [])[1] || "?";
    const v = t.match(/name:"([^"]{0,60})",address:"([^"]*)",region:"([^"]*)"/);
    if (!v || !PDE.test(v.join(" ")) || /congreso|jornada|simposio/i.test(s)) continue;
    const titulo = ((t.match(/<title>([^<|]+)/) || [])[1] || s).trim();
    linea(cargados.includes(s.slice(3)), d.slice(0, 16), titulo, `${v[1]}, ${v[2]}, ${v[3]}`, "", "https://www.cobraticket.uy" + s);
  }

  console.log("\n=== RedTickets");
  const rt = new Set();
  for (const sec of ["Musica", "Fiestas", "Teatro", "Deportes", "Festivales", "Especiales"])
    ((await get(`https://redtickets.uy/seccion/UY-2/${sec}`)).match(/\/evento\/[^"]+\/\d+\//g) || []).forEach(x => rt.add(x));
  for (const s of rt) {
    const t = (await get("https://redtickets.uy" + s)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const info = (t.match(/Buscar (.{0,180})/) || [])[1] || "";
    if (!PDE.test(info)) continue;
    linea(cargados.includes(s.match(/\/(\d+)\/$/)[1]), "", info.slice(0, 110), "", "", "https://redtickets.uy" + s);
  }
  console.log(`\nHoy: ${HOY}. Antes de cargar: confirmá lugar, hora y precio EN VENTA (no los lotes agotados) en la página de cada evento.`);
})();
