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
   │ featured   true -> estilo platinado "Destacado"                                     │
   │ hot        true -> Hot topic de la portada (se muestra UNO solo)                    │
   │ hotUntil   último día en portada, "AAAA-MM-DD"                                      │
   │ from       primer día visible, "AAAA-MM-DD" (opcional; si no, se ve ya)             │
   │ until      último día visible = fin de las semanas pagadas (opcional)               │
   │ img        flyer del Hot topic, ej. "img/noche-fade.webp"                           │
   └─────────────────────────────────────────────────────────────────────────────────────┘

   CAMBIAR EL HOT TOPIC: sacale `hot` al evento anterior y ponelo en el nuevo (con hotUntil).
   Cada publicación muestra UN embed: primero entradas (tickets) y, si no hay, el link libre. */

const EV = [

  /* Fiestas: calendario de urubus.com.uy y ticketeras. Las horas y lugares marcados "A confirmar"
     se completan con cada organización antes de publicar. Categorías sin eventos: sumá los tuyos. */
  {
    title: "Solomun en Open Park",
    cat: "Fiestas", date: "2026-12-29", time: "A confirmar",
    place: "Open Park, El Placer (puente de La Barra)",
    desc: "Deep y tech house de Solomun en la carpa de Open Park: una de las fechas fuertes del cierre de 2026.",
    tickets: "https://allmusicparties.com/es/evento/solomun-en-open-park-punta-del-este",
    featured: true, hot: true, hotUntil: "2026-12-29"
  },
  {
    title: "Black Coffee: Noche de Año Nuevo",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "Cipriani, Punta del Este",
    desc: "Black Coffee recibe el 2027 en Cipriani.",
    featured: true
  },
  {
    title: "Jamie Jones + Franky Rizardo",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "MACA, Punta del Este",
    desc: "Dos nombres de la escena house y tech house para despedir 2026 en MACA.",
    featured: true
  },
  {
    title: "Hot Since 82: NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "Polo Medellín, Punta del Este",
    desc: "Año Nuevo con Hot Since 82 en Polo Medellín.",
    featured: true
  },
  {
    title: "Music On: Marco Carola & More",
    cat: "Fiestas", date: "2027-01-02", time: "A confirmar",
    place: "Open Park, El Placer",
    desc: "Marco Carola trae Music On a Open Park para arrancar enero.",
    featured: true
  },
  {
    title: "FOMO Fest",
    cat: "Fiestas", date: "2027-01-15", time: "16:00",
    place: "Open Park, El Placer",
    desc: "Festival electrónico de dos días en Open Park. El viernes abren puertas a las 16:00.",
    link: "https://www.technoairlines.com/festival/fomo-fest-punta-del-este-uruguay-2027", linkLabel: "Más información",
    endDate: "2027-01-16",
    featured: true
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
    cat: "Fiestas", date: "2026-12-28", time: "A confirmar",
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
    cat: "Fiestas", date: "2027-01-03", time: "A confirmar",
    place: "MACA, Punta del Este",
    desc: "El dúo suizo de melodic house y techno llega a MACA."
  },
  {
    title: "Miss Monique en Open Park",
    cat: "Fiestas", date: "2027-01-04", time: "A confirmar",
    place: "Open Park, El Placer",
    desc: "Progressive y melodic techno con Miss Monique."
  },
  {
    title: "Chris Stussy en Open Park",
    cat: "Fiestas", date: "2027-01-09", time: "A confirmar",
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

  /* Cargados el 20/10 desde la lista de fiestas del equipo (Dance & Night Club): solo se confirmaron fecha y
     Instagram. Lugar y hora se completan con cada organizador. El primero es un show del miércoles. */
  {
    title: "Lo vi en Filosofía",
    cat: "Música en vivo", date: "2026-10-21", time: "21:00",
    place: "Box Garden, Punta del Este",
    desc: "Show en vivo de la banda de rock Lo vi en Filosofía.",
    featured: true
  },
  {
    title: "Volvé Mi Negra",
    cat: "Fiestas", date: "2026-11-07", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Noche de fiesta en Punta del Este. Lugar y hora a confirmar.",
    contact: "https://instagram.com/volveminegra"
  },
  {
    title: "El Rancho Pub",
    cat: "Fiestas", date: "2026-11-14", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Noche en El Rancho Pub. Lugar y hora a confirmar.",
    contact: "https://instagram.com/elranchopub"
  },
  {
    title: "Pawsa",
    cat: "Fiestas", date: "2026-11-20", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Noche con Pawsa en Punta del Este. Lugar y hora a confirmar.",
    contact: "https://instagram.com/pawsaofficial"
  },
  {
    title: "Volvé Mi Negra",
    cat: "Fiestas", date: "2026-12-24", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Noche de fiesta en Punta del Este. Lugar y hora a confirmar.",
    contact: "https://instagram.com/volveminegra"
  },
  {
    title: "Sensation Punta del Este",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Fiesta de Año Nuevo para recibir el 2027. Lugar y hora a confirmar.",
    contact: "https://instagram.com/sensation_pde",
    featured: true
  },
  {
    title: "Volvé Mi Negra",
    cat: "Fiestas", date: "2027-01-02", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Noche de fiesta en Punta del Este. Lugar y hora a confirmar.",
    contact: "https://instagram.com/volveminegra"
  },
  {
    title: "Argy",
    cat: "Fiestas", date: "2027-01-15", time: "A confirmar",
    place: "Punta del Este (a confirmar)",
    desc: "Noche con Argy en Punta del Este. Lugar y hora a confirmar.",
    contact: "https://instagram.com/argy"
  }
];
