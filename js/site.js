/* site.js · piezas que se repiten en todas las páginas (cabecera con vidrio al bajar y pie de página)
   Los datos salen de config.js, así que el mail y el Instagram se cambian en un solo lugar.
   Requiere: config.js, utils.js */

(() => {
  /* Barra de navegación (igual en todas las páginas): una cápsula de vidrio con el logo, las secciones y un botón principal,
     "Armar mi plan" (en Armar plan, "Ver eventos"). En el celular quedan el logo, ese botón y un menú (☰) con todo lo demás.
     La sección en la que se está queda marcada (aria-current). */
  const head = document.querySelector("header.top");
  if (head && !head.dataset.plain) {
    const path = location.pathname.replace(/index\.html$/, "");
    const onPlan = path === "/plan.html";
    const NAV = [["/#agenda", "Agenda"], ["/#calendario", "Calendario"], ["/#mapa", "Mapa"], ["/publicar.html", "Publicar evento"], ["/nosotros.html", "Quiénes somos"]];
    const cur = href => (href === path ? ' aria-current="page"' : "");
    const cta = onPlan ? `<a class="btn nav-cta" href="/">Ver eventos</a>`
      : `<a class="btn nav-cta" href="/plan.html" data-ev="plan_cabecera">Armar mi plan</a>`;
    const logo = head.querySelector(".logo");
    head.innerHTML = "";
    head.append(logo);
    head.insertAdjacentHTML("beforeend", `
      <nav class="nav-links" aria-label="Secciones">${NAV.map(([h, t]) => `<a href="${h}"${cur(h)}>${t}</a>`).join("")}</nav>
      <div class="hact">${cta}<button type="button" class="nav-burger" aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir el menú"><span></span><span></span><span></span></button></div>
      <div class="nav-menu" id="nav-menu" hidden>
        ${NAV.map(([h, t]) => `<a href="${h}"${cur(h)}>${t}</a>`).join("")}
        <a href="mailto:${esc(CONFIG.email)}" data-ev="email_sitio">Escribinos</a>
      </div>`);
    const burger = head.querySelector(".nav-burger"), menu = $("nav-menu");
    const open = on => { menu.hidden = !on; burger.setAttribute("aria-expanded", on); burger.setAttribute("aria-label", on ? "Cerrar el menú" : "Abrir el menú"); head.classList.toggle("menu-open", on); };
    burger.addEventListener("click", () => open(menu.hidden));
    menu.addEventListener("click", ev => { if (ev.target.closest("a")) open(false); });
    document.addEventListener("click", ev => { if (!menu.hidden && !head.contains(ev.target)) open(false); });
    addEventListener("keydown", ev => { if (ev.key === "Escape" && !menu.hidden) { open(false); burger.focus(); } });
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
        <div class="foot-col"><p class="foot-h">Trabajá con nosotros</p>
          ${link("/publicar.html", "Publicar evento", "promo_publicar")}<a href="/publicar.html#plans">Planes y precios</a><a href="/nosotros.html#aliados" data-ev="aliados_pie">Hoteles e inmobiliarias</a><a href="mailto:${esc(CONFIG.email)}?subject=${encodeURIComponent("Quiero trabajar con Eventos PDE")}" data-ev="contacto_organizador">Hablemos</a></div>
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

/* Preguntas frecuentes (Publicar, Armar plan y cualquier .faq o .pl-faq): cada respuesta se despliega y se recoge con
   una animación, en vez de aparecer de golpe. Si se toca de nuevo a mitad de camino, sigue desde donde estaba.
   El "+" gira con la clase .is-open (no con [open], que sigue puesto mientras se cierra). */
(() => {
  const MS = matchMedia("(prefers-reduced-motion:reduce)").matches ? 1 : 320;
  document.querySelectorAll(".faq details, .pl-faq details").forEach(d => {
    const body = d.querySelector("p");
    if (!body) return;
    let anim = null;
    if (d.open) d.classList.add("is-open");
    d.querySelector("summary").addEventListener("click", ev => {
      ev.preventDefault();
      const opening = !d.classList.contains("is-open");
      d.classList.toggle("is-open", opening);
      const now = d.open ? body.getBoundingClientRect().height : 0;   // alto actual, aunque esté a mitad de la animación
      if (anim) anim.cancel();
      d.open = true;
      const full = body.scrollHeight, pad = getComputedStyle(body).paddingBottom;
      const shut = { height: "0px", paddingBottom: "0px", opacity: 0 }, open = { height: full + "px", paddingBottom: pad, opacity: 1 };
      const from = { height: now + "px", paddingBottom: now ? pad : "0px", opacity: now ? 1 : 0 };
      const a = anim = body.animate([from, opening ? open : shut], { duration: MS, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      a.onfinish = () => { if (!opening) d.open = false; a.cancel(); if (anim === a) anim = null; };
      if (opening && typeof track === "function") track("faq", { pregunta: d.querySelector("summary").textContent });
    });
  });
})();
