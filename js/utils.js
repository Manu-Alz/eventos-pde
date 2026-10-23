/* utils.js · utilidades compartidas (home y publicar)
   No depende de nada. Va después de config.js. */

/* ---------- DOM y texto ---------- */
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Solo se aceptan links http(s) y mailto: */
const safeUrl = u => (/^(https?:|mailto:)/i.test(u || "") ? u : "");

/* Dominio de un link, sin "www." */
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return u; } };

/* ---------- Fechas ---------- */
const MES   = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/* Hoy en Uruguay, "AAAA-MM-DD" */
const TODAY = (() => {
  try { return new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" }); }
  catch (_) { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; }
})();

/* Sumar días a "AAAA-MM-DD" */
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* Texto para buscar: sin tildes y en minúsculas ("musica" encuentra "Música") */
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- Píldora que se desliza ----------
   El fondo blanco del botón elegido es una sola pieza (.pill) que viaja de un botón al otro.
   box: contenedor con la clase has-pill · active: botón elegido (null = se esconde) · instant: sin animación */
function slidePill(box, active, instant = false) {
  let pill = box.querySelector(":scope > .pill");
  const fresh = !pill;
  if (fresh) { pill = document.createElement("i"); pill.className = "pill"; pill.setAttribute("aria-hidden", "true"); box.prepend(pill); }
  if (!active) { pill.style.opacity = "0"; return; }
  const jump = fresh || instant || pill.style.opacity === "0";
  if (jump) pill.style.transition = "none";
  Object.assign(pill.style, { transform: `translate(${active.offsetLeft}px,${active.offsetTop}px)`, width: active.offsetWidth + "px", height: active.offsetHeight + "px", opacity: "1" });
  if (jump) { void pill.offsetWidth; pill.style.transition = ""; }
}

/* ---------- Íconos (trazos SVG) ---------- */
const ICONS = {
  link:  '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin:   '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r=".6"/><circle cx="12" cy="14.5" r=".6"/><circle cx="15.5" cy="14.5" r=".6"/>',
  mail:  '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>',
  arrow: '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  share: '<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"/>',
  chat:  '<path d="M21 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
  ticket:'<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M14 5v14" stroke-dasharray="2 3"/>',
  car:   '<path d="M5 17H4a1 1 0 0 1-1-1v-3l2-5.2A2 2 0 0 1 6.9 6.5h10.2a2 2 0 0 1 1.9 1.3L21 13v3a1 1 0 0 1-1 1h-1"/><path d="M3 13h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  bed:   '<path d="M3 19V6"/><path d="M3 15h18v4"/><path d="M21 15v-2.5A3.5 3.5 0 0 0 17.5 9H11v6"/><circle cx="7" cy="11.5" r="2"/>',
  plus:  '<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  star:  '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>'
};
const ico = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
