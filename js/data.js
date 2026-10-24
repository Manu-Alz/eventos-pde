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
   │ price      precio de referencia, ej. "Desde USD 40" (sale en su página)             │
   │ link       otro link (web, programa, reservas) -> embed; solo si no hay tickets     │
   │ linkLabel  texto del embed de link, ej. "Ver programa" (por defecto "Más información")│
   │ map        link exacto de Google Maps (si no, se arma con place)                    │
   │ geo        [latitud, longitud] para el mapa. Si el lugar está en VENUES (config.js) │
   │            no hace falta: el pin sale solo                                          │
   │ endDate    último día, si dura varios días                                          │
   │ photo      nombre del archivo en img/eventos/, ej. "solomun-open-park.webp"         │
   │            (fondo de la tarjeta y póster de la portada; sin foto: degradé de color)  │
   │ portada    true -> aparece en el slider de la portada (máx. 6, los más cercanos)   │
   │ traslado   true/false: fuerza o apaga el "Traslado con chofer". Sin este campo sale   │
   │            solo en Fiestas y Música en vivo con tickets (RIDE_CATS, config.js)     │
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
    tickets: "https://app.entraste.com/events/solomun-pde-2026", price: "Desde USD 120",
    photo: "solomun-open-park.webp",
    portada: true
  },
  {
    title: "Black Coffee: Noche de Año Nuevo",
    cat: "Fiestas", date: "2026-12-31", time: "23:00",
    place: "Cipriani, Punta del Este",
    tickets: "https://get-in.com/en/ciprianinye31",
    desc: "El sudafricano Black Coffee, ganador de un Grammy y referente del afro house, recibe el 2027 en Cipriani para la noche más larga del año, en una de las sedes más exclusivas de la costa.",
    photo: "black-coffee-cipriani.webp",
    portada: true
  },
  {
    title: "Jamie Jones + Franky Rizardo",
    cat: "Fiestas", date: "2026-12-31", time: "A confirmar",
    place: "MACA, Punta del Este",
    desc: "Jamie Jones, del sello Hot Creations y las fiestas Paradise de Ibiza, junto al holandés Franky Rizardo: house y tech house de pista para despedir 2026 en MACA. Hora a confirmar con la organización.",
    portada: true,
    photo: "jamie-jones-franky-rizardo-maca.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Hot Since 82: NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "23:55",
    place: "Medellín Polo Club, Ruta 10 km 176 (Punta del Este)",
    tickets: "https://venti.live/evento/hot-since-82-NYE-la-finca-%26-fragment",
    desc: "Hot Since 82, el productor británico detrás de Knee Deep In Sound, encabeza el Año Nuevo en La Pista del Medellín Polo Club junto a Manu Desrets y Báez & Saint.",
    photo: "hot-since-82-polo-medellin.webp",
    portada: true
  },
  {
    title: "Music On: Marco Carola B2B Dennis Cruz",
    cat: "Fiestas", date: "2027-01-02", time: "23:00",
    place: "Open Park, El Placer",
    desc: "Marco Carola, el DJ italiano fundador de Music On, toca b2b con Dennis Cruz en Open Park, con Mau P, Frank Storm y Anto Zagu. Tech house de pista para abrir enero con una de las marcas más reconocidas del club.",
    tickets: "https://entraste.com/evento/music-on-pde-2027", price: "Desde USD 65",
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
    cat: "Fiestas", date: "2026-12-26", time: "23:00",
    place: "Medellín Polo Club, Ruta 10 km 176 (Punta del Este)",
    desc: "Adam Ten y Mita Gami, dos nombres de la escena house y tech house internacional, se juntan en un b2b para abrir la temporada en La Pista del Medellín Polo Club, con Facundo Mohrr y Mar Monzon en la previa.",
    tickets: "https://redtickets.uy/evento/PM-Pres-ADAM-TEN-b2b-MITA-GAMI/33628/", price: "Desde $ 2.520",
    photo: "adam-ten-polo-medellin.webp"
  },
  {
    title: "Nick Warren + Sébastien Léger",
    cat: "Fiestas", date: "2026-12-27", time: "19:00",
    place: "Narbona Wine Lodge, Punta del Este",
    tickets: "https://venti.live/evento/MY-TRIBE-Opening-You-Are-My-Tribe",
    desc: "My Tribe en Narbona Wine Lodge, desde las 19:00: Nick Warren, leyenda del progressive house británico (Way Out West), junto al francés Sébastien Léger, ffiña y Jero Rosella. Música para el atardecer y para seguir de largo.",
    photo: "nick-warren-narbona.webp"
  },
  {
    title: "Blavicio en Open Park",
    cat: "Fiestas", date: "2026-12-28", time: "23:59",
    place: "Open Park, El Placer",
    desc: "Primera fecha de Blavicio en Open Park esta temporada: una noche de música electrónica bajo la carpa de El Placer, junto al puente de La Barra. Entradas en Entraste; la grilla se confirma con la organización.",
    tickets: "https://app.entraste.com/events/blavicio-1st-chapter-at-open-park", price: "Desde USD 40",
    photo: "blavicio-open-park.webp"
  },
  {
    title: "ANOTR en Cipriani",
    cat: "Fiestas", date: "2026-12-28", time: "23:00",
    place: "Cipriani, Punta del Este",
    tickets: "https://get-in.com/en/ciprianinye28",
    desc: "ANOTR, el dúo de house y techno melódico que llena pistas en todo el mundo, pasa por Cipriani en una de las sedes más exclusivas de Punta del Este.",
    photo: "anotr-cipriani.webp"
  },
  {
    title: "Corona Sunset",
    cat: "Fiestas", date: "2026-12-30", time: "18:00",
    place: "Ruta 104 km 3,5, Manantiales",
    desc: "Corona Sunset vuelve a Manantiales: música al atardecer desde las 18:00, con la mejor hora de luz de la costa. Line-up a confirmar.",
    tickets: "https://app.entraste.com/events/corona-sunset", price: "Desde USD 45",
    photo: "corona-sunset-manantiales.webp"
  },
  {
    title: "Artbat · Mind Against · Mellino",
    cat: "Fiestas", date: "2027-01-03", time: "A confirmar",
    place: "Narbona Wine Lodge, Punta del Este",
    tickets: "https://venti.live/evento/artbat-mind-against-mariano-mellino-x-endless-sound",
    desc: "Tres nombres del melodic techno en una sola noche en Narbona Wine Lodge: Artbat, el dúo ucraniano que llena festivales en todo el mundo, Mind Against y Mellino. Hora a confirmar.",
    photo: "artbat-mind-against-mellino.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Adriatique en Arcana",
    cat: "Fiestas", date: "2027-01-03", time: "16:00",
    place: "Arcana, Museo Atchugarry, Ruta 104 km 4,5 (Manantiales)",
    tickets: "https://venti.live/evento/arcana-experience-3-de-enero-en-punta-del-este",
    desc: "Arcana Punta del Este en el Museo Atchugarry, con Adriatique, el dúo suizo de melodic house y techno detrás del sello Siamese, más NIM y Peter Guzman. Una tarde de música electrónica entre arte y escultura en Manantiales.",
    photo: "adriatique-arcana.webp"
  },
  {
    title: "Miss Monique y Juan Hansen en Open Park",
    cat: "Fiestas", date: "2027-01-04", time: "23:00",
    place: "Open Park, El Placer",
    tickets: "https://app.entraste.com/events/miss-monique-pde-2027", price: "Desde USD 50",
    desc: "Miss Monique, la DJ ucraniana referente del progressive house y el melodic techno, comparte noche con Juan Hansen en la carpa de Open Park.",
    photo: "miss-monique-open-park.webp"
  },
  {
    title: "Blavicio en Open Park (2.ª fecha)",
    cat: "Fiestas", date: "2027-01-05", time: "23:59",
    place: "Open Park, El Placer",
    tickets: "https://app.entraste.com/events/blavicio-5-de-enero", price: "Desde USD 60",
    desc: "Segunda fecha de Blavicio en Open Park esta temporada, bajo la carpa de El Placer, junto al puente de La Barra. Entradas en Entraste.",
    photo: "blavicio-open-park.webp"
  },
  {
    title: "Chris Stussy en Open Park",
    cat: "Fiestas", date: "2027-01-09", time: "23:00",
    place: "Open Park, El Placer",
    tickets: "https://app.entraste.com/events/key-presenta-chris-stassy", price: "Desde USD 30",
    desc: "Chris Stussy, el productor holandés del sello Up The Stuss, trae su house cálido y de groove a Open Park. Una noche de enero para bailar.",
    photo: "chris-stussy-open-park.webp"
  },
  {
    title: "Colyn en Playa Brava",
    cat: "Fiestas", date: "2026-12-27", time: "21:00",
    place: "Roll & Rock Beach House, Parada 8, Playa Brava",
    tickets: "https://venti.live/evento/colyn-27-de-diciembre-en-pde",
    desc: "Colyn, uno de los nombres que más suena en el melodic techno actual, toca frente al mar en Roll & Rock Beach House (Parada 8, Playa Brava) junto a Belu Clavero y BIØY. Música al aire libre desde las 21:00.",
    photo: "colyn-playa-brava.webp"
  },
  {
    title: "Summer Tale: Pico Bussoli + BNN",
    cat: "Fiestas", date: "2026-12-28", time: "23:50",
    place: "El Bosque, Balneario Buenos Aires",
    tickets: "https://www.passline.com/eventos/bnn-pde-2812-uruguay",
    desc: "Summer Tale en El Bosque de Balneario Buenos Aires, con Pico Bussoli y BNN: una fiesta entre árboles, a pocos minutos de La Barra, con house y techno melódico.",
    photo: "pico-bussoli-el-bosque.webp"
  },
  {
    title: "Pasan Cosas en Narbona",
    cat: "Fiestas", date: "2026-12-29", time: "19:00",
    place: "Narbona Wine Lodge, Punta del Este",
    tickets: "https://venti.live/evento/MY-TRIBE-Pasan-Cosas",
    desc: "My Tribe presenta Pasan Cosas en Narbona Wine Lodge: una tarde-noche de música electrónica entre viñedos, desde las 19:00.",
    photo: "pasan-cosas-narbona.webp"
  },
  {
    title: "Tommy Muñoz + Puli Demaria + Ale Schultz",
    cat: "Fiestas", date: "2026-12-31", time: "23:55",
    place: "Narbona Wine Lodge, Punta del Este",
    desc: "LA TM New Year's Eve en Narbona Wine Lodge con tres nombres de la escena local y regional: Tommy Muñoz, Puli Demaria y Ale Schultz. Hay entradas generales y VIP con open bar.",
    tickets: "https://www.passline.com/eventos/la-tm-new-years-eve-pde-narbona-3112", price: "Desde $ 3.280",
    photo: "tommy-munoz-narbona.webp"
  },
  {
    title: "Michael Bibi en Narbona",
    cat: "Fiestas", date: "2027-01-02", time: "18:00",
    place: "Narbona Wine Lodge, Punta del Este",
    tickets: "https://www.passline.com/eventos/sabado-201-michael-bibi",
    desc: "Michael Bibi, productor británico del sello Solid Grooves, trae su tech house de pista a Narbona Wine Lodge. Desde las 18:00, con la luz de la tarde de enero.",
    photo: "michael-bibi-narbona.webp"
  },
  {
    title: "You Are My Tribe",
    cat: "Fiestas", date: "2027-01-08", time: "19:00",
    place: "Narbona Wine Lodge, Punta del Este",
    tickets: "https://venti.live/evento/MY-TRIBE-Closing-you-are-my-tribe-closing",
    desc: "My Tribe vuelve a Narbona Wine Lodge con una nueva fecha de la serie: música electrónica y tarde al aire libre desde las 19:00. Line-up a confirmar.",
    photo: "you-are-my-tribe-narbona.webp"
  },
  {
    title: "Festival Internacional de Jazz de Punta del Este",
    cat: "Música en vivo", date: "2027-01-04", time: "A confirmar",
    place: "Punta del Este",
    desc: "31.ª edición del Festival Internacional de Jazz de Punta del Este, declarada de interés nacional: una semana de conciertos en la ciudad. Programación y horarios a confirmar.",
    endDate: "2027-01-11",
    photo: "festival-jazz-punta-del-este.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Rolex Circuito Atlántico Sur",
    cat: "Náutica", date: "2027-01-23", time: "A confirmar",
    place: "Yacht Club Punta del Este",
    desc: "El clásico de la vela rioplatense: la flota llega desde Buenos Aires al Yacht Club Punta del Este y compite en regatas hasta la Vuelta Gorriti del 29 de enero.",
    link: "https://rcas.org.ar/", linkLabel: "Ver calendario",
    endDate: "2027-01-29",
    photo: "rolex-circuito-atlantico-sur.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Festival de Cine de Punta del Este",
    cat: "Festivales", date: "2027-02-20", time: "A confirmar",
    place: "Maldonado y Punta del Este",
    desc: "29.ª edición del festival de cine de la ciudad, con funciones libres y gratuitas en Sala Cantegril, el Teatro Margarita Xirgú y Grupocine. Del 20 al 26 de febrero.",
    endDate: "2027-02-26",
    photo: "festival-cine-punta-del-este.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },

  /* Cargados el 23/10 (fuentes: fuk.uy, Cadena del Mar, conciertosdeleste.org.uy y calendarios de inscripción del IRONMAN) */
  {
    title: "Gran Premio Punta del Este de Karting",
    cat: "Autos", date: "2026-10-30", time: "A confirmar",
    place: "Estacionamiento de Los Dedos, Parada 1 de Playa Brava",
    desc: "4.ª edición del Gran Premio en un circuito armado en el estacionamiento de Los Dedos (La Mano): 8.ª fecha del Campeonato Nacional de la Federación Uruguaya de Karting y cierre del Torneo Clausura, con pilotos de todas las categorías.",
    link: "https://fuk.uy/", linkLabel: "Ver en la Federación",
    geo: [-34.95727, -54.93828],   // estacionamiento junto a La Mano (Los Dedos), sobre la rambla de Playa Brava
    map: "https://www.google.com/maps/search/?api=1&query=-34.95727,-54.93828",
    endDate: "2026-11-01",
    photo: "gran-premio-karting-punta-del-este.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "12 Violoncellos de Buenos Aires",
    cat: "Música en vivo", date: "2026-10-31", time: "19:30",
    place: "Grand Center, The Grand Hotel, Punta del Este",
    desc: "Doce violonchelistas de Buenos Aires en concierto, dentro de la temporada de Conciertos del Este. Entradas remanentes por mail o desde una hora antes en sala.",
    link: "https://www.conciertosdeleste.org.uy/", linkLabel: "Ver temporada",
    contact: "mailto:conciertosdeleste@gmail.com",
    photo: "12-violoncellos-grand-hotel.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Callas Trio en Conciertos del Este",
    cat: "Música en vivo", date: "2026-11-14", time: "19:30",
    place: "Hotel del Lago Golf & Art Resort, Punta del Este",
    desc: "El trío austríaco de violín, chelo y piano cierra la temporada 2026 de Conciertos del Este. Entradas remanentes por mail o desde una hora antes en sala.",
    link: "https://www.conciertosdeleste.org.uy/", linkLabel: "Ver temporada",
    contact: "mailto:conciertosdeleste@gmail.com",
    photo: "callas-trio-hotel-del-lago.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "IRONMAN 70.3 Punta del Este",
    cat: "Deportes", date: "2027-03-07", time: "07:00",
    place: "Rambla de Playa Mansa (Parada 3), Punta del Este",
    geo: [-34.95714, -54.94091],   // largada y transición frente al muelle de la Parada 3; llegada junto a la Liga de Fomento (edición 2025)
    desc: "1,9 km de natación, 90 km de bici y 21 km de carrera por la costa de Punta del Este: la fecha sudamericana del circuito mundial de triatlón, con atletas de toda la región.",
    link: "https://www.ironman.com/races/im703-punta-del-este", linkLabel: "Inscripciones y programa",
    photo: "ironman-punta-del-este.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
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
    title: "The 30 Limones Experience",
    cat: "Fiestas", date: "2026-10-24", time: "A confirmar",
    place: "Mía Bistró, Punta del Este",
    desc: "30 Limones en Mía Bistró, frente al mar: sabores mediterráneos, arte, instrumentos en vivo y percusión, con el house de Tommy de los Santos y Primitivo. Mesas con reserva por Instagram.",
    contact: "https://instagram.com/30limones",
    photo: "30-limones-mia-bistro.webp"
  },
  {
    title: "2Fancy: Halloween Edition",
    cat: "Fiestas", date: "2026-10-31", time: "23:59",
    place: "OAK, Punta del Este",
    desc: "Fiesta 2Fancy en su edición de Halloween: sábado 31 de octubre en OAK, Punta del Este. Entradas en CobraTicket, con promo 3x2.",
    tickets: "https://cobraticket.uy/e/halloween-en-2fancy-361398", price: "Desde $ 466",
    photo: "2fancy-oak.webp"
  },
  {
    title: "Sensation Punta del Este",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "Ruta 104 km 3,5, Punta del Este",
    map: "https://www.google.com/maps/search/?api=1&query=-34.870806,-54.819389",
    desc: "Sensation, la fiesta que nació en Ámsterdam y se hizo famosa por su producción y su código de vestimenta, recibe el 2027 en Ruta 104 km 3,5. Entradas en Entraste; seguí su Instagram para novedades.",
    tickets: "https://app.entraste.com/events/sensation-new-years-eve", price: "Desde USD 130",
    contact: "https://instagram.com/sensation_pde",
    photo: "sensation-pde.webp",
    portada: true
  },
  {
    title: "Volvé Mi Negra",
    cat: "Fiestas", date: "2027-01-02", time: "23:59",
    place: "El Bosque, Ruta 10 km 169",
    tickets: "https://app.entraste.com/events/volve-mi-negra-pde-0201", price: "Desde USD 25",
    desc: "Volvé Mi Negra, sábado 2 de enero en El Bosque (Ruta 10 km 169): noche de fiesta de verano en Punta del Este. Entradas en Entraste.",
    contact: "https://instagram.com/volveminegra",
    photo: "volve-mi-negra-pde.webp"
  },
  {
    title: "Argy",
    cat: "Fiestas", date: "2027-01-15", time: "23:00",
    place: "Open Park, El Placer",
    tickets: "https://app.entraste.com/events/key-presenta-argy", price: "Desde USD 35",
    desc: "Argy en Open Park: una noche de música electrónica bajo la carpa de El Placer, junto al puente de La Barra.",
    contact: "https://instagram.com/argy",
    photo: "argy-open-park.webp"
  },

  /* Cargados el 22/10 desde las ticketeras (vía quejoda.uy/punta-del-este): fecha, hora, lugar y precio de referencia. */
  {
    title: "Cumbiancha: La cumbia nunca muere",
    cat: "Fiestas", date: "2026-10-23", time: "22:00",
    place: "Sala Maldonado, Maldonado",
    desc: "Noche de cumbia en Sala Maldonado: Cumbiancha y su fiesta \"La cumbia nunca muere\". Entrada con y sin límite de horario.",
    tickets: "https://www.passline.com/eventos/cumbiancha-la-cumbia-nunca-muere", price: "Desde $ 390",
    photo: "cumbiancha-sala-maldonado.webp"
  },
  {
    title: "MITIC en Soho",
    cat: "Fiestas", date: "2026-10-24", time: "23:59",
    place: "Soho, Rambla General Artigas, Punta del Este",
    desc: "MITIC llega a Soho, sobre la rambla de Punta del Este, con el español Sampol y Enzo en las bandejas.",
    tickets: "https://redtickets.uy/evento/MITIC--SOHO--24-DE-OCTUBRE/34171/", price: "Desde $ 500",
    photo: "mitic-soho.webp"
  },
  {
    title: "Mala Maldonado: Halloween",
    cat: "Fiestas", date: "2026-10-31", time: "23:55",
    place: "Sala Maldonado, Maldonado",
    desc: "Mala Maldonado festeja Halloween en Sala Maldonado: noche de disfraces y fiesta en la previa de la temporada.",
    tickets: "https://www.passline.com/eventos/mala-maldonado-halloween", price: "Desde $ 500",
    photo: "mala-sala-maldonado.webp"
  },
  {
    title: "Lokeo del Terror",
    cat: "Fiestas", date: "2026-10-31", time: "23:59",
    place: "Rambla General Artigas 652, Punta del Este",
    desc: "Lokeo vuelve con su edición de Halloween, el Lokeo del Terror, sobre la rambla de Punta del Este.",
    tickets: "https://cobraticket.uy/e/lokeo-del-terror-778506", price: "Desde $ 350",
    photo: "lokeo-del-terror-pde.webp"
  },
  {
    title: "Custom by Coco Club",
    cat: "Fiestas", date: "2026-12-29", time: "23:55",
    place: "Centro de Convenciones de Punta del Este",
    desc: "Custom, de Coco Club, desembarca en el Centro de Convenciones de Punta del Este en la semana más fuerte de la temporada. Hay entradas generales y VIP Standing (+20).",
    tickets: "https://redtickets.uy/evento/CUSTOM-by-Coco-Club--PDE/34409/", price: "Desde USD 35",
    photo: "custom-centro-convenciones.webp"
  },
  {
    title: "Montoya New Year's Eve",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "Playa Montoya, La Barra",
    desc: "Fin de año frente al mar en Playa Montoya, La Barra, con open bar para recibir el 2027.",
    tickets: "https://redtickets.uy/evento/MONTOYA-NYE/34168/", price: "Desde USD 110",
    photo: "montoya-nye-playa-montoya.webp"
  },
  {
    title: "Box NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "La Barra, Punta del Este",
    desc: "Box recibe el 2027 en La Barra con open bar. Hay entradas generales y VIP Standing.",
    tickets: "https://app.entraste.com/events/box-nye-2027", price: "Desde USD 130",
    photo: "box-nye-la-barra.webp"
  },
  {
    title: "Fantasy NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "Open Park, El Placer",
    desc: "Fantasy, la fiesta de Año Nuevo de Open Park, con open bar junto al puente de La Barra. Organizan About, Blackout, Kabûl y Brothers.",
    tickets: "https://app.entraste.com/events/fantasy-nye-2027", price: "Desde USD 110",
    photo: "fantasy-nye-open-park.webp"
  },
  {
    title: "El Templo: NYE 2027",
    cat: "Fiestas", date: "2026-12-31", time: "23:59",
    place: "El Bosque, Ruta 10 km 169",
    desc: "El Templo recibe el 2027 en El Bosque con dos escenarios, el Commercial Stage y el Humanos Stage. Para mayores de 30, con entradas generales, VIP y opción con consumo incluido.",
    tickets: "https://app.entraste.com/events/el-templo-nye-2027", price: "Desde USD 120",
    photo: "el-templo-nye-el-bosque.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Palito Bombón",
    cat: "Fiestas", date: "2026-12-29", time: "23:59",
    place: "Ruta 104 km 3,5, Manantiales",
    desc: "Palito Bombón, el martes 29 de diciembre en Ruta 104 km 3,5. Sector general para mayores de 23 y VIP Standing para mayores de 25.",
    tickets: "https://app.entraste.com/events/palito-bombon", price: "Desde USD 30",
    photo: "palito-bombon-ruta-104.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Lovers",
    cat: "Fiestas", date: "2027-01-02", time: "23:59",
    place: "Ruta 104 km 3,5, Manantiales",
    desc: "Lovers, el sábado 2 de enero en Ruta 104 km 3,5. Sector general para mayores de 21 y VIP Standing para mayores de 24.",
    tickets: "https://app.entraste.com/events/lovers", price: "Desde USD 40",
    photo: "lovers-ruta-104.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Arde By JW 2027",
    cat: "Fiestas", date: "2027-01-03", time: "23:59",
    place: "Open Park, El Placer",
    desc: "Arde By JW vuelve a Open Park el domingo 3 de enero, bajo la carpa de El Placer, junto al puente de La Barra. Hay sector general, VIP Standing (mayores de 22) y Backstage (mayores de 25).",
    tickets: "https://app.entraste.com/events/arde-by-jw-2027", price: "Desde USD 60",
    photo: "arde-by-jw-open-park.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Franky Rizardo: Flow en Polo Medellín",
    cat: "Fiestas", date: "2027-01-03", time: "22:00",
    place: "Medellín Polo Club, Ruta 10 km 176 (Punta del Este)",
    desc: "Flow, la marca del DJ holandés Franky Rizardo, llega por primera vez a Punta del Este, en La Pista de Medellín. Suma residencias en Fabric London y Pacha Ibiza y escenario propio en Tomorrowland. Ingreso hasta las 4:00, solo mayores de 18.",
    tickets: "https://venti.live/evento/PM-Pres-LISTEN-TO-FLOW-FRANKY-RIZARDO", price: "Desde USD 75",
    photo: "franky-rizardo-polo-medellin.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "La Fiesta Punta: Réveillon 2027",
    cat: "Fiestas", date: "2026-12-31", time: "22:00",
    place: "Tommy Bistró, Hotel Tío Tom, Ruta Interbalnearia km 115,5 (Solanas)",
    desc: "Réveillon frente al mar en Solanas, con open bar, open food y fuegos artificiales, de 22:00 a 5:30. Se recomienda ir de blanco. Las entradas son para mayores de 18; los chicos de 7 a 17 entran con sus padres hasta las 00:30.",
    tickets: "https://redtickets.uy/evento/La-Fiesta-Punta-2027/33292/",
    photo: "la-fiesta-punta-solanas.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "Épica Gravel 2026",
    cat: "Deportes", date: "2026-11-21", time: "07:00",
    place: "Laguna del Sauce, Punta del Este",
    desc: "Cuarta edición de la Épica Gravel, una carrera de ciclismo por los caminos de tierra de Laguna del Sauce. Hay recorridos de 50 y 100 millas, con tercer tiempo y premios al final. La inscripción es nominativa.",
    tickets: "https://redtickets.uy/evento/EPICA-GRAVEL-2026--Punta-del-Este-Uruguay/28720/", price: "Inscripción USD 160",
    photo: "epica-gravel-laguna-del-sauce.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  },
  {
    title: "2.ª Copa Fundación Futuro del Este (golf)",
    cat: "Deportes", date: "2026-11-21", time: "08:00",
    place: "La Barra Golf Club, Ruta 104 km 2,5 (Manantiales)",
    desc: "Torneo solidario de golf en La Barra Golf Club. Lo recaudado va a la Escuela de Atletas Guía de la Fundación Futuro del Este, que acompaña a personas con discapacidad en el deporte.",
    tickets: "https://redtickets.uy/evento/TORNEO-DE-GOLF--SEGUNDA-COPA-FUNDACION-FUTURO-DEL-ESTE/34198/",
    photo: "copa-futuro-del-este-la-barra-golf.webp"   // foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas
  }
];
