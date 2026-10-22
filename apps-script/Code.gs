/* Code.gs · el "back office" de eventospde.com: guarda pedidos, manda mails y cobra con Mercado Pago.
   Es un script independiente (no está adentro de la planilla): la abre por su ID.

   QUÉ HACE
   - publicar.html  -> fila en "Solicitudes", mail para vos y link de pago de Mercado Pago por el monto exacto.
   - servicios.html -> fila en "Servicios", mail de confirmación al cliente y mail para vos.
     Vos completás "Detalle para el cliente" y "Precio USD" en la planilla: al poner el precio, el cliente recibe
     solo un mail con la cotización y el link para pagar online (eventospde.com/pagar.html).
   - Mercado Pago avisa cuando entra un pago: se marca "Pagado" en la planilla y les llega un mail a vos y al cliente.

   PUESTA EN MARCHA (una sola vez)
   1. Pegá este archivo entero y guardá.
   2. Configuración del proyecto (engranaje) > Propiedades del script > agregá MP_TOKEN con el Access Token
      de producción de tu cuenta de Mercado Pago (Mercado Pago Developers > Tus integraciones > Credenciales).
      El token no va en el código: este archivo está en GitHub, que es público.
   3. Arriba elegí "instalar" y tocá Ejecutar (acepta los permisos). Activa el aviso automático al poner un precio.
   4. Implementar > Gestionar implementaciones > lápiz > Versión: Nueva versión > Implementar.
      La dirección /exec queda igual: no hay que tocar config.js. */

const ID_PLANILLA = "1S5C63A0civLudKr2fN0r6REh8EoZ4YKDfu7wXxJCAWg";
const AVISAR_A    = "eventospde.uy@gmail.com";
const SITIO       = "https://eventospde.com";
const COTIZACION  = 42;                  // pesos por dólar para cobrar en Mercado Pago (igual que mercadopago.uyuRate en config.js)
const NOMBRE      = "Eventos PDE";

const HOJA     = "Solicitudes";
const COLUMNAS = ["Recibido", "Referencia", "Evento", "Plan", "Días", "Total US$", "Categoría", "Fecha del evento", "Hora", "Lugar",
                  "Contacto", "Dato de contacto", "Link de entradas", "Otro link", "Descripción", "Pagó", "Publicado desde", "Hasta",
                  "Clave", "Pago"];

const HOJA_SERVICIOS     = "Servicios";
const COLUMNAS_SERVICIOS = ["Recibido", "Pedido", "Clave", "Necesita", "Evento", "Personas", "Nombre", "Email", "Celular",
                            "Traslado: día", "Ida", "Desde", "Vuelta", "Hora vuelta",
                            "Llegada", "Salida", "Zona", "Tipo", "Presupuesto/noche", "Algo más",
                            "Detalle para el cliente", "Precio USD", "Estado", "Pago", "Notas internas"];

/* ============ 1. Entradas ============ */

function doPost(e) {
  const p = e.parameter || {};
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}
  /* Aviso de Mercado Pago (webhook): ?origen=mp&type=payment&data.id=123 o el mismo dato en el cuerpo */
  if (p.origen === "mp" || d.type === "payment" || p.topic === "payment") {
    const id = p["data.id"] || p.id || (d.data && d.data.id);
    if (id && (p.type || p.topic || d.type || "payment") === "payment") verificarPago(id);
    return json({ ok: true });
  }
  if (d.kind === "servicio") return json(guardarServicio(d));
  return json(guardarSolicitud(d));
}

/* pagar.html lee el pedido, pide el link de pago y confirma el pago al volver de Mercado Pago */
function doGet(e) {
  const p = e.parameter || {};
  try {
    if (p.accion === "pedido")    return json(leerPedido(p.ref, p.k));
    if (p.accion === "pagar")     return json(linkDePago(p.ref, p.k));
    if (p.accion === "verificar") return json(verificarPago(p.payment_id));
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
  return json({ ok: true, servicio: NOMBRE });
}

/* ============ 2. Publicaciones (publicar.html) ============ */

function guardarSolicitud(d) {
  const dias = d.days || d.weeks || "";
  const clave = nuevaClave();
  conCandado(() => obtenerHoja(HOJA, COLUMNAS).appendRow([new Date(), d.ref, d.title, d.plan, dias, d.total, d.cat, d.date, d.time, d.place,
    d.contactMethod, d.contact, d.tickets, d.link, d.desc, "", "", "", clave, ""]));
  avisar(`Nueva solicitud ${d.ref}: ${d.title}`,
    `Plan: ${d.plan} · ${dias} días${d.until ? ` (del ${d.start || "hoy"} al ${d.until})` : ""} · US$ ${d.total}\n` +
    `Evento: ${d.title} (${d.cat})\nFecha: ${d.date} ${d.time}\nLugar: ${d.place}\n` +
    `Contacto (${d.contactMethod}): ${d.contact}\nEntradas: ${d.tickets || "-"}\nLink: ${d.link || "-"}\n\n${d.desc || ""}\n\n` +
    `Link de pago para el cliente: ${linkPagina(d.ref, clave)}\nTodavía falta confirmar el pago.`);
  const pago = d.plan === "Portada" ? null : preferencia(d.ref, clave, `Publicación ${d.plan} · ${dias} días · ${d.title}`, Number(d.total), "");
  return { ok: true, ref: d.ref, pagina: linkPagina(d.ref, clave), pago };
}

/* ============ 3. Traslados y alojamiento (servicios.html) ============ */

function guardarServicio(d) {
  const clave = nuevaClave();
  conCandado(() => obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS).appendRow([new Date(), d.ref, clave, d.need, d.event, d.people, d.name, d.email || "", d.phone,
    d.tDate || "", d.tGo || "", d.tFrom || "", d.tBack || "", d.tBackTime || "",
    d.aIn || "", d.aOut || "", d.aZone || "", d.aType || "", d.aBudget || "", d.notes || "",
    "", "", "Nuevo", "", ""]));
  const resumen = resumenServicio(d);
  avisar(`Nuevo pedido ${d.ref}: ${d.need} · ${d.name}`,
    `${resumen}\n\nPara cotizar: completá "Detalle para el cliente" y "Precio USD" en la pestaña Servicios. Al poner el precio, ${d.email || "el cliente"} recibe la cotización con el link de pago.`);
  if (d.email) {
    mailCliente(d.email, `Recibimos tu pedido ${d.ref}`,
      `¡Hola, ${primerNombre(d.name)}!`,
      `Recibimos tu pedido de ${d.need}. Estamos armando las opciones y te mandamos la cotización a este mail. Vas a poder pagar online, con tarjeta, débito o transferencia.`,
      resumen.split("\n"), null);
  }
  return { ok: true, ref: d.ref };
}

function resumenServicio(d) {
  return [
    `Pedido: ${d.ref}`,
    `Necesita: ${d.need}`,
    `Evento: ${d.event || "ninguno en particular"}`,
    `Personas: ${d.people}`,
    d.tDate ? `Traslado: ${d.tDate}, ida ${d.tGo} hs desde ${d.tFrom}. Vuelta: ${d.tBack}${d.tBackTime ? ` (${d.tBackTime} hs aprox.)` : ""}` : "",
    d.aIn ? `Alojamiento: del ${d.aIn} al ${d.aOut} · ${d.aZone} · ${d.aType} · presupuesto ${d.aBudget}` : "",
    `Nombre: ${d.name} · ${d.email || "sin mail"} · ${d.phone}`,
    d.notes ? `Algo más: ${d.notes}` : ""
  ].filter(Boolean).join("\n");
}

/* Al poner un precio en "Precio USD" (pestaña Servicios) se manda la cotización al cliente.
   Lo activa instalar(); también se puede correr enviarCotizacionesPendientes() a mano. */
function alEditar(e) {
  const hoja = e.range.getSheet();
  if (hoja.getName() !== HOJA_SERVICIOS) return;
  const colPrecio = COLUMNAS_SERVICIOS.indexOf("Precio USD") + 1;
  if (e.range.getColumn() > colPrecio || e.range.getLastColumn() < colPrecio) return;
  enviarCotizacionesPendientes();
}

function enviarCotizacionesPendientes() {
  const hoja = obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS);
  const filas = hoja.getDataRange().getValues();
  const c = nombre => COLUMNAS_SERVICIOS.indexOf(nombre);
  for (let i = 1; i < filas.length; i++) {
    const f = filas[i];
    const precio = Number(f[c("Precio USD")]);
    if (!precio || f[c("Estado")] !== "Nuevo" || !f[c("Email")]) continue;
    const ref = f[c("Pedido")], clave = f[c("Clave")];
    const detalle = String(f[c("Detalle para el cliente")] || "").trim();
    mailCliente(f[c("Email")], `Tu cotización ${ref} · US$ ${precio}`,
      `¡Hola, ${primerNombre(f[c("Nombre")])}!`,
      `Ya tenemos tu cotización de ${f[c("Necesita")]}${f[c("Evento")] ? ` para ${f[c("Evento")]}` : ""}. El total es US$ ${precio} (${pesos(precio)}). Para confirmarlo, pagalo online desde el botón: es seguro y acepta tarjeta, débito o transferencia.`,
      [detalle ? `Incluye: ${detalle}` : "", `Pedido: ${ref}`].filter(Boolean),
      { texto: `Pagar US$ ${precio}`, url: linkPagina(ref, clave) });
    hoja.getRange(i + 1, c("Estado") + 1).setValue("Cotizado");
  }
}

/* ============ 4. Pagos con Mercado Pago ============ */

/* Datos de un pedido para pagar.html (solo con su clave) */
function leerPedido(ref, k) {
  const r = buscar(ref);
  if (!r || String(r.get("Clave")) !== String(k)) return { ok: false, error: "No encontramos el pedido. Revisá el link del mail." };
  if (r.tipo === "servicio") {
    const precio = Number(r.get("Precio USD")) || 0;
    return {
      ok: true, ref, tipo: "servicio",
      titulo: String(r.get("Necesita")).replace(/^./, c => c.toUpperCase()),
      evento: r.get("Evento"), nombre: primerNombre(r.get("Nombre")),
      detalle: r.get("Detalle para el cliente"),
      lineas: [fechaTexto(r.get("Traslado: día")) && `Traslado: ${fechaTexto(r.get("Traslado: día"))}, ida ${horaTexto(r.get("Ida"))} hs desde ${r.get("Desde")}`,
               fechaTexto(r.get("Llegada")) && `Alojamiento: del ${fechaTexto(r.get("Llegada"))} al ${fechaTexto(r.get("Salida"))}`,
               `Personas: ${r.get("Personas")}`].filter(Boolean),
      usd: precio, pesos: precio ? pesos(precio) : "", estado: r.get("Estado") || "Nuevo"
    };
  }
  const total = Number(r.get("Total US$")) || 0;
  return {
    ok: true, ref, tipo: "publicacion", titulo: `Publicación ${r.get("Plan")}`, evento: r.get("Evento"),
    lineas: [`${r.get("Días")} días de publicación`, `Evento: ${r.get("Evento")} (${fechaTexto(r.get("Fecha del evento"))})`],
    usd: total, pesos: pesos(total), estado: r.get("Pagó") ? "Pagado" : "Nuevo", portada: r.get("Plan") === "Portada"
  };
}

/* Link de Mercado Pago por el monto exacto del pedido */
function linkDePago(ref, k) {
  const p = leerPedido(ref, k);
  if (!p.ok) return p;
  if (p.estado === "Pagado") return { ok: false, error: "Este pedido ya está pagado." };
  if (!p.usd) return { ok: false, error: "Todavía no tiene precio: te avisamos por mail cuando esté la cotización." };
  const url = preferencia(ref, k, `${p.titulo}${p.evento ? ` · ${p.evento}` : ""} (${ref})`, p.usd, "");
  return url ? { ok: true, url } : { ok: false, error: "El pago online no está disponible en este momento. Probá por transferencia." };
}

function preferencia(ref, clave, titulo, usd, email) {
  const token = PropertiesService.getScriptProperties().getProperty("MP_TOKEN");
  if (!token || !usd) return null;
  const vuelta = linkPagina(ref, clave);
  const res = UrlFetchApp.fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify({
      items: [{ id: ref, title: titulo.slice(0, 250), quantity: 1, currency_id: "UYU", unit_price: Math.round(usd * COTIZACION) }],
      external_reference: ref,
      ...(email ? { payer: { email } } : {}),
      back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
      auto_return: "approved",
      notification_url: ScriptApp.getService().getUrl() + "?origen=mp",
      statement_descriptor: "EVENTOSPDE"
    })
  });
  if (res.getResponseCode() >= 300) { console.error(res.getContentText()); return null; }
  return JSON.parse(res.getContentText()).init_point;
}

/* Consulta un pago en Mercado Pago; si está aprobado, marca el pedido como pagado (una sola vez) */
function verificarPago(id) {
  const token = PropertiesService.getScriptProperties().getProperty("MP_TOKEN");
  if (!token || !id) return { ok: false };
  const res = UrlFetchApp.fetch("https://api.mercadopago.com/v1/payments/" + encodeURIComponent(id),
    { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
  if (res.getResponseCode() >= 300) return { ok: false };
  const pago = JSON.parse(res.getContentText());
  const ref = pago.external_reference;
  if (pago.status !== "approved" || !ref) return { ok: true, ref, estado: pago.status };
  conCandado(() => {
    const r = buscar(ref);
    if (!r || String(r.get("Pago")).indexOf(String(pago.id)) >= 0) return;    // ya estaba anotado
    const texto = `MP ${pago.id} · $U ${pago.transaction_amount} · ${Utilities.formatDate(new Date(), "America/Montevideo", "dd/MM HH:mm")}`;
    r.set("Pago", texto);
    if (r.tipo === "servicio") r.set("Estado", "Pagado"); else r.set("Pagó", "Sí (Mercado Pago)");
    avisar(`Pago recibido ${ref} · $U ${pago.transaction_amount}`, `Mercado Pago aprobó el pago ${pago.id} del pedido ${ref}.\n${texto}`);
    const email = (r.tipo === "servicio" && r.get("Email")) || (pago.payer && pago.payer.email);
    if (email) mailCliente(email, `Pago confirmado · ${ref}`, "¡Listo, pago confirmado!",
      r.tipo === "servicio"
        ? "Recibimos tu pago. En breve te escribimos con los datos para coordinar (chofer, horarios o reserva)."
        : "Recibimos tu pago. Revisamos los datos y publicamos tu evento; te avisamos cuando esté online.",
      [`Pedido: ${ref}`, `Monto: $U ${pago.transaction_amount}`, `Comprobante de Mercado Pago: ${pago.id}`], null);
  });
  return { ok: true, ref, estado: "approved" };
}

/* ============ 5. Planilla ============ */

/* Busca un pedido por referencia en las dos pestañas. Devuelve get/set por nombre de columna. */
function buscar(ref) {
  if (!ref) return null;
  const tipos = [[HOJA_SERVICIOS, COLUMNAS_SERVICIOS, "Pedido", "servicio"], [HOJA, COLUMNAS, "Referencia", "publicacion"]];
  for (const [nombre, cols, colRef, tipo] of tipos) {
    const hoja = obtenerHoja(nombre, cols);
    const filas = hoja.getDataRange().getValues();
    const i = filas.findIndex((f, n) => n > 0 && f[cols.indexOf(colRef)] === ref);
    if (i > 0) return {
      tipo,
      get: col => filas[i][cols.indexOf(col)],
      set: (col, v) => hoja.getRange(i + 1, cols.indexOf(col) + 1).setValue(v)
    };
  }
  return null;
}

/* Busca la pestaña; si no existe la crea con sus títulos. Si los títulos cambiaron, los pone al día. */
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

/* ============ 6. Mails ============ */

/* Mail para vos (texto simple). Si se acabó la cuota diaria (unos 100), la fila igual queda guardada. */
function avisar(asunto, cuerpo) {
  try { MailApp.sendEmail(AVISAR_A, asunto, cuerpo, { name: NOMBRE }); } catch (err) {}
}

/* Mail para el cliente: con el diseño de la web (fondo oscuro, tarjeta clara) y un botón opcional */
function mailCliente(para, asunto, titulo, texto, lineas, boton) {
  const html = `<div style="background:#151518;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <p style="margin:0 0 18px;font-size:20px;font-weight:bold;color:#F4F4F5">Eventos<span style="color:#7C4DFF">PDE</span></p>
    <div style="background:#F7F5F2;border-radius:22px;padding:26px 24px;color:#151518">
      <h1 style="margin:0 0 10px;font-size:24px;line-height:1.15">${esc_(titulo)}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#44444a">${esc_(texto)}</p>
      ${lineas && lineas.length ? `<div style="border-top:1.5px dashed #d6d2cb;border-bottom:1.5px dashed #d6d2cb;padding:12px 0;margin:0 0 18px">
        ${lineas.map(l => `<p style="margin:4px 0;font-size:14px;color:#151518">${esc_(l)}</p>`).join("")}</div>` : ""}
      ${boton ? `<a href="${boton.url}" style="display:block;text-align:center;background:#7C4DFF;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:15px 18px;border-radius:14px">${esc_(boton.texto)}</a>` : ""}
    </div>
    <p style="margin:16px 4px 0;font-size:12px;line-height:1.5;color:#9a9aa4">Eventos PDE · Todo lo que pasa en Punta del Este · <a href="${SITIO}" style="color:#9a9aa4">eventospde.com</a><br>Si tenés alguna duda, respondé este mail.</p>
  </div></div>`;
  try { MailApp.sendEmail({ to: para, subject: asunto, htmlBody: html, name: NOMBRE, replyTo: AVISAR_A }); } catch (err) { console.error(err); }
}

/* ============ 7. Utilidades ============ */

const json = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
const pesos = usd => "$U " + Math.round(usd * COTIZACION).toLocaleString("es-UY");
const linkPagina = (ref, clave) => `${SITIO}/pagar.html?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(clave)}`;
const primerNombre = n => String(n || "").trim().split(/\s+/)[0] || "";
const esc_ = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nuevaClave = () => Utilities.getUuid().replace(/-/g, "").slice(0, 12);
const fechaTexto = v => !v ? "" : v instanceof Date ? Utilities.formatDate(v, "America/Montevideo", "dd/MM/yyyy") : String(v).split("-").reverse().join("/");
const horaTexto = v => !v ? "" : v instanceof Date ? Utilities.formatDate(v, "America/Montevideo", "HH:mm") : String(v);

function conCandado(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { fn(); } finally { lock.releaseLock(); }
}

/* Correr una vez: activa el envío automático de la cotización al poner un precio en la planilla */
function instalar() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "alEditar").forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("alEditar").forSpreadsheet(ID_PLANILLA).onEdit().create();
  obtenerHoja(HOJA, COLUMNAS);
  obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS);
  UrlFetchApp.fetch("https://api.mercadopago.com", { muteHttpExceptions: true });   // pide el permiso para conectarse a Mercado Pago
  console.log("Listo: al poner un precio en Servicios se manda la cotización. MP_TOKEN " +
    (PropertiesService.getScriptProperties().getProperty("MP_TOKEN") ? "cargado." : "FALTA (Configuración del proyecto > Propiedades del script)."));
}
