/* build-eventos.js · genera evento/<id>/index.html y sitemap.xml con tools/paginas.js.
   Lo corre GitHub Actions (.github/workflows/eventos.yml); no hace falta tenerlo en la compu.
   Para correrlo a mano (con Node instalado): node tools/build-eventos.js */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

/* Los mismos archivos que usa la web, en el mismo orden; comparten variables como en el navegador */
const ctx = vm.createContext({ console });
for (const f of ["js/config.js", "js/data.js", "js/utils.js", "js/cards.js", "tools/paginas.js"]) {
  vm.runInContext(read(f), ctx, { filename: f });
}

/* Versión de CSS/JS: la misma que usa index.html (?v=NN) */
const v = (read("index.html").match(/styles\.css\?v=(\d+)/) || [, "1"])[1];
const files = vm.runInContext(`buildSite(${JSON.stringify(v)})`, ctx);

/* Las páginas de eventos vencidos se borran: se arma la carpeta de cero */
fs.rmSync(path.join(root, "evento"), { recursive: true, force: true });
for (const [rel, content] of Object.entries(files)) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
const pages = Object.keys(files).filter(f => f.startsWith("evento/")).length;
console.log(`Listo: ${pages} páginas de eventos y sitemap.xml (hoy ${vm.runInContext("TODAY", ctx)}, v=${v}).`);
