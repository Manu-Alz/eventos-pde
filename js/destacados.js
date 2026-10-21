/* destacados.js · slider automático de eventos destacados (reemplaza a la vieja portada "Hot topic")
   Muestra los eventos con featured: true en data.js, del más cercano al más lejano.
   - Pasa solo cada INTERVAL ms; se frena al pasar el mouse, al tocar, al abrir un detalle o si la pestaña no se ve.
   - Se desliza con el dedo (scroll-snap) y tiene flechas y barras de progreso (la barra llena = el "timer").
   - Al tocar una diapositiva se abre el mismo popup de detalle que las tarjetas (detalle.js).
   Índice: 1 Ajustes · 2 Piezas · 3 Armado · 4 Movimiento
   Requiere: config.js, utils.js, cards.js, css/destacados.css */

/* ============ 1. Ajustes rápidos ============ */
const FEAT_INTERVAL = 6500;      // milisegundos que dura cada diapositiva
const FEAT_MAX = 6;              // máximo de diapositivas

/* ============ 2. Piezas ============ */
/* "Hoy", "Mañana", "En 5 días" o "En curso" (si ya empezó y dura varios días) */
function whenLabel(e) {
  const day = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const n = day(e.date) - day(TODAY);
  if (n < 0) return "En curso";
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  return `En ${n} días`;
}

function slideEl(e, i) {
  const s = document.createElement("article");
  s.className = "slide";
  s.dataset.id = slugOf(e);
  s.tabIndex = 0;
  s.setAttribute("role", "group");
  s.setAttribute("aria-roledescription", "diapositiva");
  s.setAttribute("aria-label", `${e.title}, ${longDate(e)}. Ver detalles`);
  s.style.cssText = `--c:${CATS[e.cat]};${coverStyle(e)}`;
  s.innerHTML = `
    ${coverHtml(e)}
    <div class="s-main">
      <div class="s-top">
        <span class="k-feat">${ico("star")}Featured</span>
        <span class="s-when">${esc(whenLabel(e))}</span>
        <span class="k-cat"><i></i>${esc(e.cat)}</span>
      </div>
      <div class="s-bottom">
        <p class="s-date">${esc(longDate(e))}</p>
        <h2>${esc(e.title)}</h2>
        <p class="s-desc">${esc(e.desc)}</p>
        <ul class="k-meta">
          <li><span class="k-ic">${ico("clock")}</span><span>${esc(timeLabel(e))}</span></li>
          <li><span class="k-ic">${ico("pin")}</span><span class="k-place">${esc(e.place)}</span></li>
        </ul>
        <span class="s-cta">Ver detalles ${ico("arrow")}</span>
      </div>
    </div>
    ${e.photo ? `<div class="s-poster"><img src="${esc(e.photo)}" alt="" ${i ? 'loading="lazy"' : ""} decoding="async"></div>` : ""}`;
  return s;
}

/* ============ 3. Armado ============ */
function renderFeatured(events) {
  const box = $("feat");
  const list = events.filter(e => e.featured).sort(compareEvents).slice(0, FEAT_MAX);
  if (!list.length) { box.hidden = true; return; }

  const many = list.length > 1;
  box.style.setProperty("--feat-interval", FEAT_INTERVAL + "ms");
  box.innerHTML = `<div class="feat-track" id="feat-track"></div>` + (many ? `
    <div class="feat-nav">
      <div class="feat-bars" role="tablist" aria-label="Elegir destacado">
        ${list.map((e, i) => `<button type="button" class="feat-bar" role="tab" aria-label="${esc(e.title)}" data-i="${i}"><i></i></button>`).join("")}
      </div>
      <button type="button" class="feat-arrow" data-dir="-1" aria-label="Anterior">${ico("arrow")}</button>
      <button type="button" class="feat-arrow" data-dir="1" aria-label="Siguiente">${ico("arrow")}</button>
    </div>` : "");
  const track = $("feat-track");
  list.forEach((e, i) => track.appendChild(slideEl(e, i)));
  box.hidden = false;
  if (many) featMotion(box, track, list.length);
}

/* ============ 4. Movimiento ============ */
function featMotion(box, track, n) {
  const bars = [...box.querySelectorAll(".feat-bar")];
  const still = matchMedia("(prefers-reduced-motion:reduce)").matches;   // sin autoplay si el sistema lo pide
  const holds = new Set();                                                // motivos por los que está en pausa
  let idx = 0;

  const paint = () => {
    bars.forEach((b, i) => {
      b.classList.toggle("done", i < idx);
      b.classList.toggle("on", i === idx);
      b.setAttribute("aria-selected", i === idx);
    });
  };
  const restart = () => {                       // reinicia la animación de la barra activa
    const bar = bars[idx]; bar.classList.remove("on"); void bar.offsetWidth; bar.classList.add("on");
  };
  const go = i => {
    idx = (i + n) % n;
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
    paint(); restart();
  };

  /* Pausa: se suma un motivo y la barra se congela (CSS .paused) */
  const hold = (why, on) => { on ? holds.add(why) : holds.delete(why); box.classList.toggle("paused", holds.size > 0); };

  /* Al terminar de llenarse la barra pasa a la siguiente diapositiva */
  if (!still) box.addEventListener("animationend", ev => { if (ev.target.closest(".feat-bar.on")) go(idx + 1); });
  else box.classList.add("still");

  /* Deslizar con el dedo o el trackpad: sigue a la diapositiva que quedó a la vista */
  let raf = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== idx && i >= 0 && i < n) { idx = i; paint(); restart(); }
    });
  }, { passive: true });

  box.addEventListener("click", ev => {
    const bar = ev.target.closest(".feat-bar"), arrow = ev.target.closest(".feat-arrow");
    if (bar) go(+bar.dataset.i);
    else if (arrow) go(idx + +arrow.dataset.dir);
  });

  /* Motivos de pausa */
  box.addEventListener("pointerenter", ev => { if (ev.pointerType === "mouse") hold("hover", true); });
  box.addEventListener("pointerleave", () => hold("hover", false));
  box.addEventListener("pointerdown", () => hold("touch", true));
  addEventListener("pointerup", () => hold("touch", false));
  addEventListener("pointercancel", () => hold("touch", false));
  box.addEventListener("focusin", () => hold("focus", true));
  box.addEventListener("focusout", () => hold("focus", false));
  document.addEventListener("visibilitychange", () => hold("tab", document.hidden));
  new IntersectionObserver(([en]) => hold("offscreen", !en.isIntersecting), { threshold: .25 }).observe(box);
  new MutationObserver(() => hold("popup", document.body.classList.contains("dlg-open")))
    .observe(document.body, { attributes: true, attributeFilter: ["class"] });
  addEventListener("resize", () => { track.scrollTo({ left: idx * track.clientWidth }); });

  paint(); restart();
}
