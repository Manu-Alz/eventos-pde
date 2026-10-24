/* Code.gs · el "back office" de eventospde.com: guarda pedidos, manda mails y cobra con Mercado Pago.
   Es un script independiente (no está adentro de la planilla): la abre por su ID.

   QUÉ HACE
   - publicar.html  -> fila en "Solicitudes", mail para vos y link de pago de Mercado Pago por el monto exacto.
   - plan.html (Armar plan) -> fila en "Servicios", mail de confirmación al cliente y mail para vos.
     Vos completás "Detalle para el cliente" y "Precio USD" en la planilla: al poner el precio, el cliente recibe
     solo un mail con la cotización y el link para pagar online (eventospde.com/pagar.html).
   - Traslados (página de cada evento, o Armar plan solo de traslados) -> precio al instante con TARIFAS, fila "Por pagar"
     y pago con tarjeta en Mercado Pago, sin cotizar.
   - Mercado Pago avisa cuando entra un pago: se marca "Pagado" en la planilla y les llega un mail a vos y al cliente
     (y, si es un traslado, a la empresa de traslados de AVISO_TRASLADOS).

   PUESTA EN MARCHA (una sola vez)
   1. Pegá este archivo entero y guardá.
   2. Configuración del proyecto (engranaje) > Propiedades del script > agregá MP_TOKEN con el Access Token
      de producción de tu cuenta de Mercado Pago (Mercado Pago Developers > Tus integraciones > Credenciales).
      El token no va en el código: este archivo está en GitHub, que es público.
      Opcional: AVISO_TRASLADOS con el mail de la empresa de traslados (recibe cada viaje pagado).
      Opcional: AVISO_ALOJAMIENTO con los mails de inmobiliarias y hoteles aliados, separados por coma (reciben cada
      pedido de alojamiento, sin los datos del cliente).
   3. Arriba elegí "instalar" y tocá Ejecutar (acepta los permisos, incluido Gmail). Activa el aviso automático al poner un precio
      y un reloj que cada 10 minutos manda las cotizaciones que hayan quedado pendientes.
      Después elegí "probarMail" y Ejecutar: te llega un mail de prueba y dice si salió desde contacto@eventospde.com.
   4. Implementar > Gestionar implementaciones > lápiz > Versión: Nueva versión > Implementar.
      La dirección /exec queda igual: no hay que tocar config.js. */

const ID_PLANILLA = "1S5C63A0civLudKr2fN0r6REh8EoZ4YKDfu7wXxJCAWg";
const AVISAR_A    = "eventospde.uy@gmail.com";   // avisos internos (pedidos y pagos nuevos)
const CONTACTO    = "contacto@eventospde.com";   // los mails a clientes salen y se responden desde acá (alias "Enviar como" de Gmail)
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
  if (d.kind === "traslado") return json(guardarTraslado(d));
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
  if (!d.title || !d.plan || !d.ref) return { ok: false, error: "Faltan datos de la publicación." };   // nada de filas vacías
  const dias = d.days || d.weeks || "";
  const clave = nuevaClave();
  conCandado(() => obtenerHoja(HOJA, COLUMNAS).appendRow([new Date(), d.ref, d.title, d.plan, dias, d.total, d.cat, d.date, d.time, d.place,
    d.contactMethod, d.contact, d.tickets, d.link, d.desc, "", "", "", clave, ""].map(celda_)));
  avisar(`Nueva solicitud ${d.ref}: ${d.title}`,
    `Plan: ${d.plan} · ${dias} días${d.until ? ` (del ${d.start || "hoy"} al ${d.until})` : ""} · US$ ${d.total}\n` +
    `Evento: ${d.title} (${d.cat})\nFecha: ${d.date} ${d.time}\nLugar: ${d.place}\n` +
    `Contacto (${d.contactMethod}): ${d.contact}\nEntradas: ${d.tickets || "-"}\nLink: ${d.link || "-"}\n\n${d.desc || ""}\n\n` +
    `Link de pago para el cliente: ${linkPagina(d.ref, clave)}\nTodavía falta confirmar el pago.`);
  const pago = d.plan === "Portada" ? null : preferencia(d.ref, clave, `Publicación ${d.plan} · ${dias} días · ${d.title}`, Number(d.total), "");
  return { ok: true, ref: d.ref, pagina: linkPagina(d.ref, clave), pago };
}

/* ============ 3. Entradas, traslados y alojamiento (Armar plan, plan.html) ============ */

function guardarServicio(d) {
  const clave = nuevaClave();
  conCandado(() => obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS).appendRow([new Date(), d.ref, clave, d.need, d.event, d.people, d.name, d.email || "", d.phone,
    d.tDate || "", d.tGo || "", d.tFrom || "", d.tBack || "", d.tBackTime || "",
    d.aIn || "", d.aOut || "", d.aZone || "", d.aType || "", d.aBudget || "", d.notes || "",
    "", "", "Nuevo", "", ""].map(celda_)));
  const resumen = resumenServicio(d);
  avisar(`Nuevo pedido ${d.ref}: ${d.need} · ${d.name}`,
    `${resumen}\n\nPara cotizar: completá "Detalle para el cliente" y "Precio USD" en la pestaña Servicios. Al poner el precio, ${d.email || "el cliente"} recibe la cotización con el link de pago.`);
  avisarAliados_(d);
  if (d.email) {
    mailCliente(d.email, `Recibimos tu pedido ${d.ref}`,
      `¡Hola, ${primerNombre(d.name)}!`,
      `Recibimos tu pedido de ${d.need}. Estamos armando las opciones y te mandamos la cotización a este mail. Vas a poder pagar online con tarjeta de crédito o débito.`,
      resumen.split("\n"), null);
  }
  return { ok: true, ref: d.ref };
}

/* Pedido de alojamiento ("Que me lo busquen ustedes"): se reenvía solo a las inmobiliarias y hoteles aliados de la propiedad
   del script AVISO_ALOJAMIENTO (mails separados por coma), en copia oculta para que no se vean entre ellos y SIN los datos
   del cliente: responden a contacto@ con opciones y precio, y la reserva (con la comisión) pasa por Eventos PDE.
   No se reenvía si eligió un alojamiento puntual del catálogo (ese ya tiene dueño). */
function avisarAliados_(d) {
  const aliados = PropertiesService.getScriptProperties().getProperty("AVISO_ALOJAMIENTO");
  if (!aliados || !d.aIn || /\(convenio\)/.test(d.aType || "")) return;
  const noches = Math.max(Math.round((new Date(d.aOut) - new Date(d.aIn)) / 864e5), 0);
  const cuerpo = [
    "¡Hola! Tenemos un pedido de alojamiento en Punta del Este:", "",
    `Fechas: del ${fechaTexto(d.aIn)} al ${fechaTexto(d.aOut)}${noches ? ` (${noches} ${noches === 1 ? "noche" : "noches"})` : ""}`,
    `Zona: ${d.aZone || "a definir"}`, `Personas: ${d.people}`, `Tipo: ${d.aType || "me da igual"}`, `Presupuesto por noche: ${d.aBudget || "a conversar"}`,
    `Pedido: ${d.ref}`, "",
    "Si tenés algo disponible, respondé este mail con fotos o link, ubicación, precio por noche y total (con la comisión que acordamos incluida).",
    "Nosotros le pasamos las opciones al cliente y coordinamos la reserva.", "", "Gracias,", NOMBRE, CONTACTO
  ].join("\n");
  try { MailApp.sendEmail(AVISAR_A, `Pedido de alojamiento ${d.ref} · ${d.aZone || "Punta del Este"} · ${fechaTexto(d.aIn)} al ${fechaTexto(d.aOut)}`, cuerpo, { name: NOMBRE, replyTo: CONTACTO, bcc: aliados }); }
  catch (err) { console.error(err); }
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

/* La corren el aviso al editar y el reloj cada 10 minutos (los dos los activa instalar()). El candado evita que dos
   corridas a la vez manden el mismo mail dos veces. */
function enviarCotizacionesPendientes() { conCandado(cotizarPendientes_); }

function cotizarPendientes_() {
  const hoja = obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS);
  const filas = hoja.getDataRange().getValues();
  const c = nombre => COLUMNAS_SERVICIOS.indexOf(nombre);
  for (let i = 1; i < filas.length; i++) {
    const f = filas[i];
    const precio = usd_(f[c("Precio USD")]);
    const email = String(f[c("Email")] || "").trim();
    if (!precio || String(f[c("Estado")]).trim() !== "Nuevo" || !email) continue;
    const ref = f[c("Pedido")], clave = f[c("Clave")];
    const detalle = String(f[c("Detalle para el cliente")] || "").trim();
    const itinerario = itinerarioDe(f[c("Algo más")]);
    const para = itinerario.length ? "" : f[c("Evento")] ? ` para ${f[c("Evento")]}` : "";   // en un plan, los eventos van en la lista
    const enviado = mailCliente(email, `Tu cotización ${ref} · US$ ${precio}`,
      `¡Hola, ${primerNombre(f[c("Nombre")])}!`,
      `Ya tenemos tu cotización de ${f[c("Necesita")]}${para}. El total es US$ ${precio} (${pesos(precio)}). Para confirmarlo, pagalo online desde el botón con tarjeta de crédito o débito: es seguro y se confirma al instante.`,
      [detalle ? `Incluye: ${detalle}` : "", ...itinerario, `Pedido: ${ref}`].filter(Boolean),
      { texto: `Pagar US$ ${precio}`, url: linkPagina(ref, clave) });
    if (enviado) hoja.getRange(i + 1, c("Estado") + 1).setValue("Cotizado");   // si el mail falló, queda "Nuevo" y se reintenta solo
  }
}

/* ============ 3b. Traslados con chofer: precio al instante y pago con tarjeta ============
   Los piden la página de cada evento y Armar plan (cuando el pedido es solo de traslados). El precio se vuelve a calcular
   acá con TARIFAS (la web solo lo muestra): la fila entra a "Servicios" con el precio puesto y Estado "Por pagar", y el
   cliente va directo a Mercado Pago. Al aprobarse el pago: Estado "Pagado", mail al cliente, a vos y a la empresa de
   traslados (propiedad del script AVISO_TRASLADOS: uno o varios mails separados por coma; vacío = solo a vos). */

/* Copia de tarifas.js y de TARIFAS (config.js): tienen que coincidir */
const ZONAS = {
  "Península": [-34.9615, -54.9480], "Playa Brava o Mansa": [-34.9360, -54.9330], "La Barra": [-34.9130, -54.8660],
  "Manantiales": [-34.8990, -54.8290], "José Ignacio": [-34.8445, -54.6340], "Maldonado": [-34.9080, -54.9560]
};
const TARIFAS = {
  tramos:   [[6, 20], [15, 30], [30, 45], [Infinity, 65]],
  llegadas: { pde: 50, mvd: 170, bqmvd: 180, bqcol: 320, bus: 20 },
  grupo:    1.5
};
const LLEGADAS = { pde: "Aeropuerto de Laguna del Sauce", mvd: "Aeropuerto de Carrasco", bqmvd: "Puerto de Montevideo", bqcol: "Puerto de Colonia", bus: "Terminal de Punta del Este" };

function kmRuta_(a, b) {
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2)) * 1.35;
}
const factorGrupo_ = p => (p <= 4 ? 1 : Math.ceil(p / 8) * TARIFAS.grupo);
const vehiculo_ = p => (p <= 4 ? "auto hasta 4 personas" : p <= 8 ? "camioneta hasta 8 personas" : `${Math.ceil(p / 8)} camionetas`);
/* Un punto del departamento de Maldonado (para no cobrar un viaje a cualquier lado) */
const enMaldonado_ = g => Array.isArray(g) && g.length === 2 && g[0] > -35.2 && g[0] < -34.4 && g[1] > -55.5 && g[1] < -54.2;

/* Precio de cada tramo pedido. Devuelve null si algo no se puede cotizar solo (entonces la web pide cotización) */
function precioTraslado_(d) {
  const p = Math.round(Number(d.people));
  const desde = ZONAS[d.zone];
  if (!(p >= 1 && p <= 30) || !desde || !Array.isArray(d.items) || !d.items.length || d.items.length > 20) return null;
  let total = 0;
  d.address = String(d.address || "").slice(0, 160);
  d.notes = String(d.notes || "").slice(0, 600);
  for (const it of d.items) {
    ["titulo", "fecha", "lugar", "sentido", "busca", "vuelta", "inFecha", "inHora", "inRef", "outFecha", "outHora", "outRef"]
      .forEach(k => { it[k] = String(it[k] || "").slice(0, 140); });                     // textos cortos: nada raro en la planilla
    const legs = Number(it.legs);
    if (legs !== 1 && legs !== 2) return null;
    let base;
    if (it.tipo === "evento") {
      if (!enMaldonado_(it.geo)) return null;
      const km = kmRuta_(desde, it.geo.map(Number));
      base = TARIFAS.tramos.find(([hasta]) => km <= hasta)[1];
    } else if (it.tipo === "llegada") {
      base = TARIFAS.llegadas[it.via];
      if (!base) return null;
    } else return null;
    it.usd = Math.round(base * legs * factorGrupo_(p));
    total += it.usd;
  }
  return total;
}

function guardarTraslado(d) {
  if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email || "") || !d.phone) return { ok: false, error: "Faltan tu nombre, mail o WhatsApp." };
  const usd = precioTraslado_(d);
  if (!usd) return { ok: false, error: "No pudimos calcular el precio de este traslado. Pedí una cotización y te respondemos enseguida." };
  const ref = "TRS-" + nuevaClave().slice(0, 5).toUpperCase();
  const clave = nuevaClave();
  const p = Math.round(Number(d.people));
  const desde = `${d.zone}${d.address ? ` · ${d.address}` : ""}`;
  const RIDE = { "ida y vuelta": "ida y vuelta", "solo ida": "solo ida", "solo vuelta": "solo vuelta" };
  const lineas = d.items.map(it => it.tipo === "evento"
    ? `• ${it.fecha || ""} · ${it.titulo} · ${it.lugar || ""} · chofer ${RIDE[it.sentido] || "ida y vuelta"}` +
      (it.busca ? `, te buscamos ${it.busca}` : "") + (it.sentido !== "solo ida" ? `, vuelta ${it.vuelta || "a la hora que nos avises"}` : "") + ` · US$ ${it.usd}`
    : `• ${it.sentido === "regreso" ? "Regreso" : "Llegada"}${it.sentido === "ambos" ? " y regreso" : ""}: ${LLEGADAS[it.via]} ↔ alojamiento` +
      (it.inFecha ? ` · llega ${it.inFecha}${it.inHora ? " " + it.inHora : ""}${it.inRef ? " (" + it.inRef + ")" : ""}` : "") +
      (it.outFecha ? ` · se va ${it.outFecha}${it.outHora ? " " + it.outHora : ""}${it.outRef ? " (" + it.outRef + ")" : ""}` : "") + ` · US$ ${it.usd}`);
  const eventos = d.items.filter(it => it.tipo === "evento");
  const primero = eventos[0] || {};
  const detalle = `Chofer privado, ${vehiculo_(p)}, desde ${desde}`;
  const notas = `Itinerario:\n${lineas.join("\n")}${d.notes ? `\n\nAlgo más: ${d.notes}` : ""}`;
  conCandado(() => obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS).appendRow([new Date(), ref, clave,
    d.items.length > 1 ? "traslados" : "traslado", eventos.map(it => `${it.titulo} (${it.fecha})`).join(" + ") || LLEGADAS[(d.items[0] || {}).via] || "",
    p, d.name, d.email, d.phone, primero.fecha || "", primero.busca || "", desde, primero.vuelta || (eventos.length ? "a la hora que avise" : ""), "",
    "", "", "", "", "", notas, detalle, usd, "Por pagar", "", ""].map(celda_)));
  avisar(`Nuevo traslado ${ref} · US$ ${usd} (esperando el pago)`,
    `${d.name} · ${d.email} · ${d.phone}\n${p} personas · ${detalle}\n\n${lineas.join("\n")}${d.notes ? `\n\nAlgo más: ${d.notes}` : ""}\n\n` +
    `El precio ya está puesto: cuando pague con tarjeta te llega otro mail y la fila pasa a "Pagado".`);
  const url = preferencia(ref, clave, `Traslado con chofer · ${eventos.length ? eventos.map(it => it.titulo).join(" + ") : LLEGADAS[(d.items[0] || {}).via]} (${ref})`, usd, d.email);
  return { ok: true, ref, usd, url, pagina: linkPagina(ref, clave) };
}

/* ============ 4. Pagos con Mercado Pago ============ */

/* Datos de un pedido para pagar.html (solo con su clave) */
function leerPedido(ref, k) {
  const r = buscar(ref);
  if (!r || String(r.get("Clave")) !== String(k)) return { ok: false, error: "No encontramos el pedido. Revisá el link del mail." };
  if (r.tipo === "servicio") {
    const precio = usd_(r.get("Precio USD"));
    const itinerario = itinerarioDe(r.get("Algo más"));
    const esPlan = itinerario.length > 0;
    const eventos = itinerario.filter(l => !/^(Llegada|Regreso):/.test(l)).length;   // la llegada y el regreso no cuentan como eventos
    const aloj = String(r.get("Tipo") || "");
    return {
      ok: true, ref, tipo: "servicio",
      titulo: String(r.get("Necesita")).replace(/^./, c => c.toUpperCase()),
      evento: !esPlan || /^TRS-/.test(ref) ? r.get("Evento") : eventos ? `${eventos} ${eventos === 1 ? "evento" : "eventos"} en Punta del Este` : "Tu viaje a Punta del Este",
      nombre: primerNombre(r.get("Nombre")),
      detalle: r.get("Detalle para el cliente"),
      lineas: [...(esPlan ? itinerario
                 : [fechaTexto(r.get("Traslado: día")) && `Traslado: ${fechaTexto(r.get("Traslado: día"))}, ida ${horaTexto(r.get("Ida"))} hs desde ${r.get("Desde")}`]),
               fechaTexto(r.get("Llegada")) && `Alojamiento: del ${fechaTexto(r.get("Llegada"))} al ${fechaTexto(r.get("Salida"))}${r.get("Zona") ? ` · ${r.get("Zona")}` : ""}${aloj && aloj !== "Me da igual" ? ` · ${aloj}` : ""}`,
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
  return url ? { ok: true, url } : { ok: false, error: "El pago online no está disponible en este momento." };
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
      binary_mode: true,                                                    // con tarjeta: aprobado o rechazado al instante, sin "pendiente"
      payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },   // solo tarjeta y saldo de Mercado Pago (sin efectivo)
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
    const esTraslado = /^TRS-/.test(ref);
    const itinerario = r.tipo === "servicio" ? itinerarioDe(r.get("Algo más")) : [];
    if (email) mailCliente(email, `${esTraslado ? "Traslado confirmado" : "Pago confirmado"} · ${ref}`, esTraslado ? "¡Listo, tu traslado está confirmado!" : "¡Listo, pago confirmado!",
      esTraslado
        ? "Recibimos tu pago. Antes del viaje te escribimos por WhatsApp con el nombre del chofer y el auto. Para la vuelta, avisanos por WhatsApp cuando quieras que te busquemos."
        : r.tipo === "servicio"
        ? "Recibimos tu pago. En breve te escribimos con los datos para coordinar (chofer, horarios o reserva)."
        : "Recibimos tu pago. Revisamos los datos y publicamos tu evento; te avisamos cuando esté online.",
      [...itinerario, `Pedido: ${ref}`, `Monto: $U ${pago.transaction_amount}`, `Comprobante de Mercado Pago: ${pago.id}`], null);
    /* La empresa de traslados recibe el viaje ya pagado, con todo lo que necesita para asignar el chofer */
    const empresa = PropertiesService.getScriptProperties().getProperty("AVISO_TRASLADOS");
    if (esTraslado && empresa) {
      try {
        MailApp.sendEmail(empresa, `Viaje pagado ${ref} · ${r.get("Personas")} personas`,
          `Pedido ${ref} (pagado con tarjeta)\n${r.get("Detalle para el cliente")}\n\n${itinerario.join("\n")}\n\n` +
          `Pasajero: ${r.get("Nombre")} · WhatsApp ${r.get("Celular")}\nPersonas: ${r.get("Personas")}\nBuscar en: ${r.get("Desde")}\n\nEventos PDE · ${CONTACTO}`,
          { name: NOMBRE, replyTo: CONTACTO });
      } catch (err) { console.error(err); }
    }
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
  /* Sale desde contacto@eventospde.com si está configurado como "Enviar como" en el Gmail de la cuenta; si no, desde el Gmail,
     pero igual se responde a contacto@ */
  const desde = remitente();
  try { GmailApp.sendEmail(para, asunto, `${titulo}\n\n${texto}`, { htmlBody: html, name: NOMBRE, replyTo: CONTACTO, ...(desde ? { from: desde } : {}) }); return true; }
  catch (err) { console.error(err); return false; }
}

/* ============ 7. Utilidades ============ */

const json = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
const pesos = usd => "$U " + Math.round(usd * COTIZACION).toLocaleString("es-UY");
const linkPagina = (ref, clave) => `${SITIO}/pagar.html?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(clave)}`;
/* Los pedidos de Armar plan traen el itinerario en "Algo más", una línea "• ..." por evento */
const itinerarioDe = notas => String(notas || "").split("\n").filter(l => /^•\s/.test(l)).map(l => l.replace(/^•\s*/, ""));
const primerNombre = n => String(n || "").trim().split(/\s+/)[0] || "";
const esc_ = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* Lo que viene de la web se guarda como texto: un celular "+598 …" o algo que empiece con = - @ la planilla lo leería
   como fórmula (#ERROR!). El apóstrofo de adelante no se ve en la celda. */
const celda_ = v => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v);
/* Precio escrito a mano: acepta 120, "120", "US$ 120", "120 USD" o "1.250,50" (devuelve 0 si no hay número) */
function usd_(v) {
  if (typeof v === "number") return v;
  let s = String(v || "").replace(/[^\d.,]/g, "");
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");   // coma decimal: 1.250,50
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");      // punto de miles: 1.250
  else s = s.replace(/,/g, "");
  return Number(s) || 0;
}
/* Clave del link de pago: empieza con letra para que la planilla nunca la lea como número (ej. "12e45" sería 1,2 × 10^46) */
const nuevaClave = () => "k" + Utilities.getUuid().replace(/-/g, "").slice(0, 11);
const fechaTexto = v => !v ? "" : v instanceof Date ? Utilities.formatDate(v, "America/Montevideo", "dd/MM/yyyy") : String(v).split("-").reverse().join("/");
const horaTexto = v => !v ? "" : v instanceof Date ? Utilities.formatDate(v, "America/Montevideo", "HH:mm") : String(v);

function conCandado(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { fn(); } finally { lock.releaseLock(); }
}

/* Correr una vez: activa el envío automático de la cotización al poner un precio en la planilla */
/* contacto@ solo si Gmail lo tiene como alias (Configuración > Cuentas e importación > Enviar como) */
let remitenteCache;
function remitente() {
  if (remitenteCache === undefined) { try { remitenteCache = GmailApp.getAliases().includes(CONTACTO) ? CONTACTO : ""; } catch (err) { remitenteCache = ""; } }
  return remitenteCache;
}

/* Para probar los mails: Ejecutar > probarMail. Manda un mail de cliente de ejemplo a tu Gmail y dice desde qué dirección salió */
function probarMail() {
  mailCliente(AVISAR_A, "Prueba de mail · Eventos PDE", "¡Hola!", "Este es un mail de prueba con el diseño que reciben los clientes. Si respondés, la respuesta va a " + CONTACTO + ".", ["Pedido: PRUEBA"], { texto: "Ver la web", url: SITIO });
  console.log(remitente() ? "Salió desde " + CONTACTO + "." : "Salió desde el Gmail: falta agregar " + CONTACTO + " en Gmail > Configuración > Cuentas e importación > Enviar como.");
}

function instalar() {
  ScriptApp.getProjectTriggers().filter(t => ["alEditar", "enviarCotizacionesPendientes"].includes(t.getHandlerFunction())).forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("alEditar").forSpreadsheet(ID_PLANILLA).onEdit().create();
  /* Respaldo: cada 10 minutos manda las cotizaciones que hayan quedado sin mandar (por ejemplo, si el aviso al editar falló) */
  ScriptApp.newTrigger("enviarCotizacionesPendientes").timeBased().everyMinutes(10).create();
  obtenerHoja(HOJA, COLUMNAS);
  obtenerHoja(HOJA_SERVICIOS, COLUMNAS_SERVICIOS);
  UrlFetchApp.fetch("https://api.mercadopago.com", { muteHttpExceptions: true });   // pide el permiso para conectarse a Mercado Pago
  GmailApp.getAliases();                                                                // pide el permiso para mandar desde contacto@
  console.log("Listo: al poner un precio en Servicios se manda la cotización. MP_TOKEN " +
    (PropertiesService.getScriptProperties().getProperty("MP_TOKEN") ? "cargado." : "FALTA (Configuración del proyecto > Propiedades del script)."));
}
