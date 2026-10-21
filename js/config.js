/* config.js · ajustes del sitio
   Se edita una sola vez: contacto, pagos, categorías, afiliados y planes.
   Los eventos se cargan aparte, en data.js. */

/* ============ 1. Contacto, pagos y analítica ============ */
const CONFIG = {
  whatsapp:  "59894717738",                 // tu WhatsApp con código de país, sin + ni espacios
  email:     "eventospde.uy@gmail.com",     // mail de contacto (pie de página, publicar y comprobantes)
  instagram: "eventos_pde",                 // usuario de Instagram, sin @
  ga:        "G-SC1Y8ZRB66",                // ID de Google Analytics 4. Sin ID no se carga nada.
  formUrl:   "https://script.google.com/macros/s/AKfycbw3bA6B-pJBWWmT8cY2v-Lf1zUcxGLNRvU6uYToSOMTkQf7eRKdO-oVnZnw9YQSQMFA/exec",                            // dirección de la aplicación web de Google (apps-script/Code.gs). Vacío = no se avisa solo
  paypal:    "TU_USUARIO_PAYPAL",           // lo que va después de paypal.me/
  /* Mercado Pago: un link de pago (creado en tu cuenta, monto fijo) por plan y cantidad de días.
     Los días son los de los botones rápidos del formulario. Link vacío = esa opción no se ofrece;
     si alguien elige otra cantidad de días, se le ofrece depósito o pedir el link por WhatsApp. */
  mercadopago: {
    "Básico":  { 1: "", 3: "", 7: "", 14: "", 30: "" },   // US$ 6 · 15 · 27 · 41 · 73
    "Portada": { 1: "", 3: "", 7: "", 14: "", 30: "" }    // US$ 30 · 72 · 120 · 176 · 304
  },
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
