/* site.js · piezas que se repiten en todas las páginas (cabecera con vidrio al bajar y pie de página)
   Los datos salen de config.js, así que el mail y el Instagram se cambian en un solo lugar.
   Requiere: config.js, utils.js */

(() => {
  /* Cabecera: transparente arriba, vidrio oscuro apenas se baja la página */
  const head = document.querySelector("header.top");
  if (head) {
    const mark = () => head.classList.toggle("stuck", scrollY > 8);
    addEventListener("scroll", mark, { passive: true });
    mark();
  }

  const footer = $("site-footer");
  if (!footer) return;

  footer.innerHTML = `
    <p class="foot-info"><span>Punta del Este, Uruguay</span><span>© ${new Date().getFullYear()} Eventos PDE</span></p>
    <nav class="foot-links" aria-label="Contacto">
      ${/plan/.test(location.pathname) ? "" : '<a href="/plan.html" data-ev="plan_pie">Mi plan</a>'}
      ${/servicios/.test(location.pathname) ? "" : '<a href="/servicios.html" data-ev="servicio_pie">Traslados y alojamiento</a>'}
      ${/publicar/.test(location.pathname) ? "" : '<a href="/publicar.html" data-ev="promo_publicar">Publicar evento</a>'}
      <a href="mailto:${esc(CONFIG.email)}" data-ev="email_sitio">${esc(CONFIG.email)}</a>
      <a href="https://instagram.com/${esc(CONFIG.instagram)}" target="_blank" rel="noopener" data-ev="instagram_sitio">Instagram<span>@${esc(CONFIG.instagram)}</span></a>
    </nav>`;

  /* Cualquier <a data-wa> abre el WhatsApp de la configuración; con data-wa-text, con el mensaje ya escrito */
  document.querySelectorAll("a[data-wa]").forEach(a => { a.href = "https://wa.me/" + CONFIG.whatsapp; });
  document.querySelectorAll("a[data-wa-text]").forEach(a => { a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(a.dataset.waText)}`; });
  /* <a data-mail="Asunto"> manda un mail al proyecto con ese asunto */
  document.querySelectorAll("a[data-mail]").forEach(a => { a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(a.dataset.mail)}`; });

  /* Cualquier <a data-email> de la página toma el mail de la configuración */
  document.querySelectorAll("a[data-email]").forEach(a => {
    a.href = "mailto:" + CONFIG.email;
    a.textContent = CONFIG.email;
  });
})();
