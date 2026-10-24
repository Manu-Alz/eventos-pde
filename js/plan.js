/* plan.js · "Armar plan": los eventos que la persona suma a su plan. Se guardan en este navegador (sin cuenta).
   - Los eventos se suman en el planificador (plan.html) o con plan.html?add=<id>: botón "Traslado" de cada tarjeta
     y "Armá tu plan con este evento" de cada página de evento.
   - Cualquier botón con data-plan="<id del evento>" agrega o saca ese evento sin salir de la página (lo usan las
     páginas de eventos viejas, hasta que GitHub las rehace).
   - Cuando hay eventos en el plan aparece abajo la píldora "Tu plan · Continuar", que lleva a /plan.html. Su X pregunta
     "¿Borrar tu plan?" en la misma píldora y, con "Sí, borrar", vacía el plan (eventos y lo elegido en plan.html).
   - Si el navegador no deja guardar (modo privado estricto), el plan funciona igual mientras la página esté abierta.
   Requiere: utils.js (ico), analytics.js (track) */

const Plan = (() => {
  const KEY = "epde-plan";
  let memory = [];                                   // respaldo si localStorage no está disponible
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : memory; } catch (_) { return memory; } };
  const write = list => { memory = [...new Set(list)]; try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (_) {} paint(); };

  /* Botones y píldora al día con el plan */
  function paint() {
    const ids = read();
    document.querySelectorAll("[data-plan]").forEach(b => {
      const on = ids.includes(b.dataset.plan);
      b.setAttribute("aria-pressed", on);
      b.setAttribute("aria-label", on ? "Sacar de mi plan" : "Agregar a mi plan");
      const label = b.querySelector(".plan-label");
      if (label) label.textContent = on ? "En tu plan" : "Agregar a mi plan";
    });
    const fab = document.getElementById("plan-fab");
    if (fab) {
      fab.hidden = !ids.length || /\/plan(\.html)?$/.test(location.pathname);
      fab.querySelector("small").textContent = `${ids.length} ${ids.length === 1 ? "evento" : "eventos"}`;
      if (!ids.length) ask(fab, false);
    }
  }

  function toggle(id) {
    const ids = read(), on = !ids.includes(id);
    write(on ? [...ids, id] : ids.filter(x => x !== id));
    if (typeof track === "function") track(on ? "plan_agregar" : "plan_sacar", { evento: id });
    const fab = document.getElementById("plan-fab");
    if (fab && on) { fab.classList.remove("bump"); void fab.offsetWidth; fab.classList.add("bump"); }
    return on;
  }

  /* Píldora flotante: se crea una vez por página. X (borrar) · "Tu plan, N eventos" · Continuar */
  const ask = (fab, on) => { fab.classList.toggle("is-asking", on); fab.querySelector(".plan-fab-ask").hidden = !on; };
  function fab() {
    if (document.getElementById("plan-fab")) return;
    const box = document.createElement("div");
    box.id = "plan-fab";
    box.className = "plan-fab";
    box.hidden = true;
    box.innerHTML = `<button type="button" class="plan-fab-x" aria-label="Borrar mi plan">${ico("close")}</button>
      <a class="plan-fab-main" href="/plan.html" data-ev="plan_abrir"><span class="plan-fab-t">Tu plan<small>0 eventos</small></span><span class="plan-fab-go">Continuar ${ico("arrow")}</span></a>
      <div class="plan-fab-ask" role="alertdialog" aria-label="Borrar tu plan" hidden><b>¿Borrar tu plan?</b><button type="button" class="plan-fab-no">No</button><button type="button" class="plan-fab-yes">Sí, borrar</button></div>`;
    box.querySelector(".plan-fab-x").addEventListener("click", () => { ask(box, true); box.querySelector(".plan-fab-no").focus(); });
    box.querySelector(".plan-fab-no").addEventListener("click", () => ask(box, false));
    box.querySelector(".plan-fab-yes").addEventListener("click", () => {
      try { localStorage.removeItem("epde-plan-opts"); } catch (_) {}         // también lo elegido en plan.html (fechas, llegada…)
      if (typeof track === "function") track("plan_borrar", { eventos: read().length });
      write([]);
    });
    document.body.appendChild(box);
  }

  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-plan]");
    if (!b) return;
    ev.preventDefault();
    ev.stopPropagation();
    toggle(b.dataset.plan);
  });
  addEventListener("storage", e => { if (e.key === KEY) paint(); });          // otra pestaña cambió el plan
  addEventListener("pageshow", paint);                                         // al volver con "atrás"

  fab();
  paint();
  return { get: read, set: write, has: id => read().includes(id), toggle, paint };
})();
