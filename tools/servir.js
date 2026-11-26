/* servir.js · servidor local para probar la web antes de subirla: node tools/servir.js → http://localhost:8765
   Sirve la carpeta del proyecto tal cual (sin caché), con la página 404 propia. Puerto: variable PORT o 8765. */
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".xml": "application/xml",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };
http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(404, { "Content-Type": T[".html"] }); return res.end(fs.readFileSync(path.join(ROOT, "404.html"))); }
  res.writeHead(200, { "Content-Type": T[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(+process.env.PORT || 8765, function () { console.log("http://localhost:" + this.address().port); });
