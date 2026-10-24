/* config.js · ajustes del sitio
   Se edita una sola vez: contacto, pagos, categorías, afiliados y planes.
   Los eventos se cargan aparte, en data.js. */

/* ============ 1. Contacto, pagos y analítica ============ */
const CONFIG = {
  whatsapp:  "59894717738",                 // tu WhatsApp con código de país, sin + ni espacios
  email:     "contacto@eventospde.com",     // mail de contacto (pie de página, publicar y comprobantes). Llega al Gmail eventospde.uy@gmail.com por reenvío de Namecheap
  instagram: "eventos_pde",                 // usuario de Instagram, sin @
  ga:        "G-SC1Y8ZRB66",                // ID de Google Analytics 4. Sin ID no se carga nada.
  formUrl:   "https://script.google.com/macros/s/AKfycbx5tDOduOG0AgE2KeUL6R5-M5MxpNArbjcv_mNsMsfFQ3p1Svw-wP8sIXxqHFpT3nS8/exec",                            // dirección de la aplicación web de Google (apps-script/Code.gs). Vacío = no se avisa solo
  formServicios: true,                      // true = los pedidos de traslado y alojamiento también van a la planilla (pestaña "Servicios").
                                            // Activalo recién después de pegar el Code.gs nuevo y volver a implementarlo (ver README)
  paypal:    "TU_USUARIO_PAYPAL",           // lo que va después de paypal.me/
  /* Mercado Pago: link de pago de monto libre (la persona escribe el monto, en pesos).
     La web le muestra cuántos pesos poner: total en US$ × uyuRate. Sin link o sin cotización no se ofrece. */
  mercadopago: {
    link:    "https://link.mercadopago.com.uy/eventospde",
    uyuRate: 42                             // cotización del dólar para Mercado Pago (actualizala cuando cambie)
  },
  /* Cuenta bancaria: ya no se ofrece en la web (los pagos son con tarjeta). Queda anotada para pagos manuales. */
  bank: {
    titular: "EventosPDE",                  // nombre que se muestra en la tabla de depósito (vacío = no se muestra)
    banco:   "Itaú",
    tipo:    "",                            // vacío = no se muestra (Caja de ahorro)
    cuenta:  "2366010",
    moneda:  "USD",                         // "USD" o "UYU"
    uyuRate: 0                              // solo si moneda es "UYU": cotización del dólar (ej. 40)
  }
};

/* ============ 2. Categorías (nombre -> color) ============
   Los colores se mantienen; el nombre es lo que ve la gente en filtros, tarjetas y formulario. */
const CATS = {
  "Fiestas":        "#E0457B",   // todo tipo de fiesta, electrónica incluida
  "Música en vivo": "#22C7E8",   // conciertos y recitales
  "Náutica":        "#5B8CFF",   // regatas (Láser, Optimist, oceánicas)
  "Autos":          "#C98A00",   // desfiles de clásicos, karting
  "Deportes":       "#0E9A6B",   // maratones, polo
  "Festivales":     "#127C93",   // festivales culturales: cine y más
  "Gastronomía":    "#D4572A"    // encuentros de vino y cocina
};

/* ============ 2b. Lugares para el mapa ============
   Si el "place" de un evento contiene uno de estos nombres, su pin sale solo en el mapa (sin tildes ni mayúsculas).
   Van del más específico al más general: gana el primero que coincide. Un evento puede traer su propio geo: [lat, lng].
   Para sumar un lugar: buscalo en Google Maps, clic derecho > copiar las coordenadas y pegalas acá. */
const VENUES = {
  "Open Park":              [-34.91437, -54.87705],
  "Cipriani":               [-34.93720, -54.90950],
  "MACA":                   [-34.86629, -54.82137],
  "Arcana":                 [-34.86553, -54.82109],
  "Medellín Polo Club":     [-34.85094, -54.73056],
  "Narbona":                [-34.87146, -54.84897],
  "Ruta 104 km 3,5":        [-34.87101, -54.82682],
  "Parada 8":               [-34.94800, -54.92387],
  "El Bosque":              [-34.89009, -54.79437],
  "Yacht Club":             [-34.96428, -54.95002],
  "Sala Maldonado":         [-34.90687, -54.95672],
  "Soho":                   [-34.96535, -54.94998],
  "Artigas 652":            [-34.96518, -54.95040],
  "Centro de Convenciones": [-34.91949, -54.92151],
  "Playa Montoya":          [-34.91540, -54.84836],
  "The Grand Hotel":        [-34.94481, -54.92010],
  "Hotel del Lago":         [-34.85969, -55.05609],
  "OAK":                    [-34.91545, -54.85244]
};

/* ============ 2c. Alojamientos con convenio (catálogo de "Armar plan") ============
   Cada hotel, apart o casa con el que haya acuerdo aparece en plan.html para elegirlo, con su pin en el mapa y los minutos
   hasta los eventos de la persona. Vacío = no se muestra el catálogo (se pide zona, tipo y presupuesto y se cotiza a medida).
   id: nombre corto sin espacios · zone: una de las zonas de planner.js (Península, Playa Brava o Mansa, La Barra, Manantiales,
   José Ignacio, Maldonado) · type: Hotel, Apartamento o Casa · geo: [lat, lng] · photo: archivo en img/alojamientos/
   from: precio por noche desde (US$) · sleeps: hasta cuántas personas · perks: hasta 3 cosas cortas.
   Ejemplo:
   { id: "hotel-del-mar", name: "Hotel del Mar", zone: "La Barra", type: "Hotel", geo: [-34.9131, -54.8655],
     photo: "hotel-del-mar.webp", from: 180, sleeps: 4, perks: ["Desayuno", "Frente al mar", "Piscina"] } */
const STAYS = [];

/* ============ 2d. Traslados con chofer: precios para reservar y pagar al instante ============
   Los usan la página de cada evento ("Traslado con chofer") y Armar plan (cuando el pedido es solo de traslados).
   Precios en US$, con tu margen incluido, por tramo (un viaje en un sentido) y por auto de hasta 4 personas.
   ⚠ TIENEN QUE SER IGUALES a TARIFAS en apps-script/Code.gs: la web muestra el precio, pero el script es el que cobra.
   - tramos: [[hastaKm, precio], ...] según la distancia en auto desde la zona de la persona hasta el evento.
   - llegadas: aeropuerto, puerto o terminal ↔ alojamiento, por tramo (ids de ARRIVALS en planner.js).
   - grupo: de 5 a 8 personas va una camioneta, que cuesta el precio × grupo. Más de 8: una camioneta cada 8. */
/* En qué eventos se ofrece el traslado: solo los que tienen entradas a la venta (tickets) y son de estas categorías,
   donde la gente sale tarde y conviene no manejar. Un evento puntual se fuerza con traslado: true o se apaga con traslado: false. */
const RIDE_CATS = ["Fiestas", "Música en vivo"];
const TARIFAS = {
  tramos:   [[6, 20], [15, 30], [30, 45], [Infinity, 65]],
  llegadas: { pde: 50, mvd: 170, bqmvd: 180, bqcol: 320, bus: 20 },
  grupo:    1.5
};

/* ============ 3. Afiliados ============
   Para cobrar comisión por entradas: agregá la ticketera una sola vez acá y todos los eventos
   con `tickets` de ese dominio salen con tu código y marcados como "enlace de referido".
   Dominio sin "www".  param = nombre del parámetro, code = tu código.
   (Si la ticketera te da un link ya armado, pegalo en el evento y poné affiliate: true.) */
const AFFILIATES = {
  "tuticketera.com": { param: "ref", code: "eventospde" }   // EJEMPLO: reemplazar por una ticketera real
};

/* ============ 4. Planes y precios ============
   Se cobra POR DÍA publicado, y cada día extra sale más barato: cuanto más tiempo está online, menos se paga por día.
   tiers = [[hastaElDía, precioPorDía], ...]  (precios en US$, enteros)
   Ejemplo Básico: los días 1 y 2 salen US$ 6 c/u, los días 3 al 7 salen US$ 3 c/u, del 8 al 30 US$ 2 c/u y del 31 en adelante US$ 1.
   Los escalones se suman (nunca conviene que 7 días cuesten menos que 6): 1 día = 6, 7 días = 27, 30 días = 73.
   La Portada incluye todo lo del Básico, por eso su precio ya trae la publicación en la agenda.
   Cambiá los números de cada plan y la página recalcula todo sola (tarjetas, total y mensajes). */
const MAX_DAYS = 90;                 // tope de días por pedido

const PLANS = [
  { name: "Básico",
    tiers: [[2, 6], [7, 3], [30, 2], [Infinity, 1]],
    features: ["Publicación en su categoría", "Ordenada por fecha en la agenda", "Enlace a entradas o WhatsApp", "Desde 1 día: vos elegís cuánto tiempo"],
    blurb: "Para mostrar tu evento en la agenda" },
  { name: "Portada", popular: true,
    tiers: [[2, 30], [7, 12], [30, 8], [Infinity, 5]],
    features: ["Todo lo del plan Básico", "Lugar en el slider de portada, lo primero que se ve", "Foto grande de tu evento", "Cupos limitados: confirmamos antes del pago"],
    blurb: "Máxima visibilidad en Punta" }
];
