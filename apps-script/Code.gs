/* Code.gs · recibe las solicitudes del formulario de publicar.html
   Cada solicitud: 1) se guarda como una fila en la planilla  2) te llega un mail.
   Se pega en la planilla (Extensiones > Apps Script) y se publica como "Aplicación web". Ver README. */

const AVISAR_A = "eventospde.uy@gmail.com";   // mail donde te avisan
const HOJA     = "Solicitudes";                // nombre de la pestaña

const COLUMNAS = ["Recibido", "Referencia", "Evento", "Plan", "Semanas", "Total US$", "Categoría", "Fecha del evento", "Hora", "Lugar",
                  "Contacto", "Dato de contacto", "Link de entradas", "Otro link", "Descripción", "Pagó", "Publicado desde", "Hasta"];

/* Pedidos de traslado y alojamiento (servicios.html): van a su propia pestaña */
const HOJA_SERVICIOS = "Servicios";
const COLUMNAS_SERVICIOS = ["Recibido", "Pedido", "Necesita", "Evento", "Personas", "Nombre", "WhatsApp",
                            "Traslado: día", "Ida", "Desde", "Vuelta", "Hora vuelta",
                            "Llegada", "Salida", "Zona", "Tipo", "Presupuesto/noche", "Algo más", "Estado", "Precio pasado", "Comisión"];

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.kind === "servicio") return guardarServicio(d);

  /* El candado hace que varias solicitudes a la vez no se pisen */
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoja = obtenerHoja();
    hoja.appendRow([new Date(), d.ref, d.title, d.plan, d.days, d.total, d.cat, d.date, d.time, d.place,
                    d.contactMethod, d.contact, d.tickets, d.link, d.desc, "", "", ""]);
  } finally {
    lock.releaseLock();
  }

  /* Si se acabó la cuota diaria de mails, la fila igual queda guardada */
  try {
    MailApp.sendEmail(AVISAR_A, `Nueva solicitud ${d.ref}: ${d.title}`,
      `Plan: ${d.plan} · ${d.days} días (hasta ${d.until}) · US$ ${d.total}\nEvento: ${d.title} (${d.cat})\nFecha: ${d.date} ${d.time}\nLugar: ${d.place}\n` +
      `Contacto (${d.contactMethod}): ${d.contact}\nEntradas: ${d.tickets || "-"}\nLink: ${d.link || "-"}\n\n${d.desc || ""}\n\nTodavía falta confirmar el pago.`);
  } catch (err) {}

  return ContentService.createTextOutput("ok");
}

function obtenerHoja(nombre = HOJA, columnas = COLUMNAS) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(columnas);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function guardarServicio(d) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoja = obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS);
    hoja.appendRow([new Date(), d.ref, d.need, d.event, d.people, d.name, d.phone,
                    d.tDate || "", d.tGo || "", d.tFrom || "", d.tBack || "", d.tBackTime || "",
                    d.aIn || "", d.aOut || "", d.aZone || "", d.aType || "", d.aBudget || "", d.notes || "", "Nuevo", "", ""]);
  } finally {
    lock.releaseLock();
  }
  try {
    MailApp.sendEmail(AVISAR_A, `Nuevo pedido ${d.ref}: ${d.need} · ${d.name}`,
      `Necesita: ${d.need}\nEvento: ${d.event || "-"}\nPersonas: ${d.people}\nNombre: ${d.name}\nWhatsApp: ${d.phone}\n\n` +
      (d.tDate ? `Traslado: ${d.tDate} ida ${d.tGo} desde ${d.tFrom} · vuelta: ${d.tBack} ${d.tBackTime || ""}\n` : "") +
      (d.aIn ? `Alojamiento: ${d.aIn} al ${d.aOut} · ${d.aZone} · ${d.aType} · ${d.aBudget}\n` : "") +
      `\n${d.notes || ""}`);
  } catch (err) {}
  return ContentService.createTextOutput("ok");
}
