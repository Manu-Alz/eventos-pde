/* Code.gs · recibe las solicitudes del formulario de publicar.html
   Cada solicitud: 1) se guarda como una fila en la planilla  2) te llega un mail.
   Se pega en la planilla (Extensiones > Apps Script) y se publica como "Aplicación web". Ver README. */

const AVISAR_A = "eventospde.uy@gmail.com";   // mail donde te avisan
const HOJA     = "Solicitudes";                // nombre de la pestaña

const COLUMNAS = ["Recibido", "Referencia", "Evento", "Plan", "Semanas", "Total US$", "Categoría", "Fecha del evento", "Hora", "Lugar",
                  "Contacto", "Dato de contacto", "Link de entradas", "Otro link", "Descripción", "Pagó", "Publicado desde", "Hasta"];

function doPost(e) {
  const d = JSON.parse(e.postData.contents);

  /* El candado hace que varias solicitudes a la vez no se pisen */
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoja = obtenerHoja();
    hoja.appendRow([new Date(), d.ref, d.title, d.plan, d.weeks, d.total, d.cat, d.date, d.time, d.place,
                    d.contactMethod, d.contact, d.tickets, d.link, d.desc, "", "", ""]);
  } finally {
    lock.releaseLock();
  }

  /* Si se acabó la cuota diaria de mails, la fila igual queda guardada */
  try {
    MailApp.sendEmail(AVISAR_A, `Nueva solicitud ${d.ref}: ${d.title}`,
      `Plan: ${d.plan} · ${d.weeks} sem · US$ ${d.total}\nEvento: ${d.title} (${d.cat})\nFecha: ${d.date} ${d.time}\nLugar: ${d.place}\n` +
      `Contacto (${d.contactMethod}): ${d.contact}\nEntradas: ${d.tickets || "-"}\nLink: ${d.link || "-"}\n\n${d.desc || ""}\n\nTodavía falta confirmar el pago.`);
  } catch (err) {}

  return ContentService.createTextOutput("ok");
}

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}
