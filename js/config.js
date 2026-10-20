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
  bank: {
    titular: "",                            // vacío = no se muestra en la tabla de depósito (Manuel Alzugaray)
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

/* ============ 4. Planes de publicación ============
   Los precios son POR SEMANA: quien quiere más tiempo elige más semanas en el formulario y paga price x semanas. */
const PLANS = [
  { name: "Básico",    price: 25,  features: ["Publicación en su categoría", "Visible durante la semana contratada"],
    blurb: "Para empezar a mostrar tu evento" },
  { name: "Destacado", price: 60,  popular: true,
    features: ["Insignia “Destacado”", "Arriba en su categoría", "Enlace a entradas o WhatsApp"],
    blurb: "Ideal para eventos que quieren llenar" },
  { name: "Portada",   price: 120,
    features: ["Un lugar único en la portada (Hot topic)", "Todo lo del plan Destacado", "Confirmamos la fecha antes del pago"],
    blurb: "Máxima visibilidad en Punta" }
];
