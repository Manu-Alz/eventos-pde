/* Code.gs · recibe los formularios de eventospde.com, guarda una fila en la planilla y te avisa por mail.
   - publicar.html (publicaciones pagas)    -> pestaña "Solicitudes"
   - servicios.html (traslados y alojamiento) -> pestaña "Servicios"
   Es un script independiente (no está adentro de la planilla): la abre por su ID.
   Para cambiarlo: pegá este archivo entero, guardá e Implementar > Gestionar implementaciones > lápiz >
   Versión: Nueva versión > Implementar. La dirección /exec queda igual (no hay que tocar config.js). */

const ID_PLANILLA = "1S5C63A0civLudKr2fN0r6REh8EoZ4YKDfu7wXxJCAWg";
const AVISAR_A    = "eventospde.uy@gmail.com";

const HOJA     = "Solicitudes";
const COLUMNAS = ["Recibido", "Referencia", "Evento", "Plan", "Días", "Total US$", "Categoría", "Fecha del evento", "Hora", "Lugar",
                  "Contacto", "Dato de contacto", "Link de entradas", "Otro link", "Descripción", "Pagó", "Publicado desde", "Hasta"];

const HOJA_SERVICIOS     = "Servicios";
const COLUMNAS_SERVICIOS = ["Recibido", "Pedido", "Necesita", "Evento", "Personas", "Nombre", "WhatsApp",
                            "Traslado: día", "Ida", "Desde", "Vuelta", "Hora vuelta",
                            "Llegada", "Salida", "Zona", "Tipo", "Presupuesto/noche", "Algo más", "Estado", "Precio pasado", "Comisión"];

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.kind === "servicio") return guardarServicio(d);
  return guardarSolicitud(d);
}

/* Publicación paga */
function guardarSolicitud(d) {
  const dias = d.days || d.weeks || "";               // weeks: formularios viejos que alguien tenga abiertos
  conCandado(() => obtenerHoja(HOJA, COLUMNAS).appendRow([new Date(), d.ref, d.title, d.plan, dias, d.total, d.cat, d.date, d.time, d.place,
    d.contactMethod, d.contact, d.tickets, d.link, d.desc, "", "", ""]));
  avisar(`Nueva solicitud ${d.ref}: ${d.title}`,
    `Plan: ${d.plan} · ${dias} días${d.until ? ` (del ${d.start || "hoy"} al ${d.until})` : ""} · US$ ${d.total}\n` +
    `Evento: ${d.title} (${d.cat})\nFecha: ${d.date} ${d.time}\nLugar: ${d.place}\n` +
    `Contacto (${d.contactMethod}): ${d.contact}\nEntradas: ${d.tickets || "-"}\nLink: ${d.link || "-"}\n\n${d.desc || ""}\n\nTodavía falta confirmar el pago.`);
  return ContentService.createTextOutput("ok");
}

/* Pedido de traslado y/o alojamiento */
function guardarServicio(d) {
  conCandado(() => obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS).appendRow([new Date(), d.ref, d.need, d.event, d.people, d.name, d.phone,
    d.tDate || "", d.tGo || "", d.tFrom || "", d.tBack || "", d.tBackTime || "",
    d.aIn || "", d.aOut || "", d.aZone || "", d.aType || "", d.aBudget || "", d.notes || "", "Nuevo", "", ""]));
  avisar(`Nuevo pedido ${d.ref}: ${d.need} · ${d.name}`,
    `Necesita: ${d.need}\nEvento: ${d.event || "-"}\nPersonas: ${d.people}\nNombre: ${d.name}\nWhatsApp: ${d.phone}\n\n` +
    (d.tDate ? `Traslado: ${d.tDate} ida ${d.tGo} desde ${d.tFrom} · vuelta: ${d.tBack} ${d.tBackTime || ""}\n` : "") +
    (d.aIn ? `Alojamiento: ${d.aIn} al ${d.aOut} · ${d.aZone} · ${d.aType} · ${d.aBudget}\n` : "") +
    `\n${d.notes || ""}`);
  return ContentService.createTextOutput("ok");
}

/* El candado hace que varias solicitudes a la vez no se pisen */
function conCandado(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { fn(); } finally { lock.releaseLock(); }
}

/* Si se acabó la cuota diaria de mails (unos 100), la fila igual queda guardada */
function avisar(asunto, cuerpo) {
  try { MailApp.sendEmail(AVISAR_A, asunto, cuerpo); } catch (err) {}
}

/* Busca la pestaña; si no existe la crea con sus títulos. Si los títulos cambiaron (ej. "Semanas" -> "Días"), los pone al día. */
function obtenerHoja(nombre, columnas) {
  const libro = SpreadsheetApp.openById(ID_PLANILLA);
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(columnas);
    hoja.setFrozenRows(1);
    return hoja;
  }
  const titulos = hoja.getRange(1, 1, 1, columnas.length);
  if (titulos.getValues()[0].join("|") !== columnas.join("|")) titulos.setValues([columnas]);
  return hoja;
}

/* Para probar desde el editor: elegí "prueba" arriba y tocá Ejecutar. Crea una fila de ejemplo en cada pestaña y te manda los dos mails. */
function prueba() {
  guardarSolicitud({ ref: "PDE-PRUEBA", title: "Prueba del script", plan: "Básico", days: 7, total: 27, cat: "Fiestas", date: "2026-12-31",
    time: "23:00", place: "Punta del Este", contactMethod: "WhatsApp", contact: "099 000 000", start: "2026-12-20", until: "2026-12-26", desc: "Fila de prueba: borrala." });
  guardarServicio({ ref: "SRV-PRUEBA", need: "traslado", event: "Prueba del script", people: 2, name: "Prueba", phone: "099 000 000",
    tDate: "2026-12-31", tGo: "22:30", tFrom: "Hotel de prueba", tBack: "Sí, a la hora que avise", notes: "Fila de prueba: borrala." });
}
