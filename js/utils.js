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
  star:  '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>'
};
const ico = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
