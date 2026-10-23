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

  /* "‹ Todos los eventos" en la página de un evento: si se llegó desde la agenda, es lo mismo que "atrás"
     (vuelve a la misma altura al instante, sin recargar) */
  const back = document.querySelector("a.ev-back");
  if (back) back.addEventListener("click", ev => {
    try {
      const r = new URL(document.referrer);
      if (r.origin === location.origin && r.pathname === "/" && history.length > 1) { ev.preventDefault(); history.back(); }
    } catch (_) {}
  });

  const footer = $("site-footer");
  if (!footer) return;

  /* Pie: marca y redes a la izquierda, tres columnas de links (en el celular, dos y una) y una línea final.
     El link de la página en la que se está queda marcado (aria-current). */
  const here = location.pathname.replace(/index\.html$/, "");
  const link = (href, text, ev) => `<a href="${href}"${ev ? ` data-ev="${ev}"` : ""}${here === href ? ' aria-current="page"' : ""}>${text}</a>`;
  footer.innerHTML = `
    <div class="foot-top">
      <div class="foot-brand">
        <a class="logo" href="/" aria-label="Eventos PDE, inicio">Eventos<span>PDE</span></a>
        <p>La agenda de Punta del Este: fiestas, música en vivo, deportes y todo lo que pasa en la temporada.</p>
        <div class="foot-social">
          <a href="https://instagram.com/${esc(CONFIG.instagram)}" target="_blank" rel="noopener" data-ev="instagram_sitio" aria-label="Instagram @${esc(CONFIG.instagram)}">${ico("instagram")}</a>
          <a href="mailto:${esc(CONFIG.email)}" data-ev="email_sitio" aria-label="Mail ${esc(CONFIG.email)}">${ico("mail")}</a>
        </div>
      </div>
      <nav class="foot-cols" aria-label="Pie de página">
        <div class="foot-col"><p class="foot-h">Agenda</p>
          ${link("/", "Todos los eventos")}${link("/plan.html", "Armar plan", "plan_pie")}${link("/nosotros.html", "Quiénes somos", "nosotros_pie")}</div>
        <div class="foot-col"><p class="foot-h">Organizadores</p>
          ${link("/publicar.html", "Publicar evento", "promo_publicar")}<a href="/publicar.html#plans">Planes y precios</a><a href="mailto:${esc(CONFIG.email)}?subject=${encodeURIComponent("Quiero trabajar con Eventos PDE")}" data-ev="contacto_organizador">Hablemos</a></div>
        <div class="foot-col foot-contact"><p class="foot-h">Contacto</p>
          <a href="mailto:${esc(CONFIG.email)}" data-ev="email_sitio">${esc(CONFIG.email)}</a><a href="https://instagram.com/${esc(CONFIG.instagram)}" target="_blank" rel="noopener" data-ev="instagram_sitio">@${esc(CONFIG.instagram)}</a></div>
      </nav>
    </div>
    <div class="foot-bottom"><span>© ${new Date().getFullYear()} Eventos PDE</span><span>Punta del Este, Uruguay</span></div>`;

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
