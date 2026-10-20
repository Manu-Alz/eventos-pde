/* hot.js · Hot topic (el lugar único de la portada)
   Sale del evento marcado con hot: true en data.js (el primero vigente; hotUntil es el último día).
   Estructura: .hot-head (fecha, etiqueta, categoría) > h2 > .ref? > p > .hot-foot (hora y lugar + contacto)
   Requiere: config.js, utils.js, cards.js */

const isHot = e => e.hot && (!e.hotUntil || e.hotUntil >= TODAY);

function renderHot(events) {
  const box = $("portada");
  const e = events.find(isHot);
  if (!e) { box.hidden = true; return; }

  const flyer = e.img ? `<img class="hot-img" src="${esc(e.img)}" alt="Flyer de ${esc(e.title)}" loading="lazy">` : "";

  box.innerHTML = `
    <article class="hot${e.img ? " has-img" : ""}" style="--c:${CATS[e.cat]}">
      <div class="hot-main">
        <div class="hot-head">
          ${dateHtml(e)}
          <span class="hot-badge">Hot topic</span>
          <span class="tag">${esc(e.cat)}</span>
        </div>
        <h2>${esc(e.title)}</h2>
        ${embedHtml(e)}
        <p>${esc(e.desc)}</p>
        <div class="hot-foot">
          <div class="hot-meta">${whenHtml(e)}${whereHtml(e)}</div>
          ${contactHtml(e)}
        </div>
      </div>
      ${flyer}
    </article>`;
  box.hidden = false;
}
