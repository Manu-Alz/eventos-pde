/* plan.js · "Mi plan": los eventos que la persona marca para ir. Se guardan en este navegador (sin cuenta).
   - Cualquier botón con data-plan="<id del evento>" agrega o saca ese evento del plan (tarjetas y páginas de eventos).
   - Cuando hay eventos en el plan aparece abajo la píldora "Mi plan" que lleva a /plan.html (el planificador).
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
      fab.querySelector("b").textContent = ids.length;
      fab.querySelector("small").textContent = ids.length === 1 ? "evento" : "eventos";
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

  /* Píldora flotante: se crea una vez por página */
  function fab() {
    if (document.getElementById("plan-fab")) return;
    const a = document.createElement("a");
    a.id = "plan-fab";
    a.className = "plan-fab";
    a.href = "/plan.html";
    a.hidden = true;
    a.dataset.ev = "plan_abrir";
    a.innerHTML = `<span class="plan-fab-n"><b>0</b></span><span class="plan-fab-t">Mi plan<small>eventos</small></span><span class="plan-fab-go">Armar viaje ${ico("arrow")}</span>`;
    document.body.appendChild(a);
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
