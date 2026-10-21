/* data.js · los eventos
   Es el archivo que se edita cada vez que se publica algo.
   Los eventos desaparecen solos después de su fecha (date, o endDate si dura varios días).

   ┌─ CAMPOS ────────────────────────────────────────────────────────────────────────────┐
   │ title      nombre del evento                                          (obligatorio) │
   │ cat        categoría: tiene que existir en CATS (config.js)           (obligatorio) │
   │ date       fecha "AAAA-MM-DD"                                         (obligatorio) │
   │ time       hora "22:00" o "A confirmar"                               (obligatorio) │
   │ place      lugar; arma solo el link a Google Maps                     (obligatorio) │
   │ desc       descripción corta (1 o 2 líneas)                           (obligatorio) │
   │ contact    botón de contacto: link de WhatsApp, Instagram o "mailto:..."            │
   │ tickets    link de entradas -> embed "Comprar entradas"                             │
   │ affiliate  true si el link de tickets ya es un link de afiliado tuyo                │
   │ link       otro link (web, programa, reservas) -> embed; solo si no hay tickets     │
   │ linkLabel  texto del embed de link, ej. "Ver programa" (por defecto "Más información")│
   │ map        link exacto de Google Maps (si no, se arma con place)                    │
   │ endDate    último día, si dura varios días                                          │
   │ photo      nombre del archivo en img/eventos/, ej. "solomun-open-park.webp"         │
   │            (fondo de la tarjeta y póster de la portada; sin foto: degradé de color)  │
   │ portada    true -> aparece en el slider de la portada (máx. 6, los más cercanos)   │
   │ from       primer día visible, "AAAA-MM-DD" (opcional; si no, se ve ya)             │
   │ until      último día visible = fin de las semanas pagadas (opcional)               │
   └─────────────────────────────────────────────────────────────────────────────────────┘

   SOLO PUNTA DEL ESTE: la agenda es local (Punta del Este, La Barra, Manantiales, José Ignacio,
   Maldonado). Los eventos de Montevideo u otras ciudades no se publican.
   FOTOS: nombre en minúsculas y con guiones, igual al evento: "artista-lugar.webp" (ej. adam-ten-polo-medellin.webp).
   PORTADA: el plan Portada = ponerle `portada: true` al evento. Sin eso solo sale en la agenda.
   Cada publicación muestra UN embed: primero entradas (tickets) y, si no hay, el link libre. */

const EV = [

  /* Fiestas: calendario de urubus.com.uy y ticketeras. Las horas y lugares marcados "A confirmar"
     se completan con cada organización antes de publicar. Categorías sin eventos: sumá los tuyos. */
  {
    title: "Solomun en Open Park",
    cat: "Fiestas", date: "2026-12-29", time: "23:59",
    place: "Open Park, El Placer (puente de La Barra)",
    desc: "Deep y tech house de Solomun en la carpa de Open Park: una de las fechas fuertes del cierre de 2026.",
    tickets: "https://allmusicparties.com/es/evento/solomun-en-open-park-punta-del-este",
    photo: "solomun-open-park.webp",
    portada: true
  },
  {
    title: "Black Coffee: Noche de Año Nuevo",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "Cipriani, Punta del Este",
    desc: "Black Coffee recibe el 2027 en Cipriani.",
    photo: "black-coffee-cipriani.webp",
    portada: true
  },
  {
    title: "Jamie Jones + Franky Rizardo",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "MACA, Punta del Este",
    desc: "Dos nombres de la escena house y tech house para despedir 2026 en MACA.",
    portada: true
  },
  {
    title: "Hot Since 82: NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "Polo Medellín, Punta del Este",
    desc: "Año Nuevo con Hot Since 82 en Polo Medellín.",
    photo: "hot-since-82-polo-medellin.webp",
    portada: true
  },
  {
    title: "Music On: Marco Carola & More",
    cat: "Fiestas", date: "2027-01-02", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Marco Carola trae Music On a Open Park para arrancar enero.",
    photo: "music-on-open-park.webp",
    portada: true
  },
  {
    title: "FOMO Fest",
    cat: "Fiestas", date: "2027-01-15", time: "16:00",
    place: "Open Park, El Placer",
    desc: "Festival electrónico de dos días en Open Park. El viernes abren puertas a las 16:00.",
    link: "https://www.technoairlines.com/festival/fomo-fest-punta-del-este-uruguay-2027", linkLabel: "Más información",
    endDate: "2027-01-16",
    portada: true
  },
  {
    title: "Adam Ten b2b Mita Gami",
    cat: "Fiestas", date: "2026-12-26", time: "A confirmar",
    place: "Polo Medellín, Punta del Este",
    desc: "Primera gran fecha del verano en Polo Medellín."
  },
  {
    title: "Nick Warren + Sébastien Léger",
    cat: "Fiestas", date: "2026-12-27", time: "A confirmar",
    place: "Narbona, La Barra",
    desc: "My Tribe en Narbona con progressive house."
  },
  {
    title: "Blavicio en Open Park",
    cat: "Fiestas", date: "2026-12-28", time: "23:59",
    place: "Open Park, El Placer",
    desc: "Primera fecha de Blavicio en Open Park esta temporada."
  },
  {
    title: "ANOTR en Cipriani",
    cat: "Fiestas", date: "2026-12-28", time: "A confirmar",
    place: "Cipriani, Punta del Este",
    desc: "ANOTR en una de las pistas más exclusivas de la costa."
  },
  {
    title: "Corona Sunset",
    cat: "Fiestas", date: "2026-12-30", time: "A confirmar",
    place: "Manantiales",
    desc: "Sunset con música frente al mar."
  },
  {
    title: "Artbat · Mind Against · Mellino",
    cat: "Fiestas", date: "2027-01-03", time: "A confirmar",
    place: "Narbona, La Barra",
    desc: "Tres nombres de melodic techno en una sola noche."
  },
  {
    title: "Adriatique en MACA",
    cat: "Fiestas", date: "2027-01-03", time: "16:00",
    place: "MACA, Punta del Este",
    desc: "El dúo suizo de melodic house y techno llega a MACA."
  },
  {
    title: "Miss Monique en Open Park",
    cat: "Fiestas", date: "2027-01-04", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Progressive y melodic techno con Miss Monique."
  },
  {
    title: "Chris Stussy en Open Park",
    cat: "Fiestas", date: "2027-01-09", time: "23:00",
    place: "Open Park, El Placer",
    desc: "House de Chris Stussy en la carpa de Open Park."
  },
  {
    title: "Festival Internacional de Jazz de Punta del Este",
    cat: "Música en vivo", date: "2027-01-04", time: "A confirmar",
    place: "Punta del Este",
    desc: "31.ª edición, declarada de interés nacional. Programación a confirmar.",
    endDate: "2027-01-11"
  },
  {
    title: "Rolex Circuito Atlántico Sur",
    cat: "Náutica", date: "2027-01-23", time: "A confirmar",
    place: "Yacht Club Punta del Este",
    desc: "Llega la flota desde Buenos Aires y siguen regatas hasta la Vuelta Gorriti del 29 de enero.",
    link: "https://rcas.org.ar/", linkLabel: "Ver calendario",
    endDate: "2027-01-29"
  },
  {
    title: "Festival de Cine de Punta del Este",
    cat: "Festivales", date: "2027-02-20", time: "A confirmar",
    place: "Maldonado y Punta del Este",
    desc: "29.ª edición, con funciones libres y gratuitas en salas de la zona.",
    endDate: "2027-02-26"
  },

  /* Cargados el 20/10 desde la lista de fiestas del equipo: solo se confirmó la fecha y el Instagram.
     Lugar y hora se completan con cada organizador. (Los eventos de Montevideo se sacaron: la agenda es solo PDE.) */
  {
    title: "Lo vi en Filosofía",
    cat: "Música en vivo", date: "2026-10-21", time: "21:00",
    place: "Box Garden, Punta del Este",
    desc: "Show en vivo de la banda de rock Lo vi en Filosofía.",
    photo: "lo-vi-en-filosofia.webp",
    portada: true
  },
  {
    title: "Sensation Punta del Este",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "Ruta 104 km 3,5, Punta del Este",
    map: "https://www.google.com/maps/search/?api=1&query=-34.870806,-54.819389",
    desc: "Fiesta de Año Nuevo para recibir el 2027.",
    contact: "https://instagram.com/sensation_pde",
    photo: "sensation-pde.webp",
    portada: true
  },
  {
    title: "Volvé Mi Negra",
    cat: "Fiestas", date: "2027-01-02", time: "23:59",
    place: "Punta del Este (a confirmar)",
    desc: "Noche de fiesta en Punta del Este. Lugar a confirmar.",
    contact: "https://instagram.com/volveminegra"
  },
  {
    title: "Argy",
    cat: "Fiestas", date: "2027-01-15", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Noche con Argy en Open Park.",
    contact: "https://instagram.com/argy"
  }
];
