/* analytics.js · Google Analytics 4 + conteo de clics
   Se activa al poner el ID en CONFIG.ga (config.js). Sin ID no carga nada.
   Cualquier elemento con data-ev cuenta como evento. Los que se usan hoy:
     entradas   clic en "Comprar entradas" (link común)
     referido   clic en "Comprar entradas" con link de afiliado  -> sirve para verificar comisiones
     enlace     clic en el embed de link libre
     contacto   clic en el botón de contacto
     mapa       clic en el lugar (Google Maps)
   Requiere: config.js */

(() => {
  const id = CONFIG.ga;
  const on = Boolean(id) && !/X{6,}/.test(id);

  if (on) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", id);
  }

  window.track = (name, params = {}) => {
    if (on) gtag("event", name, { transport_type: "beacon", ...params });
    else if (/^(localhost|127\.)/.test(location.hostname)) console.log("[track]", name, params);
  };

  document.addEventListener("click", ev => {
    const el = ev.target.closest && ev.target.closest("[data-ev]");
    if (el) track(el.dataset.ev, { evento: el.dataset.n || "", categoria: el.dataset.c || "", destino: el.href || "" });
  });
})();
