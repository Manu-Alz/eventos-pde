/* site.js · piezas que se repiten en todas las páginas (hoy: el pie de página)
   Los datos salen de config.js, así que el mail y el Instagram se cambian en un solo lugar.
   Requiere: config.js, utils.js */

(() => {
  const footer = $("site-footer");
  if (!footer) return;

  footer.innerHTML = `
    <p class="foot-info"><span>Punta del Este, Uruguay</span><span>© ${new Date().getFullYear()} Eventos PDE</span></p>
    <nav class="foot-links" aria-label="Contacto">
      <a href="mailto:${esc(CONFIG.email)}" data-ev="email_sitio">${esc(CONFIG.email)}</a>
      <a href="https://instagram.com/${esc(CONFIG.instagram)}" target="_blank" rel="noopener" data-ev="instagram_sitio">Instagram<span>@${esc(CONFIG.instagram)}</span></a>
    </nav>`;

  /* Cualquier <a data-email> de la página toma el mail de la configuración */
  document.querySelectorAll("a[data-email]").forEach(a => {
    a.href = "mailto:" + CONFIG.email;
    a.textContent = CONFIG.email;
  });
})();
