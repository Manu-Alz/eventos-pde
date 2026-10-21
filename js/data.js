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
   │ until      último día visible = fin de los días pagados (opcional)                │
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
    desc: "Solomun, el DJ bosnio-alemán fundador del sello Diynamic y figura de Ibiza, llega a la carpa de Open Park con su deep y tech house melódico. Una de las noches más esperadas del cierre de 2026 en Punta del Este.",
    tickets: "https://allmusicparties.com/es/evento/solomun-en-open-park-punta-del-este",
    photo: "solomun-open-park.webp",
    portada: true
  },
  {
    title: "Black Coffee: Noche de Año Nuevo",
    cat: "Fiestas", date: "2026-12-31", time: "23:00",
    place: "Cipriani, Punta del Este",
    desc: "El sudafricano Black Coffee, ganador de un Grammy y referente del afro house, recibe el 2027 en Cipriani para la noche más larga del año, en una de las sedes más exclusivas de la costa.",
    photo: "black-coffee-cipriani.webp",
    portada: true
  },
  {
    title: "Jamie Jones + Franky Rizardo",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "MACA, Punta del Este",
    desc: "Jamie Jones, del sello Hot Creations y las fiestas Paradise de Ibiza, junto al holandés Franky Rizardo: house y tech house de pista para despedir 2026 en MACA. Hora a confirmar con la organización.",
    portada: true
  },
  {
    title: "Hot Since 82: NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "23:55",
    place: "Medellín Polo Club, Ruta 10 km 176 (Punta del Este)",
    desc: "Hot Since 82, el productor británico detrás de Knee Deep In Sound, encabeza el Año Nuevo en La Pista del Medellín Polo Club junto a Manu Desrets y Báez & Saint.",
    photo: "hot-since-82-polo-medellin.webp",
    portada: true
  },
  {
    title: "Music On: Marco Carola B2B Dennis Cruz",
    cat: "Fiestas", date: "2027-01-02", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Marco Carola, el DJ italiano fundador de Music On, toca b2b con Dennis Cruz en Open Park, con Mau P, Frank Storm y Anto Zagu. Tech house de pista para abrir enero con una de las marcas más reconocidas del club.",
    photo: "music-on-open-park.webp",
    portada: true
  },
  {
    title: "FOMO Fest",
    cat: "Fiestas", date: "2027-01-15", time: "16:00",
    place: "Open Park, El Placer",
    desc: "Festival de música electrónica de dos días en Open Park con Artbat, Boris Brejcha, Colyn, Innellea y Tale of Us: lo mejor del melodic techno y del high-tech minimal en un solo line-up. El viernes abren puertas a las 16:00.",
    link: "https://www.technoairlines.com/festival/fomo-fest-punta-del-este-uruguay-2027", linkLabel: "Más información",
    endDate: "2027-01-16",
    portada: true,
    photo: "fomo-fest-open-park.webp"
  },
  {
    title: "Adam Ten b2b Mita Gami",
    cat: "Fiestas", date: "2026-12-26", time: "A confirmar",
    place: "Medellín Polo Club, Ruta 10 km 176 (Punta del Este)",
    desc: "Adam Ten y Mita Gami, dos nombres de la escena house y tech house internacional, se juntan en un b2b para abrir la temporada en La Pista del Medellín Polo Club, con Facundo Mohrr y Mar Monzon en la previa.",
    photo: "adam-ten-polo-medellin.webp"
  },
  {
    title: "Nick Warren + Sébastien Léger",
    cat: "Fiestas", date: "2026-12-27", time: "19:00",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "My Tribe en Narbona Wine Lodge, desde las 19:00: Nick Warren, leyenda del progressive house británico (Way Out West), junto al francés Sébastien Léger, ffiña y Jero Rosella. Música para el atardecer y para seguir de largo.",
    photo: "nick-warren-narbona.webp"
  },
  {
    title: "Blavicio en Open Park",
    cat: "Fiestas", date: "2026-12-28", time: "23:59",
    place: "Open Park, El Placer",
    desc: "Primera fecha de Blavicio en Open Park esta temporada: una noche de música electrónica bajo la carpa de El Placer, junto al puente de La Barra. Entradas en Entraste; la grilla se confirma con la organización.",
    photo: "blavicio-open-park.webp"
  },
  {
    title: "ANOTR en Cipriani",
    cat: "Fiestas", date: "2026-12-28", time: "23:00",
    place: "Cipriani, Punta del Este",
    desc: "ANOTR, el dúo de house y techno melódico que llena pistas en todo el mundo, pasa por Cipriani en una de las sedes más exclusivas de Punta del Este.",
    photo: "anotr-cipriani.webp"
  },
  {
    title: "Corona Sunset",
    cat: "Fiestas", date: "2026-12-30", time: "A confirmar",
    place: "Manantiales",
    desc: "Atardecer con música frente al mar en Manantiales: música y la mejor hora de luz de la costa. Line-up y horario a confirmar.",
    photo: "corona-sunset-manantiales.webp"
  },
  {
    title: "Artbat · Mind Against · Mellino",
    cat: "Fiestas", date: "2027-01-03", time: "A confirmar",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "Tres nombres del melodic techno en una sola noche en Narbona Wine Lodge: Artbat, el dúo ucraniano que llena festivales en todo el mundo, Mind Against y Mellino. Hora a confirmar."
  },
  {
    title: "Adriatique en Arcana",
    cat: "Fiestas", date: "2027-01-03", time: "16:00",
    place: "Arcana, Museo Atchugarry, Ruta 104 km 4,5 (Manantiales)",
    desc: "Arcana Punta del Este en el Museo Atchugarry, con Adriatique, el dúo suizo de melodic house y techno detrás del sello Siamese, más NIM y Peter Guzman. Una tarde de música electrónica entre arte y escultura en Manantiales.",
    photo: "adriatique-arcana.webp"
  },
  {
    title: "Miss Monique y Juan Hansen en Open Park",
    cat: "Fiestas", date: "2027-01-04", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Miss Monique, la DJ ucraniana referente del progressive house y el melodic techno, comparte noche con Juan Hansen en la carpa de Open Park.",
    photo: "miss-monique-open-park.webp"
  },
  {
    title: "Blavicio en Open Park (2.ª fecha)",
    cat: "Fiestas", date: "2027-01-05", time: "23:59",
    place: "Open Park, El Placer",
    desc: "Segunda fecha de Blavicio en Open Park esta temporada, bajo la carpa de El Placer, junto al puente de La Barra. Entradas en Entraste.",
    photo: "blavicio-open-park.webp"
  },
  {
    title: "Chris Stussy en Open Park",
    cat: "Fiestas", date: "2027-01-09", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Chris Stussy, el productor holandés del sello Up The Stuss, trae su house cálido y de groove a Open Park. Una noche de enero para bailar.",
    photo: "chris-stussy-open-park.webp"
  },
  {
    title: "Colyn en Playa Brava",
    cat: "Fiestas", date: "2026-12-27", time: "21:00",
    place: "Roll & Rock Beach House, Parada 8, Playa Brava",
    desc: "Colyn, uno de los nombres que más suena en el melodic techno actual, toca frente al mar en Roll & Rock Beach House (Parada 8, Playa Brava) junto a Belu Clavero y BIØY. Música al aire libre desde las 21:00.",
    photo: "colyn-playa-brava.webp"
  },
  {
    title: "Summer Tale: Pico Bussoli + BNN",
    cat: "Fiestas", date: "2026-12-28", time: "23:50",
    place: "El Bosque, Balneario Buenos Aires",
    desc: "Summer Tale en El Bosque de Balneario Buenos Aires, con Pico Bussoli y BNN: una fiesta entre árboles, a pocos minutos de La Barra, con house y techno melódico.",
    photo: "pico-bussoli-el-bosque.webp"
  },
  {
    title: "Pasan Cosas en Narbona",
    cat: "Fiestas", date: "2026-12-29", time: "19:00",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "My Tribe presenta Pasan Cosas en Narbona Wine Lodge: una tarde-noche de música electrónica entre viñedos, desde las 19:00.",
    photo: "pasan-cosas-narbona.webp"
  },
  {
    title: "Tommy Muñoz + Puli Demaria + Ale Schultz",
    cat: "Fiestas", date: "2026-12-31", time: "22:00",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "Fin de año en Narbona Wine Lodge con tres nombres de la escena local y regional: Tommy Muñoz, Puli Demaria y Ale Schultz. Arranca a las 22:00 para brindar con música.",
    photo: "tommy-munoz-narbona.webp"
  },
  {
    title: "Michael Bibi en Narbona",
    cat: "Fiestas", date: "2027-01-02", time: "18:00",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "Michael Bibi, productor británico del sello Solid Grooves, trae su tech house de pista a Narbona Wine Lodge. Desde las 18:00, con la luz de la tarde de enero.",
    photo: "michael-bibi-narbona.webp"
  },
  {
    title: "You Are My Tribe",
    cat: "Fiestas", date: "2027-01-08", time: "19:00",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "My Tribe vuelve a Narbona Wine Lodge con una nueva fecha de la serie: música electrónica y tarde al aire libre desde las 19:00. Line-up a confirmar.",
    photo: "you-are-my-tribe-narbona.webp"
  },
  {
    title: "Festival Internacional de Jazz de Punta del Este",
    cat: "Música en vivo", date: "2027-01-04", time: "A confirmar",
    place: "Punta del Este",
    desc: "31.ª edición del Festival Internacional de Jazz de Punta del Este, declarada de interés nacional: una semana de conciertos en la ciudad. Programación y horarios a confirmar.",
    endDate: "2027-01-11"
  },
  {
    title: "Rolex Circuito Atlántico Sur",
    cat: "Náutica", date: "2027-01-23", time: "A confirmar",
    place: "Yacht Club Punta del Este",
    desc: "El clásico de la vela rioplatense: la flota llega desde Buenos Aires al Yacht Club Punta del Este y compite en regatas hasta la Vuelta Gorriti del 29 de enero.",
    link: "https://rcas.org.ar/", linkLabel: "Ver calendario",
    endDate: "2027-01-29"
  },
  {
    title: "Festival de Cine de Punta del Este",
    cat: "Festivales", date: "2027-02-20", time: "A confirmar",
    place: "Maldonado y Punta del Este",
    desc: "29.ª edición del festival de cine de la ciudad, con funciones libres y gratuitas en Sala Cantegril, el Teatro Margarita Xirgú y Grupocine. Del 20 al 26 de febrero.",
    endDate: "2027-02-26"
  },

  /* Cargados el 20/10 desde la lista de fiestas del equipo: solo se confirmó la fecha y el Instagram.
     Lugar y hora se completan con cada organizador. (Los eventos de Montevideo se sacaron: la agenda es solo PDE.) */
  {
    title: "Lo vi en Filosofía",
    cat: "Música en vivo", date: "2026-10-21", time: "21:00",
    place: "Box Garden, Punta del Este",
    desc: "Show en vivo de la banda de rock Lo vi en Filosofía en Box Garden. Una noche de música en vivo para arrancar la temporada, a las 21:00.",
    photo: "lo-vi-en-filosofia.webp",
    portada: true
  },
  {
    title: "Sensation Punta del Este",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "Ruta 104 km 3,5, Punta del Este",
    map: "https://www.google.com/maps/search/?api=1&query=-34.870806,-54.819389",
    desc: "Sensation, la fiesta que nació en Ámsterdam y se hizo famosa por su producción y su código de vestimenta, recibe el 2027 en Ruta 104 km 3,5. Seguí su Instagram para entradas y novedades.",
    contact: "https://instagram.com/sensation_pde",
    photo: "sensation-pde.webp",
    portada: true
  },
  {
    title: "Volvé Mi Negra",
    cat: "Fiestas", date: "2027-01-02", time: "23:59",
    place: "Punta del Este (a confirmar)",
    desc: "Volvé Mi Negra, sábado 2 de enero: noche de fiesta en Punta del Este. Lugar y hora a confirmar con la organización; seguí su Instagram.",
    contact: "https://instagram.com/volveminegra",
    photo: "volve-mi-negra-pde.webp"
  },
  {
    title: "Argy",
    cat: "Fiestas", date: "2027-01-15", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Argy en Open Park: una noche de música electrónica bajo la carpa de El Placer, junto al puente de La Barra.",
    contact: "https://instagram.com/argy",
    photo: "argy-open-park.webp"
  }
];
