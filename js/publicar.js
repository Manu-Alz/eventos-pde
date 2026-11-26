/* publicar.js · "Sumá tu evento": formulario corto para productores (gratis; a cambio, vendemos como RRPP)
   No manda nada a ningún servidor: arma el mensaje y lo abre en WhatsApp o en el mail (CONFIG.whatsapp y CONFIG.email).
   Requiere: config.js, utils.js, analytics.js, site.js */

const form = $("form"), done = $("ok");
const dmy = iso => (iso ? iso.split("-").reverse().join("/") : "");
if (form.date) form.date.min = TODAY;

function message(f) {
  return [
    "Hola! Quiero sumar mi evento a Eventos PDE.",
    `Evento: ${f.title}`,
    `Fecha: ${dmy(f.date)}`,
    `Lugar: ${f.place}`,
    f.producer && `Productora: ${f.producer}`,
    `Entradas: ${f.tickets}`,
    `Contacto: ${f.contact}`,
    f.rrpp ? "RRPP: sí, nos pueden dar de alta con un código o link." : "RRPP: prefiero hablarlo."
  ].filter(Boolean).join("\n");
}

form.addEventListener("submit", ev => {
  ev.preventDefault();
  const bad = [...form.querySelectorAll("[required]")].find(i => !i.value.trim());
  if (bad) { bad.focus(); bad.reportValidity && bad.reportValidity(); return; }
  const f = Object.fromEntries(new FormData(form));
  f.rrpp = form.rrpp.checked;
  const text = message(f);
  const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
  const mail = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Sumar evento: " + f.title)}&body=${encodeURIComponent(text)}`;
  done.innerHTML = `<div class="ok-head"><span class="ok-check">${ico("check")}</span><div><h3>Listo, mandanos el mensaje</h3>
      <p>Elegí por dónde. El mensaje ya va escrito con los datos de tu evento.</p></div></div>
    <div class="sendrow" style="margin-top:18px">
      <a class="btn" href="${esc(wa)}" target="_blank" rel="noopener" data-ev="sumar_whatsapp">Mandar por WhatsApp</a>
      <a class="btn ghost" href="${esc(mail)}" data-ev="sumar_mail">Mandar por mail</a>
    </div>
    <p class="note" style="margin-top:14px">Lo cargamos en el día y te avisamos cuando esté online.</p>`;
  done.style.display = "block";
  done.scrollIntoView({ behavior: "smooth", block: "center" });
  track("sumar_evento", { rrpp: f.rrpp ? "si" : "no" });
});
