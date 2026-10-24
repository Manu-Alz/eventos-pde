/* i18n.js · idiomas: español (el de la web), inglés y portugués.
   - El idioma sale de ?lang=es|en|pt, de lo que la persona eligió antes (se guarda en este navegador) o del idioma del
     teléfono (portugués → pt, inglés → en, el resto → es).
   - Traduce lo que se ve: los textos de la interfaz, los botones, las fechas y los avisos, también lo que las páginas
     dibujan después (un MutationObserver mira los cambios). Lo que escribe cada organizador (nombre del evento,
     descripción y lugar) queda como está.
   - D: textos fijos ("español": ["English", "Português"]). RULES: textos con números o fechas, con expresiones regulares.
     Para sumar un texto nuevo: agregalo a D con sus dos traducciones. Sin traducción, se ve en español.
   - Un elemento con translate="no" (o adentro de uno) no se traduce.
   - I18N.lang, I18N.t("texto"), I18N.week() (iniciales de la semana, desde el lunes), I18N.switcher() (botones ES EN PT).
   Va en todas las páginas, después de utils.js y antes de site.js. */

const I18N = (() => {
  const LANGS = ["es", "en", "pt"];
  const KEY = "epde-lang";
  const lang = (() => {
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (LANGS.includes(q)) { localStorage.setItem(KEY, q); return q; }
      const s = localStorage.getItem(KEY);
      if (LANGS.includes(s)) return s;
    } catch (_) {}
    const n = (navigator.language || "es").slice(0, 2).toLowerCase();
    return n === "pt" ? "pt" : n === "en" ? "en" : "es";
  })();
  document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  const L = lang === "en" ? 0 : 1;                      // posición en cada par [English, Português]

  /* ---------- Fechas ---------- */
  const MONF = { enero: ["January", "janeiro"], febrero: ["February", "fevereiro"], marzo: ["March", "março"], abril: ["April", "abril"],
    mayo: ["May", "maio"], junio: ["June", "junho"], julio: ["July", "julho"], agosto: ["August", "agosto"], septiembre: ["September", "setembro"],
    octubre: ["October", "outubro"], noviembre: ["November", "novembro"], diciembre: ["December", "dezembro"] };
  const MONS = { ene: ["Jan", "jan"], feb: ["Feb", "fev"], mar: ["Mar", "mar"], abr: ["Apr", "abr"], may: ["May", "mai"], jun: ["Jun", "jun"],
    jul: ["Jul", "jul"], ago: ["Aug", "ago"], sep: ["Sep", "set"], oct: ["Oct", "out"], nov: ["Nov", "nov"], dic: ["Dec", "dez"] };
  const DAYF = { domingo: ["Sunday", "domingo"], lunes: ["Monday", "segunda-feira"], martes: ["Tuesday", "terça-feira"], "miércoles": ["Wednesday", "quarta-feira"],
    jueves: ["Thursday", "quinta-feira"], viernes: ["Friday", "sexta-feira"], "sábado": ["Saturday", "sábado"] };
  const DAYS = { Dom: ["Sun", "Dom"], Lun: ["Mon", "Seg"], Mar: ["Tue", "Ter"], "Mié": ["Wed", "Qua"], Jue: ["Thu", "Qui"], Vie: ["Fri", "Sex"], "Sáb": ["Sat", "Sáb"] };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const keepCase = (src, out) => (/^[A-ZÁÉÍÓÚ]/.test(src) ? cap(out) : out);
  const mf = m => MONF[m.toLowerCase()][L];
  const ms = m => { const v = MONS[m.toLowerCase()][L]; return /^[A-Z]/.test(m) ? cap(v) : v; };
  const df = d => keepCase(d, DAYF[d.toLowerCase()][L]);
  const ds = d => DAYS[cap(d.toLowerCase())][L];
  const MF = "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";
  const MS = "(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)";
  const DF = "(domingo|lunes|martes|miércoles|jueves|viernes|sábado)";
  const DS = "(Dom|Lun|Mar|Mié|Jue|Vie|Sáb)";
  /* "martes 29 de diciembre" */
  const longDate = (day, n, mon) => (L === 0 ? `${day ? df(day) + ", " : ""}${cap(mf(mon))} ${n}` : `${day ? df(day) + ", " : ""}${n} de ${mf(mon)}`);
  const range = (a, b, mon) => (L === 0 ? `${cap(mf(mon))} ${a}–${b}` : `${a} a ${b} de ${mf(mon)}`);
  const range2 = (a, m1, b, m2) => (L === 0 ? `${cap(mf(m1))} ${a} – ${cap(mf(m2))} ${b}` : `${a} de ${mf(m1)} a ${b} de ${mf(m2)}`);
  const dateExpr = s => {                               // una fecha suelta, en cualquiera de sus formas
    let m;
    if ((m = s.match(new RegExp(`^${DF} (\\d{1,2}) de ${MF}$`, "i")))) return longDate(m[1], m[2], m[3]);
    if ((m = s.match(new RegExp(`^(\\d{1,2}) de ${MF}$`, "i")))) return longDate("", m[1], m[2]);
    if ((m = s.match(new RegExp(`^(\\d{1,2}) al (\\d{1,2}) de ${MF}$`, "i")))) return range(m[1], m[2], m[3]);
    if ((m = s.match(new RegExp(`^(\\d{1,2}) de ${MF} al (\\d{1,2}) de ${MF}$`, "i")))) return range2(m[1], m[2], m[3], m[4]);
    return null;
  };
  const n1 = (n, one, many) => (+n === 1 ? one : many);
  const ev = n => n1(n, ["event", "evento"][L], ["events", "eventos"][L]);
  const ppl = n => n1(n, ["person", "pessoa"][L], ["people", "pessoas"][L]);
  const dd = s => s;                                    // "29/12" queda igual

  /* ---------- Textos fijos ---------- */
  const D = {
    /* Barra, pie y comunes */
    "Agenda": ["Events", "Agenda"], "Calendario": ["Calendar", "Calendário"], "Mapa": ["Map", "Mapa"],
    "Publicar evento": ["List your event", "Publicar evento"], "Quiénes somos": ["About us", "Quem somos"],
    "Armar mi plan": ["Plan my trip", "Montar plano"], "Armar plan": ["Plan my trip", "Montar plano"], "Ver eventos": ["See events", "Ver eventos"],
    "Escribinos": ["Contact us", "Fale com a gente"], "Secciones": ["Sections", "Seções"], "Abrir el menú": ["Open menu", "Abrir menu"],
    "Cerrar el menú": ["Close menu", "Fechar menu"], "Eventos PDE, inicio": ["Eventos PDE, home", "Eventos PDE, início"], "Idioma": ["Language", "Idioma"],
    "La agenda de Punta del Este: fiestas, música en vivo, deportes y todo lo que pasa en la temporada.": ["The Punta del Este events guide: parties, live music, sports and everything happening this season.", "A agenda de Punta del Este: festas, música ao vivo, esportes e tudo o que acontece na temporada."],
    "Trabajá con nosotros": ["Work with us", "Trabalhe conosco"], "Contacto": ["Contact", "Contato"], "Planes y precios": ["Plans and pricing", "Planos e preços"],
    "Hoteles e inmobiliarias": ["Hotels and real estate", "Hotéis e imobiliárias"], "Hablemos": ["Let's talk", "Vamos conversar"],
    "Seguinos en Instagram": ["Follow us on Instagram", "Siga a gente no Instagram"], "Novedades de la agenda y lanzamientos.": ["Event news and launches.", "Novidades da agenda e lançamentos."],
    "Punta del Este, Uruguay": ["Punta del Este, Uruguay", "Punta del Este, Uruguai"], "Pie de página": ["Footer", "Rodapé"],
    "Todos los eventos": ["All events", "Todos os eventos"], "Ver toda la agenda": ["See all events", "Ver toda a agenda"], "Ver la agenda": ["See events", "Ver a agenda"],
    "Ver evento": ["See event", "Ver evento"], "Ver todos los eventos": ["See all events", "Ver todos os eventos"], "Más eventos en Punta": ["More events in Punta", "Mais eventos em Punta"],
    "Ver temporada": ["See the season", "Ver temporada"], "Continuar": ["Continue", "Continuar"], "Tu plan": ["Your plan", "Seu plano"],
    "Borrar mi plan": ["Delete my plan", "Apagar meu plano"], "Borrar tu plan": ["Delete your plan", "Apagar seu plano"], "¿Borrar tu plan?": ["Delete your plan?", "Apagar seu plano?"],
    "No": ["No", "Não"], "Sí, borrar": ["Yes, delete", "Sim, apagar"], "Anterior": ["Previous", "Anterior"], "Siguiente": ["Next", "Próximo"],
    "Zoom in": ["Zoom in", "Aproximar"], "Zoom out": ["Zoom out", "Afastar"], "A confirmar": ["TBA", "A confirmar"], "Varios días": ["Several days", "Vários dias"],
    "Hoy": ["Today", "Hoje"], "Mañana": ["Tomorrow", "Amanhã"], "En curso": ["Happening now", "Acontecendo agora"], "Entradas": ["Tickets", "Ingressos"], "Popular": ["Popular", "Popular"],
    /* Categorías y zonas */
    "Todos": ["All", "Todos"], "Fiestas": ["Parties", "Festas"], "Música en vivo": ["Live music", "Música ao vivo"], "Náutica": ["Sailing", "Náutica"],
    "Autos": ["Cars", "Carros"], "Deportes": ["Sports", "Esportes"], "Festivales": ["Festivals", "Festivais"], "Gastronomía": ["Food & drink", "Gastronomia"],
    "Categorías": ["Categories", "Categorias"], "Categorías de este mes": ["This month's categories", "Categorias deste mês"],
    "Península": ["Peninsula", "Península"], "Playa Brava o Mansa": ["Playa Brava or Mansa", "Playa Brava ou Mansa"], "Me da igual": ["Anywhere", "Tanto faz"],
    /* Inicio */
    "Todo lo que pasa en Punta del Este.": ["Everything happening in Punta del Este.", "Tudo o que acontece em Punta del Este."],
    "Fiestas, música en vivo, náutica, autos, deportes, festivales y gastronomía. Encontrá qué hacer hoy, este fin de semana o toda la temporada.": ["Parties, live music, sailing, cars, sports, festivals and food. Find what to do today, this weekend or all season long.", "Festas, música ao vivo, náutica, carros, esportes, festivais e gastronomia. Descubra o que fazer hoje, neste fim de semana ou durante toda a temporada."],
    "Buscar evento, lugar o fecha": ["Search event, venue or date", "Buscar evento, lugar ou data"], "Buscar evento": ["Search events", "Buscar evento"],
    "No encontramos eventos con esa búsqueda.": ["No events match your search.", "Não encontramos eventos com essa busca."],
    "No encontramos eventos con esa búsqueda. Probá con otra o publicá el tuyo.": ["No events match your search. Try another or list yours.", "Não encontramos eventos com essa busca. Tente outra ou publique o seu."],
    "Eventos de la portada": ["Featured events", "Eventos em destaque"], "Elegir evento de la portada": ["Choose a featured event", "Escolher evento em destaque"],
    "¿Necesitás traslado o alojamiento?": ["Need a transfer or a place to stay?", "Precisa de transfer ou hospedagem?"],
    "Armá tu plan con traslado del aeropuerto y alojamiento": ["Plan your trip with airport transfer and lodging", "Monte seu plano com transfer do aeroporto e hospedagem"],
    "Elegí tus eventos y armá todo en un lugar: traslado desde el aeropuerto, entradas y alojamiento cerca.": ["Pick your events and plan it all in one place: airport transfer, tickets and lodging nearby.", "Escolha seus eventos e monte tudo em um só lugar: transfer do aeroporto, ingressos e hospedagem perto."],
    "Para organizadores": ["For organizers", "Para organizadores"], "¿Organizás un evento en Punta?": ["Organizing an event in Punta?", "Organiza um evento em Punta?"],
    "¿Organizás eventos en Punta?": ["Do you organize events in Punta?", "Organiza eventos em Punta?"],
    "Publicalo en la agenda desde US$ 6 por día y llegá a quienes buscan qué hacer esta temporada.": ["List it from US$ 6 a day and reach people looking for things to do this season.", "Publique na agenda a partir de US$ 6 por dia e alcance quem procura o que fazer nesta temporada."],
    "Publicar mi evento": ["List my event", "Publicar meu evento"], "Publicá tu evento y llegá a todo Punta.": ["List your event and reach all of Punta.", "Publique seu evento e alcance toda Punta."],
    "Vendé entradas con nuestro link, aparecé en la agenda y en la portada, y llegá a la gente que viene a Punta a salir.": ["Sell tickets with our link, appear in the guide and on the front page, and reach people coming to Punta to go out.", "Venda ingressos com nosso link, apareça na agenda e na capa e alcance quem vem a Punta para sair."],
    "¿Falta un evento?": ["Missing an event?", "Falta um evento?"], "Mandanos el nombre, la fecha y su Instagram, y lo sumamos.": ["Send us the name, date and Instagram, and we'll add it.", "Mande o nome, a data e o Instagram, e a gente adiciona."],
    "Mandanos los datos": ["Send us the details", "Mande os dados"], "¿Algo no coincide?": ["Something wrong?", "Algo não confere?"],
    "Un horario, un lugar o un link de entradas: lo corregimos.": ["A time, a venue or a ticket link: we'll fix it.", "Um horário, um lugar ou um link de ingressos: a gente corrige."],
    "¿Venís de afuera?": ["Coming from abroad?", "Vem de fora?"], "Si venís de afuera": ["If you're coming from abroad", "Se você vem de fora"],
    "¿Venís de afuera? Armá tu plan con aeropuerto y alojamiento": ["Coming from abroad? Plan your trip with airport and lodging", "Vem de fora? Monte seu plano com aeroporto e hospedagem"],
    "Mapa de eventos": ["Events map", "Mapa de eventos"], "Eventos anteriores": ["Previous events", "Eventos anteriores"], "Más eventos": ["More events", "Mais eventos"],
    "Mes anterior": ["Previous month", "Mês anterior"], "Mes siguiente": ["Next month", "Próximo mês"], "Leaflet": ["Leaflet", "Leaflet"],
    /* Página del evento */
    "‹ Todos los eventos de Punta del Este": ["‹ All events in Punta del Este", "‹ Todos os eventos de Punta del Este"], "‹ Volver a los eventos": ["‹ Back to events", "‹ Voltar aos eventos"],
    "Fecha": ["Date", "Data"], "Hora": ["Time", "Horário"], "Lugar": ["Venue", "Local"], "Entradas (puede cambiar según el lote)": ["Tickets (may change by release)", "Ingressos (podem mudar conforme o lote)"],
    "Comprar entradas": ["Buy tickets", "Comprar ingressos"], "Agendar": ["Add to calendar", "Salvar na agenda"], "Compartir": ["Share", "Compartilhar"],
    "Cómo llegar": ["Directions", "Como chegar"], "Cómo ir y volver": ["Getting there and back", "Como ir e voltar"], "Volvé seguro, sin manejar": ["Get home safe, no driving", "Volte com segurança, sem dirigir"],
    "Pedí un Uber con el lugar del evento ya cargado. Para la vuelta, tocá el botón cuando estés saliendo.": ["Order an Uber with the venue already set. For the ride back, tap the button when you're leaving.", "Peça um Uber com o local do evento já preenchido. Na volta, toque no botão quando estiver saindo."],
    "Para ir": ["To go", "Para ir"], "Para volver": ["To come back", "Para voltar"],
    "Se abre la app de Uber (o su web, si no la tenés). El precio lo ves en Uber antes de confirmar.": ["The Uber app opens (or its website if you don't have it). You see the price in Uber before confirming.", "Abre o app do Uber (ou o site, se você não tiver). O preço aparece no Uber antes de confirmar."],
    "Armá tu plan con este evento": ["Plan your trip with this event", "Monte seu plano com este evento"], "En tu plan": ["In your plan", "No seu plano"], "Agregar a mi plan": ["Add to my plan", "Adicionar ao meu plano"],
    "Sacar de mi plan": ["Remove from my plan", "Tirar do meu plano"], "Ver en la Federación": ["See at the Federation", "Ver na Federação"],
    /* Armar plan */
    "Tu viaje a Punta, resuelto.": ["Your Punta trip, sorted.", "Sua viagem a Punta, resolvida."],
    "Elegí tus eventos y armá todo en un lugar: traslado desde el aeropuerto, entradas y alojamiento cerca de tus eventos. Pago online con tarjeta.": ["Pick your events and plan it all in one place: airport transfer, tickets and lodging near your events. Pay online by card.", "Escolha seus eventos e monte tudo em um só lugar: transfer do aeroporto, ingressos e hospedagem perto dos eventos. Pagamento online com cartão."],
    "Elegí tus eventos": ["Pick your events", "Escolha seus eventos"], "Sumá los eventos a los que vas: en cada uno tenés las entradas y cómo ir y volver.": ["Add the events you're going to: each one has its tickets and how to get there and back.", "Adicione os eventos aos quais você vai: em cada um você tem os ingressos e como ir e voltar."],
    "tocá un evento para sumarlo": ["tap an event to add it", "toque em um evento para adicionar"], "Buscar evento, artista o lugar": ["Search event, artist or venue", "Buscar evento, artista ou local"],
    "Todavía no elegiste eventos.": ["You haven't picked any events yet.", "Você ainda não escolheu eventos."],
    "Tocá los que te interesan arriba. ¿Solo necesitás traslado o alojamiento? Seguí al paso 2.": ["Tap the ones you like above. Only need a transfer or lodging? Go to step 2.", "Toque nos que te interessam acima. Só precisa de transfer ou hospedagem? Vá para o passo 2."],
    "Comprar": ["Buy", "Comprar"], "con Uber, sin manejar": ["by Uber, no driving", "de Uber, sem dirigir"],
    "Llegada y regreso": ["Arrival and departure", "Chegada e volta"], "Te esperamos al llegar con tu nombre y te llevamos de vuelta.": ["We meet you on arrival with your name and take you back.", "A gente te espera na chegada com seu nome e te leva de volta."],
    "¿Cómo llegás a Punta del Este?": ["How are you getting to Punta del Este?", "Como você chega a Punta del Este?"], "Cómo llegás": ["How you arrive", "Como você chega"],
    "Avión a Montevideo": ["Flight to Montevideo", "Avião para Montevidéu"], "Avión a Punta del Este": ["Flight to Punta del Este", "Avião para Punta del Este"],
    "Barco a Montevideo": ["Ferry to Montevideo", "Barco para Montevidéu"], "Barco a Colonia": ["Ferry to Colonia", "Barco para Colonia"], "Ómnibus": ["Bus", "Ônibus"], "Por mi cuenta": ["On my own", "Por conta própria"],
    "Aeropuerto de Carrasco": ["Carrasco Airport", "Aeroporto de Carrasco"], "Aeropuerto de Laguna del Sauce": ["Laguna del Sauce Airport", "Aeroporto de Laguna del Sauce"],
    "Puerto de Montevideo": ["Montevideo Port", "Porto de Montevidéu"], "Puerto de Colonia": ["Colonia Port", "Porto de Colonia"], "Terminal de Punta del Este": ["Punta del Este Bus Terminal", "Rodoviária de Punta del Este"],
    "Si venís de afuera, el traslado desde el aeropuerto o el puerto es lo que más tiempo te ahorra.": ["If you're coming from abroad, a transfer from the airport or port saves you the most time.", "Se você vem de fora, o transfer do aeroporto ou do porto é o que mais economiza tempo."],
    "Perfecto. Si cambiás de idea, elegí cómo llegás y lo sumamos.": ["Perfect. If you change your mind, choose how you arrive and we'll add it.", "Perfeito. Se mudar de ideia, escolha como você chega e a gente adiciona."],
    "Llegada": ["Arrival", "Chegada"], "Regreso": ["Departure", "Volta"], "Día": ["Day", "Dia"], "Vuelo": ["Flight", "Voo"], "Barco": ["Ferry", "Barco"], "(opcional)": ["(optional)", "(opcional)"],
    "Traslado con chofer": ["Transfer with driver", "Transfer com motorista"], "Ida y vuelta": ["Round trip", "Ida e volta"], "Solo llegada": ["Arrival only", "Só chegada"], "Solo regreso": ["Departure only", "Só volta"],
    "Para el chofer: ¿dónde te alojás?": ["For the driver: where are you staying?", "Para o motorista: onde você vai ficar?"], "Zona": ["Area", "Região"], "Elegí la zona": ["Choose the area", "Escolha a região"],
    "Dirección u hotel": ["Address or hotel", "Endereço ou hotel"], "(si ya la sabés)": ["(if you know it)", "(se você já sabe)"], "Ej.: Calle 20 y Gorlero": ["E.g. Calle 20 and Gorlero", "Ex.: Calle 20 e Gorlero"],
    "Si todavía no la sabés, dejala vacía: te la pedimos por WhatsApp antes del viaje.": ["If you don't know it yet, leave it blank: we'll ask you on WhatsApp before the trip.", "Se ainda não sabe, deixe em branco: a gente pergunta pelo WhatsApp antes da viagem."],
    "Dónde te quedás": ["Where you're staying", "Onde você fica"], "Elegí la zona y reservá tu alojamiento en Booking. Si sumás traslados, te buscamos ahí.": ["Choose the area and book your stay on Booking. If you add transfers, we'll pick you up there.", "Escolha a região e reserve sua hospedagem no Booking. Se adicionar transfers, a gente te busca lá."],
    "Necesito alojamiento": ["I need lodging", "Preciso de hospedagem"], "¿Qué días te quedás?": ["Which days are you staying?", "Quais dias você fica?"],
    "Tocá un día para cambiar la llegada o la salida": ["Tap a day to change check-in or check-out", "Toque em um dia para mudar a entrada ou a saída"],
    "Tocá el día que llegás y el día que te vas": ["Tap your check-in day and your check-out day", "Toque no dia em que chega e no dia em que vai embora"],
    "En": ["In", "Em"], "celeste": ["light blue", "azul-claro"], ", los días de tus eventos: siempre quedan dentro de tu estadía.": [", the days of your events: they always stay inside your stay.", ", os dias dos seus eventos: sempre ficam dentro da sua estadia."],
    "Noches": ["Nights", "Noites"], "Una noche menos": ["One night less", "Uma noite a menos"], "Una noche más": ["One night more", "Uma noite a mais"],
    "Elegí la entrada y la salida.": ["Choose check-in and check-out.", "Escolha a entrada e a saída."], "La salida tiene que ser después de la entrada.": ["Check-out has to be after check-in.", "A saída tem que ser depois da entrada."],
    "Falta el día que te vas: tocalo en el calendario.": ["Your check-out day is missing: tap it on the calendar.", "Falta o dia da saída: toque nele no calendário."],
    "Tocá en el calendario el día que llegás y el día que te vas.": ["Tap your check-in and check-out days on the calendar.", "Toque no calendário no dia em que chega e no dia em que vai embora."],
    "(tocala en el mapa o elegí abajo)": ["(tap it on the map or choose below)", "(toque no mapa ou escolha abaixo)"], "Recomendada": ["Recommended", "Recomendada"],
    "El centro: puerto, restaurantes y noche. Todo a pie.": ["Downtown: port, restaurants and nightlife. All walkable.", "O centro: porto, restaurantes e noite. Tudo a pé."],
    "Torres y hoteles frente al mar, en el medio de todo.": ["Seafront towers and hotels, in the middle of everything.", "Torres e hotéis de frente para o mar, no meio de tudo."],
    "Playas, movida y las fiestas grandes a minutos.": ["Beaches, buzz and the big parties minutes away.", "Praias, agito e as festas grandes a minutos."],
    "Más tranquilo y de playa, cerca de La Barra.": ["Quieter and beachy, close to La Barra.", "Mais tranquilo e de praia, perto de La Barra."],
    "Exclusivo y relajado, lejos del ruido.": ["Exclusive and relaxed, away from the noise.", "Exclusivo e tranquilo, longe do barulho."],
    "La ciudad, a 10 minutos. La opción más económica.": ["The city, 10 minutes away. The cheapest option.", "A cidade, a 10 minutos. A opção mais econômica."],
    "Te mostramos todo Punta del Este.": ["We show you all of Punta del Este.", "A gente mostra toda Punta del Este."],
    "Tipo de alojamiento": ["Type of lodging", "Tipo de hospedagem"], "Hotel": ["Hotel", "Hotel"], "Apartamento": ["Apartment", "Apartamento"], "Casa": ["House", "Casa"],
    "¿Cómo querés reservarlo?": ["How do you want to book it?", "Como você quer reservar?"], "Cómo reservar el alojamiento": ["How to book lodging", "Como reservar a hospedagem"],
    "Lo reservo yo en Booking": ["I'll book it on Booking", "Eu reservo no Booking"], "Elegís entre todos los hoteles y apartamentos y pagás ahí.": ["Choose from all hotels and apartments and pay there.", "Você escolhe entre todos os hotéis e apartamentos e paga lá."],
    "Que me lo busquen ustedes": ["Find it for me", "Busquem para mim"], "Te mandamos opciones de inmobiliarias y hoteles aliados de Punta, con precio final.": ["We send you options from partner agencies and hotels in Punta, with the final price.", "A gente manda opções de imobiliárias e hotéis parceiros de Punta, com preço final."],
    "Elegí tu alojamiento en Booking": ["Choose your stay on Booking", "Escolha sua hospedagem no Booking"], "Te mostramos los de": ["We show you the ones in", "A gente mostra os de"],
    ". Elegís, reservás y pagás directo en Booking; muchos tienen cancelación gratis.": [". Choose, book and pay directly on Booking; many have free cancellation.", ". Você escolhe, reserva e paga direto no Booking; muitos têm cancelamento grátis."],
    "Ver alojamientos en Booking": ["See stays on Booking", "Ver hospedagens no Booking"], "Ver en Booking": ["See on Booking", "Ver no Booking"],
    "Enlace de referido: Eventos PDE puede recibir una comisión de Booking, sin costo extra para vos.": ["Referral link: Eventos PDE may earn a commission from Booking, at no extra cost to you.", "Link de indicação: a Eventos PDE pode receber uma comissão do Booking, sem custo extra para você."],
    "Te lo buscamos nosotros": ["We'll find it for you", "A gente procura para você"],
    "Le pasamos tu pedido a inmobiliarias y hoteles aliados de Punta y te mandamos por mail las mejores opciones para": ["We pass your request to partner agencies and hotels in Punta and email you the best options for", "A gente passa seu pedido para imobiliárias e hotéis parceiros de Punta e manda por e-mail as melhores opções para"],
    ", con precio final. Pagás online solo si te sirve.": [", with the final price. You only pay online if it works for you.", ", com preço final. Você paga online só se servir."],
    "Presupuesto por noche": ["Budget per night", "Orçamento por noite"], "A conversar": ["To discuss", "A combinar"], "Hasta US$ 100": ["Up to US$ 100", "Até US$ 100"],
    "US$ 100 a 250": ["US$ 100 to 250", "US$ 100 a 250"], "US$ 250 a 500": ["US$ 250 to 500", "US$ 250 a 500"], "Más de US$ 500": ["Over US$ 500", "Mais de US$ 500"],
    "Elegiste un alojamiento con convenio: te lo cotizamos junto con el resto del plan.": ["You chose a partner stay: we'll quote it with the rest of your plan.", "Você escolheu uma hospedagem parceira: a gente cota junto com o resto do plano."],
    "Tus datos": ["Your details", "Seus dados"], "Para mandarte el precio por mail y coordinar.": ["So we can email you the price and coordinate.", "Para mandar o preço por e-mail e combinar."],
    "Nombre y apellido": ["Full name", "Nome e sobrenome"], "Mail": ["Email", "E-mail"], "Email": ["Email", "E-mail"], "WhatsApp": ["WhatsApp", "WhatsApp"], "País": ["Country", "País"],
    "ahí te llega el precio": ["we'll send the price here", "o preço chega aqui"], "con código de país: +54 9 11…": ["with country code: +1 555…", "com código do país: +55 11…"],
    "Argentina": ["Argentina", "Argentina"], "Brasil": ["Brazil", "Brasil"], "Uruguay": ["Uruguay", "Uruguai"], "Chile": ["Chile", "Chile"], "Paraguay": ["Paraguay", "Paraguai"],
    "Estados Unidos": ["United States", "Estados Unidos"], "España": ["Spain", "Espanha"], "Otro": ["Other", "Outro"], "Español": ["Español", "Español"], "Português": ["Português", "Português"], "English": ["English", "English"],
    "Algo más": ["Anything else", "Algo mais"], "Ej.: vamos 2 parejas, uno es vegetariano…": ["E.g. we're 2 couples, one is vegetarian…", "Ex.: somos 2 casais, um é vegetariano…"],
    "Tu viaje": ["Your trip", "Sua viagem"], "Personas": ["People", "Pessoas"], "Una persona menos": ["One person less", "Uma pessoa a menos"], "Una persona más": ["One person more", "Uma pessoa a mais"],
    "Total": ["Total", "Total"], "Sin costo ni compromiso": ["Free, no commitment", "Sem custo nem compromisso"], "Tu plan está vacío": ["Your plan is empty", "Seu plano está vazio"],
    "Sumá eventos, traslado o alojamiento": ["Add events, transfer or lodging", "Adicione eventos, transfer ou hospedagem"], "Entradas en cada evento": ["Tickets at each event", "Ingressos em cada evento"],
    "las comprás en cada evento, con el botón Comprar": ["buy them at each event with the Buy button", "você compra em cada evento, com o botão Comprar"],
    "Ir y volver con Uber": ["Get there and back by Uber", "Ir e voltar de Uber"], "Alojamiento en Booking": ["Lodging on Booking", "Hospedagem no Booking"], "Alojamiento con aliados": ["Lodging with partners", "Hospedagem com parceiros"],
    "Alojamiento": ["Lodging", "Hospedagem"], "Traslados": ["Transfers", "Transfers"], "Traslado de llegada y regreso": ["Arrival and departure transfer", "Transfer de chegada e volta"], "Traslado de llegada": ["Arrival transfer", "Transfer de chegada"],
    "Traslado de regreso": ["Departure transfer", "Transfer de volta"], "Buscar alojamiento": ["Find lodging", "Buscar hospedagem"],
    "Empezá por tus eventos": ["Start with your events", "Comece pelos seus eventos"], "Ver plan": ["See plan", "Ver plano"], "Pedir precio": ["Get a price", "Pedir preço"],
    "Las entradas las comprás en cada evento, con Comprar. ¿Te falta dónde dormir o el traslado del aeropuerto? Sumalos en los pasos 2 y 3.": ["Buy tickets at each event with Buy. Still need a place to stay or an airport transfer? Add them in steps 2 and 3.", "Os ingressos você compra em cada evento, com Comprar. Falta onde dormir ou o transfer do aeroporto? Adicione nos passos 2 e 3."],
    "Sumá eventos en el paso 1, o pedí el traslado del aeropuerto (paso 2) o que te busquemos alojamiento (paso 3).": ["Add events in step 1, or ask for an airport transfer (step 2) or for us to find you lodging (step 3).", "Adicione eventos no passo 1, ou peça o transfer do aeroporto (passo 2) ou que a gente busque hospedagem (passo 3)."],
    "Precio final, sin esperar cotización. Pagás con tarjeta y te confirmamos el chofer por WhatsApp.": ["Final price, no waiting for a quote. Pay by card and we confirm your driver on WhatsApp.", "Preço final, sem esperar orçamento. Você paga com cartão e a gente confirma o motorista pelo WhatsApp."],
    "Abriendo el pago…": ["Opening payment…", "Abrindo o pagamento…"], "Enviando…": ["Sending…", "Enviando…"], "Pagar": ["Pay", "Pagar"],
    "Te llegan pedidos reales": ["You get real requests", "Você recebe pedidos reais"], "Volver a la agenda": ["Back to events", "Voltar à agenda"],
    "Te mandamos el precio a": ["We'll send the price to", "A gente manda o preço para"],
    "con todo lo que incluye, el total y el botón para pagar online. Revisá también promociones o spam.": ["with everything included, the total and the button to pay online. Also check your promotions or spam folder.", "com tudo o que inclui, o total e o botão para pagar online. Confira também promoções ou spam."],
    "Cotizamos": ["We get the price", "A gente cota"], "Te llega por mail": ["It arrives by email", "Chega por e-mail"], "Pagás online y listo": ["Pay online and you're set", "Você paga online e pronto"],
    "Traslado y alojamiento para tus fechas.": ["Transfer and lodging for your dates.", "Transfer e hospedagem para suas datas."], "Con el detalle y el total en dólares.": ["With the details and the total in dollars.", "Com o detalhe e o total em dólares."],
    "Después te escribimos para coordinar cada tramo.": ["Then we message you to coordinate each leg.", "Depois a gente escreve para combinar cada trecho."],
    "No pudimos enviarlo automáticamente. Mandanos el plan con un toque y te respondemos con opciones y precio.": ["We couldn't send it automatically. Send us your plan with one tap and we'll reply with options and price.", "Não conseguimos enviar automaticamente. Mande o plano com um toque e a gente responde com opções e preço."],
    "Enviar por WhatsApp": ["Send by WhatsApp", "Enviar por WhatsApp"], "Enviar por mail": ["Send by email", "Enviar por e-mail"],
    "Te llevamos el plan compartido": ["Shared plan", "Plano compartilhado"], "Te compartieron este plan.": ["Someone shared this plan with you.", "Compartilharam este plano com você."], "Guardarlo en mi plan": ["Save it to my plan", "Salvar no meu plano"],
    "No pudimos abrir el pago. Revisá la conexión y probá de nuevo.": ["We couldn't open the payment. Check your connection and try again.", "Não conseguimos abrir o pagamento. Verifique a conexão e tente de novo."],
    "No pudimos abrir el pago en este momento. Escribinos por WhatsApp y te mandamos el link.": ["We couldn't open the payment right now. Message us on WhatsApp and we'll send you the link.", "Não conseguimos abrir o pagamento agora. Fale com a gente no WhatsApp e mandamos o link."],
    /* Preguntas frecuentes del plan */
    "Preguntas frecuentes": ["FAQ", "Perguntas frequentes"], "¿Armar el plan tiene costo?": ["Does planning cost anything?", "Montar o plano tem custo?"],
    "No. Armar el plan es gratis: las entradas las comprás en cada evento, el alojamiento en Booking y los viajes en Uber. Si nos pedís el traslado del aeropuerto o que te busquemos alojamiento, te mandamos el precio por mail y pagás solo si te sirve.": ["No. Planning is free: you buy tickets at each event, lodging on Booking and rides on Uber. If you ask us for an airport transfer or to find you lodging, we email you the price and you only pay if it works for you.", "Não. Montar o plano é grátis: os ingressos você compra em cada evento, a hospedagem no Booking e as corridas no Uber. Se pedir o transfer do aeroporto ou que a gente busque hospedagem, mandamos o preço por e-mail e você paga só se servir."],
    "¿Cómo pago?": ["How do I pay?", "Como pago?"],
    "Las entradas, en la ticketera de cada evento; el alojamiento de Booking, en Booking. Lo que resolvemos nosotros (traslado o alojamiento con aliados) se paga online con tarjeta de crédito o débito, a través de Mercado Pago, con el botón que te llega por mail. El alojamiento que reservás en Booking se paga directo en Booking. Eventos PDE no ve ni guarda los datos de tu tarjeta.": ["Tickets, at each event's ticket site; Booking stays, on Booking. What we handle (transfer or partner lodging) is paid online by credit or debit card through Mercado Pago, with the button we email you. Eventos PDE never sees or stores your card details.", "Os ingressos, na bilheteria de cada evento; a hospedagem do Booking, no Booking. O que a gente resolve (transfer ou hospedagem com parceiros) é pago online com cartão de crédito ou débito, pelo Mercado Pago, com o botão que chega por e-mail. A Eventos PDE não vê nem guarda os dados do seu cartão."],
    "¿Puedo pedir solo un traslado o solo alojamiento?": ["Can I ask only for a transfer or only for lodging?", "Posso pedir só um transfer ou só hospedagem?"],
    "Sí. No hace falta elegir eventos: completá la llegada y el regreso y te mandamos el precio del traslado. El alojamiento lo reservás directo en Booking desde el paso 3, con tus fechas y tu zona ya puestas.": ["Yes. You don't need to pick events: fill in your arrival and departure and we'll send you the transfer price. You book lodging directly on Booking from step 3, with your dates and area already set.", "Sim. Não precisa escolher eventos: preencha a chegada e a volta e a gente manda o preço do transfer. A hospedagem você reserva direto no Booking pelo passo 3, com suas datas e região já preenchidas."],
    "¿Cómo reservo el alojamiento?": ["How do I book lodging?", "Como reservo a hospedagem?"],
    "Desde el paso 3 de Armar plan elegís fechas y zona (te mostramos cuántos minutos queda de tus eventos) y cómo reservar: en Booking, que se abre con tus fechas, la zona y la cantidad de personas, y ahí elegís y pagás directo; o pidiéndonos que te lo busquemos, y te mandamos por mail opciones de inmobiliarias y hoteles aliados de Punta, con precio final.": ["In step 3 you choose dates and area (we show how many minutes it is from your events) and how to book: on Booking, which opens with your dates, area and number of people so you choose and pay directly; or by asking us to find it, and we email you options from partner agencies and hotels in Punta, with the final price.", "No passo 3 você escolhe datas e região (mostramos quantos minutos fica dos seus eventos) e como reservar: no Booking, que abre com suas datas, região e número de pessoas, e lá você escolhe e paga direto; ou pedindo que a gente procure, e mandamos por e-mail opções de imobiliárias e hotéis parceiros de Punta, com preço final."],
    "¿Cómo funcionan las entradas?": ["How do tickets work?", "Como funcionam os ingressos?"],
    "Cada evento con entradas a la venta tiene su botón \"Comprar\", que lleva a la ticketera oficial: las comprás vos al instante, al mismo precio.": ["Every event with tickets on sale has a \"Buy\" button that takes you to the official ticket site: you buy them instantly, at the same price.", "Cada evento com ingressos à venda tem seu botão \"Comprar\", que leva à bilheteria oficial: você compra na hora, pelo mesmo preço."],
    "¿Cómo voy y vuelvo de los eventos?": ["How do I get to and from events?", "Como vou e volto dos eventos?"],
    "En cada fiesta o show con entrada de tu plan (y en la página del evento) tenés \"Cómo ir y volver\": un Uber con el lugar ya cargado, para ir y para volver sin manejar. Del aeropuerto o del puerto a tu alojamiento te buscamos nosotros: sumalo en el paso 2.": ["Every ticketed party or show in your plan (and on the event page) has \"Getting there and back\": an Uber with the venue already set, to go and come back without driving. From the airport or port to your lodging, we pick you up: add it in step 2.", "Em cada festa ou show com ingresso do seu plano (e na página do evento) você tem \"Como ir e voltar\": um Uber com o local já preenchido, para ir e voltar sem dirigir. Do aeroporto ou do porto até sua hospedagem a gente te busca: adicione no passo 2."],
    "¿Y si cambian mis vuelos o mis fechas?": ["What if my flights or dates change?", "E se meus voos ou datas mudarem?"],
    "Las entradas y Booking se cambian ahí mismo. Si nos pediste el traslado, respondé el mail del precio con el cambio y lo ajustamos antes de que pagues.": ["Tickets and Booking are changed right there. If you asked us for a transfer, reply to the price email with the change and we'll adjust it before you pay.", "Ingressos e Booking se mudam lá mesmo. Se pediu o transfer, responda o e-mail do preço com a mudança e a gente ajusta antes de você pagar."],
    "¿Cómo es el traslado desde el aeropuerto?": ["How does the airport transfer work?", "Como é o transfer do aeroporto?"],
    "Un chofer te espera al llegar con tu nombre y te lleva a tu alojamiento; al irte, te busca y te lleva de vuelta. Podés pedir los dos tramos o solo uno. Desde Carrasco (Montevideo) son unos 90 minutos hasta Punta; desde Laguna del Sauce, unos 25.": ["A driver waits for you on arrival with your name and takes you to your lodging; when you leave, they pick you up and take you back. You can ask for both legs or just one. From Carrasco (Montevideo) it's about 90 minutes to Punta; from Laguna del Sauce, about 25.", "Um motorista te espera na chegada com seu nome e te leva até a hospedagem; na volta, te busca e te leva. Você pode pedir os dois trechos ou só um. De Carrasco (Montevidéu) são uns 90 minutos até Punta; de Laguna del Sauce, uns 25."],
    /* Pagar */
    "No encontramos el pedido": ["We couldn't find the order", "Não encontramos o pedido"], "No encontramos el pedido. Revisá el link del mail.": ["We couldn't find the order. Check the link in the email.", "Não encontramos o pedido. Verifique o link do e-mail."],
    "Revisá el link del mail.": ["Check the link in the email.", "Verifique o link do e-mail."], "Falta el link completo": ["The full link is missing", "Falta o link completo"],
    "Abrí el link del mail tal como te llegó. Si no lo encontrás, escribinos y te lo reenviamos.": ["Open the link exactly as it arrived in your email. If you can't find it, contact us and we'll resend it.", "Abra o link do e-mail do jeito que chegou. Se não encontrar, fale com a gente e reenviamos."],
    "No pudimos cargar el pedido": ["We couldn't load the order", "Não conseguimos carregar o pedido"], "Revisá tu conexión y recargá la página.": ["Check your connection and reload the page.", "Verifique sua conexão e recarregue a página."],
    "Te escribimos por mail con los próximos pasos.": ["We'll email you the next steps.", "A gente escreve por e-mail com os próximos passos."],
    "Estamos armando tu cotización. Te llega por mail con el botón para pagar.": ["We're preparing your quote. It arrives by email with the payment button.", "Estamos preparando seu orçamento. Chega por e-mail com o botão para pagar."],
    "Tu pago quedó pendiente en Mercado Pago. Cuando se acredite, te llega la confirmación por mail.": ["Your payment is pending in Mercado Pago. Once it clears, you'll get the confirmation by email.", "Seu pagamento ficou pendente no Mercado Pago. Quando for creditado, a confirmação chega por e-mail."],
    "El pago no se completó. Podés intentarlo de nuevo con la misma u otra tarjeta.": ["The payment didn't go through. You can try again with the same or another card.", "O pagamento não foi concluído. Você pode tentar de novo com o mesmo ou outro cartão."],
    "No pudimos abrir el pago.": ["We couldn't open the payment.", "Não conseguimos abrir o pagamento."], "Escribinos por WhatsApp": ["Message us on WhatsApp", "Fale com a gente no WhatsApp"],
    " y te mandamos otro link.": [" and we'll send you another link.", " e mandamos outro link."], "Incluye:": ["Includes:", "Inclui:"],
    "Pago seguro con tarjeta de crédito o débito, a través de Mercado Pago. Eventos PDE no ve ni guarda los datos de tu tarjeta.": ["Secure payment by credit or debit card through Mercado Pago. Eventos PDE never sees or stores your card details.", "Pagamento seguro com cartão de crédito ou débito, pelo Mercado Pago. A Eventos PDE não vê nem guarda os dados do seu cartão."],
    /* Quiénes somos */
    "Todo lo que pasa en Punta, en un solo lugar.": ["Everything happening in Punta, in one place.", "Tudo o que acontece em Punta, em um só lugar."],
    "Eventos PDE es la agenda de eventos de Punta del Este. Juntamos las fiestas, los shows, los festivales, la náutica, los autos, los deportes y la gastronomía de la temporada para que sepas qué hacer hoy, este fin de semana o en todo tu viaje.": ["Eventos PDE is the events guide for Punta del Este. We bring together the season's parties, shows, festivals, sailing, cars, sports and food so you know what to do today, this weekend or during your whole trip.", "A Eventos PDE é a agenda de eventos de Punta del Este. Reunimos as festas, os shows, os festivais, a náutica, os carros, os esportes e a gastronomia da temporada para você saber o que fazer hoje, neste fim de semana ou durante toda a viagem."],
    "Qué hacemos": ["What we do", "O que fazemos"], "La agenda": ["The guide", "A agenda"],
    "Cada evento con fecha, hora, lugar, mapa y link de entradas. Lo buscás por nombre, día o categoría, o lo ves en el calendario y en el mapa.": ["Every event with date, time, venue, map and ticket link. Search by name, day or category, or see it on the calendar and the map.", "Cada evento com data, horário, local, mapa e link de ingressos. Você busca por nome, dia ou categoria, ou vê no calendário e no mapa."],
    "Si venís de afuera, elegís tus eventos y armás todo en un lugar: traslado desde el aeropuerto, entradas y alojamiento cerca en Booking.": ["If you're coming from abroad, pick your events and plan it all in one place: airport transfer, tickets and lodging nearby on Booking.", "Se você vem de fora, escolhe seus eventos e monta tudo em um só lugar: transfer do aeroporto, ingressos e hospedagem perto no Booking."],
    "Publicás tu evento por día, aparecés en la agenda o en la portada y llegás a la gente que viene a Punta a salir.": ["List your event by the day, appear in the guide or on the front page and reach people coming to Punta to go out.", "Você publica seu evento por dia, aparece na agenda ou na capa e alcança quem vem a Punta para sair."],
    "Cómo trabajamos": ["How we work", "Como trabalhamos"], "Solo Punta del Este": ["Only Punta del Este", "Só Punta del Este"],
    "La agenda es local: Punta, La Barra, José Ignacio, Maldonado y alrededores. Nada de eventos de otras ciudades.": ["The guide is local: Punta, La Barra, José Ignacio, Maldonado and around. No events from other cities.", "A agenda é local: Punta, La Barra, José Ignacio, Maldonado e arredores. Nada de eventos de outras cidades."],
    "Siempre al día": ["Always up to date", "Sempre atualizada"], "Cada evento tiene su fecha, hora y lugar, y cuando termina deja de aparecer solo.": ["Every event has its date, time and venue, and disappears on its own once it's over.", "Cada evento tem data, horário e local, e some sozinho quando termina."],
    "Si algo no coincide, lo corregimos": ["If something's off, we fix it", "Se algo não confere, a gente corrige"], "Un horario, un lugar o un link de entradas: escribinos y lo arreglamos.": ["A time, a venue or a ticket link: message us and we'll fix it.", "Um horário, um local ou um link de ingressos: escreva e a gente arruma."],
    "Sin costo para vos": ["Free for you", "Sem custo para você"], "Ver la agenda es gratis y pedir una cotización también: pagás solo si te sirve, online y con Mercado Pago.": ["Browsing the guide is free and so is asking for a quote: you only pay if it works for you, online with Mercado Pago.", "Ver a agenda é grátis e pedir um orçamento também: você paga só se servir, online e com Mercado Pago."],
    "Para hoteles e inmobiliarias": ["For hotels and real estate agencies", "Para hotéis e imobiliárias"],
    "Mucha de la gente que arma su plan con nosotros viene de afuera y necesita dónde quedarse. Si tenés un hotel, un apart o una inmobiliaria en Punta, trabajemos juntos: sin costo fijo, solo una comisión acordada por cada reserva que se concreta.": ["Many people who plan their trip with us come from abroad and need a place to stay. If you have a hotel, an apart-hotel or a real estate agency in Punta, let's work together: no fixed cost, just an agreed commission per confirmed booking.", "Muita gente que monta o plano com a gente vem de fora e precisa de onde ficar. Se você tem um hotel, um apart ou uma imobiliária em Punta, vamos trabalhar juntos: sem custo fixo, só uma comissão combinada por reserva concretizada."],
    "Fechas, zona, cantidad de personas, tipo y presupuesto de turistas que van a eventos en Punta.": ["Dates, area, number of people, type and budget of tourists going to events in Punta.", "Datas, região, número de pessoas, tipo e orçamento de turistas que vão a eventos em Punta."],
    "Nos mandás opciones": ["You send us options", "Você manda opções"], "Respondés el mail con lo que tengas disponible, fotos y precio. Nosotros se las presentamos al cliente.": ["Reply to the email with what you have available, photos and price. We present them to the client.", "Você responde o e-mail com o que tiver disponível, fotos e preço. A gente apresenta ao cliente."],
    "Tus propiedades en el mapa": ["Your properties on the map", "Seus imóveis no mapa"], "Si querés, sumamos tus alojamientos al plan con fotos, ubicación y precio desde, cerca de los eventos.": ["If you like, we add your properties to the planner with photos, location and starting price, near the events.", "Se quiser, adicionamos suas hospedagens ao plano com fotos, localização e preço a partir de, perto dos eventos."],
    "Comisión solo si se concreta": ["Commission only if it's booked", "Comissão só se concretizar"], "Sin costo para sumarte ni mensualidad. Acordamos la comisión antes de empezar.": ["No cost to join and no monthly fee. We agree on the commission before starting.", "Sem custo para entrar nem mensalidade. Combinamos a comissão antes de começar."],
    "Quiero sumarme": ["I want to join", "Quero participar"], "¿Hablamos?": ["Shall we talk?", "Vamos conversar?"],
    "Para sumar un evento, trabajar juntos o cualquier consulta, escribinos. Respondemos por mail y por Instagram.": ["To add an event, work together or ask anything, write to us. We reply by email and on Instagram.", "Para adicionar um evento, trabalhar juntos ou qualquer dúvida, escreva para a gente. Respondemos por e-mail e pelo Instagram."],
    "Instagram": ["Instagram", "Instagram"],
    /* Páginas de la agenda (/agenda/…) */
    "‹ Inicio": ["‹ Home", "‹ Início"], "‹ Toda la agenda de Punta del Este": ["‹ All Punta del Este events", "‹ Toda a agenda de Punta del Este"],
    "Agenda completa": ["Full guide", "Agenda completa"], "Más de la agenda": ["More from the guide", "Mais da agenda"], "Agenda por mes y categoría": ["Events by month and category", "Agenda por mês e categoria"],
    "Ver la agenda con calendario y mapa": ["See the guide with calendar and map", "Ver a agenda com calendário e mapa"], "Fin de año": ["New Year's", "Fim de ano"], "Este fin de semana": ["This weekend", "Este fim de semana"],
    "Eventos en Punta del Este": ["Events in Punta del Este", "Eventos em Punta del Este"], "Qué hacer este fin de semana en Punta del Este": ["What to do this weekend in Punta del Este", "O que fazer neste fim de semana em Punta del Este"],
    "Fiestas en Punta del Este": ["Parties in Punta del Este", "Festas em Punta del Este"], "Música en vivo en Punta del Este": ["Live music in Punta del Este", "Música ao vivo em Punta del Este"],
    "Náutica en Punta del Este": ["Sailing in Punta del Este", "Náutica em Punta del Este"], "Autos en Punta del Este": ["Cars in Punta del Este", "Carros em Punta del Este"],
    "Deportes en Punta del Este": ["Sports in Punta del Este", "Esportes em Punta del Este"], "Festivales en Punta del Este": ["Festivals in Punta del Este", "Festivais em Punta del Este"],
    "Gastronomía en Punta del Este": ["Food & drink in Punta del Este", "Gastronomia em Punta del Este"],
    "Más fiestas en Punta del Este →": ["More parties in Punta del Este →", "Mais festas em Punta del Este →"], "Más música en vivo en Punta del Este →": ["More live music in Punta del Este →", "Mais música ao vivo em Punta del Este →"],
    "Más náutica en Punta del Este →": ["More sailing in Punta del Este →", "Mais náutica em Punta del Este →"], "Más eventos de autos en Punta del Este →": ["More car events in Punta del Este →", "Mais eventos de carros em Punta del Este →"],
    "Más deportes en Punta del Este →": ["More sports in Punta del Este →", "Mais esportes em Punta del Este →"], "Más festivales en Punta del Este →": ["More festivals in Punta del Este →", "Mais festivais em Punta del Este →"],
    "Más gastronomía en Punta del Este →": ["More food & drink in Punta del Este →", "Mais gastronomia em Punta del Este →"],
    "Todos los eventos de la temporada en Punta del Este, La Barra, Manantiales, José Ignacio y Maldonado: fiestas, música en vivo, deportes, náutica, autos, festivales y gastronomía. Ordenados por fecha, con hora, lugar y link de entradas.": ["Every event of the season in Punta del Este, La Barra, Manantiales, José Ignacio and Maldonado: parties, live music, sports, sailing, cars, festivals and food. Sorted by date, with time, venue and ticket link.", "Todos os eventos da temporada em Punta del Este, La Barra, Manantiales, José Ignacio e Maldonado: festas, música ao vivo, esportes, náutica, carros, festivais e gastronomia. Ordenados por data, com horário, local e link de ingressos."],
    "Las fiestas de la temporada en Punta del Este, La Barra, Manantiales y José Ignacio: DJs internacionales, fiestas de Año Nuevo, sunsets y noches en Open Park, Narbona, Medellín Polo Club, Cipriani y más. Cada una con fecha, hora, lugar y link de entradas.": ["The season's parties in Punta del Este, La Barra, Manantiales and José Ignacio: international DJs, New Year's parties, sunsets and nights at Open Park, Narbona, Medellín Polo Club, Cipriani and more. Each with date, time, venue and ticket link.", "As festas da temporada em Punta del Este, La Barra, Manantiales e José Ignacio: DJs internacionais, festas de Ano Novo, sunsets e noites no Open Park, Narbona, Medellín Polo Club, Cipriani e mais. Cada uma com data, horário, local e link de ingressos."],
    /* 404 */
    "Esta página no existe.": ["This page doesn't exist.", "Esta página não existe."],
    "Puede que el link esté mal escrito o que el evento ya haya pasado. Mirá todo lo que viene en Punta del Este.": ["The link may be mistyped or the event may have passed. See everything coming up in Punta del Este.", "O link pode estar errado ou o evento já passou. Veja tudo o que vem por aí em Punta del Este."],
    /* Publicar */
    "Paso 1: elegí tu plan": ["Step 1: choose your plan", "Passo 1: escolha seu plano"], "Paso 2: contanos del evento": ["Step 2: tell us about the event", "Passo 2: conte sobre o evento"],
    "Básico": ["Basic", "Básico"], "Portada": ["Front page", "Capa"], "Elegir plan Básico": ["Choose Basic plan", "Escolher plano Básico"], "Elegir plan Portada": ["Choose Front page plan", "Escolher plano Capa"],
    "Publicación en su categoría": ["Listing in its category", "Publicação na sua categoria"], "Ordenada por fecha en la agenda": ["Sorted by date in the guide", "Ordenada por data na agenda"],
    "Para mostrar tu evento en la agenda": ["To show your event in the guide", "Para mostrar seu evento na agenda"], "Todo lo del plan Básico": ["Everything in the Basic plan", "Tudo do plano Básico"],
    "Lugar en el slider de portada, lo primero que se ve": ["A spot in the front-page slider, the first thing people see", "Lugar no slider da capa, a primeira coisa que se vê"],
    "Foto grande de tu evento": ["Big photo of your event", "Foto grande do seu evento"], "Máxima visibilidad en Punta": ["Maximum visibility in Punta", "Máxima visibilidade em Punta"],
    "Cupos limitados: confirmamos antes del pago": ["Limited spots: we confirm before payment", "Vagas limitadas: confirmamos antes do pagamento"],
    "Desde 1 día: vos elegís cuánto tiempo": ["From 1 day: you choose how long", "A partir de 1 dia: você escolhe quanto tempo"],
    "el primer día. Cuantos más días, menos pagás por día": ["the first day. The more days, the less you pay per day", "o primeiro dia. Quanto mais dias, menos você paga por dia"],
    "Días de publicación": ["Days listed", "Dias de publicação"], "Duraciones frecuentes": ["Common durations", "Durações frequentes"], "Primer día de publicación": ["First day listed", "Primeiro dia de publicação"],
    "Elegí plan y días": ["Choose plan and days", "Escolha plano e dias"], "Plan elegido:": ["Chosen plan:", "Plano escolhido:"], "Cambiar plan": ["Change plan", "Mudar plano"],
    "Nombre del evento": ["Event name", "Nome do evento"], "Categoría": ["Category", "Categoria"], "Descripción": ["Description", "Descrição"],
    "Contá en una o dos líneas de qué se trata (ej. música electrónica, show en vivo, feria…)": ["Describe it in one or two lines (e.g. electronic music, live show, fair…)", "Conte em uma ou duas linhas do que se trata (ex.: música eletrônica, show ao vivo, feira…)"],
    "Método de contacto": ["Contact method", "Método de contato"], "Dato de contacto": ["Contact details", "Dado de contato"], "Link de entradas": ["Ticket link", "Link de ingressos"],
    "Enlace a entradas o WhatsApp": ["Ticket or WhatsApp link", "Link de ingressos ou WhatsApp"], "Otro link": ["Other link", "Outro link"], "(opcional: web, programa, reservas)": ["(optional: website, schedule, bookings)", "(opcional: site, programação, reservas)"],
    "Enviar evento": ["Submit event", "Enviar evento"], "Cómo funciona": ["How it works", "Como funciona"], "· Total:": ["· Total:", "· Total:"], "Te damos una referencia y los datos para pagar.": ["We give you a reference and the payment details.", "A gente dá uma referência e os dados para pagar."],
    "Al enviar el formulario te damos tu referencia y el botón de Mercado Pago con el monto exacto: pagás con tarjeta de crédito o débito y el pago se confirma al instante.": ["When you submit the form we give you your reference and the Mercado Pago button with the exact amount: pay by credit or debit card and it's confirmed instantly.", "Ao enviar o formulário damos sua referência e o botão do Mercado Pago com o valor exato: você paga com cartão de crédito ou débito e o pagamento é confirmado na hora."],
    "Lo publicamos": ["We publish it", "A gente publica"], "Apenas confirmamos el pago, tu evento sale en la agenda.": ["As soon as we confirm payment, your event goes live in the guide.", "Assim que confirmamos o pagamento, seu evento entra na agenda."],
    "¿Qué diferencia hay entre Básico y Portada?": ["What's the difference between Basic and Front page?", "Qual a diferença entre Básico e Capa?"],
    "El Básico publica tu evento en la agenda, ordenado por fecha y en su categoría. La Portada suma un lugar en el slider de arriba de todo, lo primero que se ve al entrar. La portada tiene cupos limitados, por eso confirmamos la fecha antes de cobrarte.": ["Basic lists your event in the guide, sorted by date and in its category. Front page adds a spot in the slider at the very top, the first thing people see. Front-page spots are limited, so we confirm the date before charging you.", "O Básico publica seu evento na agenda, ordenado por data e na sua categoria. A Capa soma um lugar no slider do topo, a primeira coisa que se vê ao entrar. A capa tem vagas limitadas, por isso confirmamos a data antes de cobrar."],
    "¿Cuándo aparece mi evento?": ["When does my event appear?", "Quando meu evento aparece?"],
    "Apenas confirmamos el pago. Si elegiste un primer día de publicación más adelante, sale ese día.": ["As soon as we confirm payment. If you chose a later first day, it goes live that day.", "Assim que confirmamos o pagamento. Se escolheu um primeiro dia mais adiante, ele entra nesse dia."],
    "¿Puedo cambiar algo después de publicar?": ["Can I change something after it's listed?", "Posso mudar algo depois de publicar?"], "Sí: escribinos por WhatsApp o mail con tu referencia y lo actualizamos.": ["Yes: message us on WhatsApp or email with your reference and we'll update it.", "Sim: escreva pelo WhatsApp ou e-mail com sua referência e a gente atualiza."],
    "¿Qué pasa cuando terminan los días?": ["What happens when the days run out?", "O que acontece quando os dias acabam?"],
    "El evento deja de verse solo al terminar los días pagados o cuando pasa su fecha. Si querés más días, escribinos con tu referencia.": ["The event stops showing on its own when the paid days end or its date passes. If you want more days, write to us with your reference.", "O evento deixa de aparecer sozinho quando acabam os dias pagos ou quando passa a data. Se quiser mais dias, escreva com sua referência."],
    "Pagás solo los días que tu evento está online, desde uno.": ["You only pay for the days your event is online, from one.", "Você paga só os dias em que seu evento está online, a partir de um."],
    "Tu evento aparece en su categoría, con fecha, hora, lugar y contacto. Se cobra por día de publicación y cuanto más tiempo está online tu evento, menos pagás por día: podés publicarlo desde un solo día. Primero elegí cuánta visibilidad querés y después completá los datos. ¿Dudas? Escribinos a": ["Your event appears in its category with date, time, venue and contact. You pay per day listed, and the longer it's online the less you pay per day: you can list it for a single day. First choose how much visibility you want, then fill in the details. Questions? Write to", "Seu evento aparece na sua categoria, com data, horário, local e contato. Cobra-se por dia de publicação e quanto mais tempo online, menos você paga por dia: dá para publicar a partir de um dia só. Primeiro escolha quanta visibilidade quer e depois preencha os dados. Dúvidas? Escreva para"],
    "o por": ["or on", "ou pelo"], "Ejemplo:": ["Example:", "Exemplo:"], "Elegí cómo pagar": ["Choose how to pay", "Escolha como pagar"], "Pagá con tarjeta": ["Pay by card", "Pague com cartão"],
    "Forma de pago": ["Payment method", "Forma de pagamento"], "Listo, se confirma solo": ["Done, it confirms automatically", "Pronto, confirma sozinho"], "Mandanos el comprobante": ["Send us the receipt", "Mande o comprovante"],
    "Falta el pago para publicarlo. Guardá tu referencia.": ["Payment is still needed to publish it. Keep your reference.", "Falta o pagamento para publicar. Guarde sua referência."],
    "La portada tiene lugares limitados: antes de cobrarte confirmamos por WhatsApp o mail que tu fecha esté libre.": ["Front-page spots are limited: before charging you we confirm by WhatsApp or email that your date is free.", "A capa tem vagas limitadas: antes de cobrar confirmamos pelo WhatsApp ou e-mail que sua data está livre."],
    "Te pasamos los datos de pago por WhatsApp o mail.": ["We send you the payment details by WhatsApp or email.", "A gente passa os dados de pagamento pelo WhatsApp ou e-mail."]
  };
  const DICT = new Map(Object.entries(D));

  /* ---------- Textos con números, fechas o nombres ---------- */
  const zone = z => { const t = D[z]; return t ? t[L] : z; };
  const RULES = [
    [new RegExp(`^${DS}( \\d{1,2}:\\d{2})?( hs)?$`), m => ds(m[1]) + (m[2] || "") + (m[3] && L === 1 ? "h" : "")],
    [new RegExp(`^${DS} (\\d{1,2}) ${MS}(, día de evento|, en tu plan)?$`), m => `${ds(m[1])} ${m[2]} ${ms(m[3])}` + (m[4] ? [", event day", ", dia de evento", ", in your plan", ", no seu plano"][(m[4].includes("plan") ? 2 : 0) + L] : "")],
    [new RegExp(`^${MS}$`, "i"), m => ms(m[1])],
    [new RegExp(`^(\\d{1,2}) ${MS} · (.+)$`), m => `${m[1]} ${ms(m[2])} · ${(D[m[3]] || [m[3], m[3]])[L]}`],
    [new RegExp(`^${MF} (\\d{4})$`, "i"), m => keepCase(m[1], mf(m[1])) + " " + m[2]],
    [/^En (\d+) días?$/, m => [`In ${m[1]} days`, `Em ${m[1]} dias`][L]],
    [/^(\d{1,2}:\d{2}) hs$/, m => m[1] + (L === 1 ? "h" : "")],
    [/^(.+) · (\d{1,2}:\d{2}) hs$/, m => `${zone(m[1])} · ${m[2]}${L === 1 ? "h" : ""}`],
    [/^(.+) · A confirmar$/, m => `${zone(m[1])} · ${D["A confirmar"][L]}`],
    [/^(\d+) eventos?$/, m => `${m[1]} ${ev(m[1])}`],
    [/^(\d+) eventos? en agenda$/, m => [`${m[1]} ${ev(m[1])} listed`, `${m[1]} ${ev(m[1])} na agenda`][L]],
    [/^(\d+) eventos? este mes$/, m => [`${m[1]} ${ev(m[1])} this month`, `${m[1]} ${ev(m[1])} este mês`][L]],
    [/^(\d+) eventos? · (\d\d\/\d\d)( al (\d\d\/\d\d))?$/, m => `${m[1]} ${ev(m[1])} · ${m[2]}${m[4] ? [" to ", " a "][L] + m[4] : ""}`],
    [new RegExp(`^(\\d+) eventos?, (?:el ${DS.toLowerCase()} (\\d\\d/\\d\\d)|del ${DS.toLowerCase()} (\\d\\d/\\d\\d) al ${DS.toLowerCase()} (\\d\\d/\\d\\d))\\. (.+)$`, "i"),
      m => `${m[1]} ${ev(m[1])}, ${m[3] ? `${ds(m[2])} ${m[3]}` : `${ds(m[4])} ${m[5]}${[" to ", " a "][L]}${ds(m[6])} ${m[7]}`}. ${(D[m[8]] || SUB[m[8]] || [m[8], m[8]])[L]}`],
    [/^Del (\d\d\/\d\d) al (\d\d\/\d\d)(: un día antes y uno después de tus eventos)?\.$/, m => [`From ${m[1]} to ${m[2]}${m[3] ? ": one day before and one after your events" : ""}.`, `De ${m[1]} a ${m[2]}${m[3] ? ": um dia antes e um depois dos seus eventos" : ""}.`][L]],
    [/^Llegás el (\d\d\/\d\d)\. Ahora tocá el día que te vas\.$/, m => [`Check-in ${m[1]}. Now tap your check-out day.`, `Entrada dia ${m[1]}. Agora toque no dia da saída.`][L]],
    [/^Se abre Booking con tus fechas \((.*) al (.*)\), la zona y (\d+) personas?\. Las entradas las comprás en cada evento\. ¿Te buscamos en el aeropuerto\? Sumalo en el paso 2\.$/,
      m => [`Booking opens with your dates (${m[1]} to ${m[2]}), the area and ${m[3]} ${ppl(m[3])}. Buy tickets at each event. Want us to pick you up at the airport? Add it in step 2.`, `O Booking abre com suas datas (${m[1]} a ${m[2]}), a região e ${m[3]} ${ppl(m[3])}. Os ingressos você compra em cada evento. Quer que a gente te busque no aeroporto? Adicione no passo 2.`][L]],
    [/^(.+?)( · del (\d\d\/\d\d) al (\d\d\/\d\d))? · (\d+) personas?( · lo reservás vos| · te mandamos opciones)?$/,
      m => `${zone(m[1])}${m[2] ? [` · ${m[3]} to ${m[4]}`, ` · de ${m[3]} a ${m[4]}`][L] : ""} · ${m[5]} ${ppl(m[5])}${m[6] ? (m[6].includes("vos") ? [" · you book it", " · você reserva"] : [" · we send options", " · mandamos opções"])[L] : ""}`],
    [/^≈ (\d+) min a tus eventos$/, m => [`≈ ${m[1]} min to your events`, `≈ ${m[1]} min dos seus eventos`][L]],
    [/^→ Punta del Este: (.+) aprox\.$/, m => `→ Punta del Este: ${m[1]} ${["approx.", "aprox."][L]}`],
    [/^(.+) ↔ tu alojamiento$/, m => `${(D[m[1]] || [m[1], m[1]])[L]} ↔ ${["your lodging", "sua hospedagem"][L]}`],
    [/^Desde (USD|US\$|\$) ?(.+)$/i, m => `${["From", "A partir de"][L]} ${m[1]} ${m[2]}`],
    [/^Comprar · desde (.+)$/, m => `${["Buy · from", "Comprar · a partir de"][L]} ${m[1]}`],
    [/^Comprar entradas · desde (.+)$/, m => `${["Buy tickets · from", "Comprar ingressos · a partir de"][L]} ${m[1]}`],
    [/^Comprar entradas · Inscripción (.+)$/, m => `${["Buy tickets · Entry", "Comprar ingressos · Inscrição"][L]} ${m[1]}`],
    [/^Inscripción (.+)$/, m => `${["Entry", "Inscrição"][L]} ${m[1]}`],
    [/^Desde (.+)$/, m => `${["From", "Desde"][L]} ${m[1]}`],
    [/^Hasta (.+)$/, m => `${["To", "Até"][L]} ${m[1]}`],
    [/^US\$ (\d+) por día$/, m => [`US$ ${m[1]} a day`, `US$ ${m[1]} por dia`][L]],
    [/^(\d+) días = US\$ (\d+)$/, m => [`${m[1]} days = US$ ${m[2]}`, `${m[1]} dias = US$ ${m[2]}`][L]],
    [/^· (\d+) días = US\$ (\d+) \(US\$ ([\d,]+) por día\)$/, m => [`· ${m[1]} days = US$ ${m[2]} (US$ ${m[3]} a day)`, `· ${m[1]} dias = US$ ${m[2]} (US$ ${m[3]} por dia)`][L]],
    [/^Días (\d+)–(\d+)$/, m => [`Days ${m[1]}–${m[2]}`, `Dias ${m[1]}–${m[2]}`][L]],
    [/^Del día (\d+)$/, m => [`From day ${m[1]}`, `A partir do dia ${m[1]}`][L]],
    [/^(\d+) días?$/, m => `${m[1]} ${+m[1] === 1 ? ["day", "dia"][L] : ["days", "dias"][L]}`],
    [/^\/ día$/, () => ["/ day", "/ dia"][L]],
    [/^(\d+) (lugar|lugares) en el mapa\. Tocá un póster para ver el evento; si hay varios en el mismo lugar, se abren en abanico\.(?: (\d+) (?:evento todavía no tiene|eventos todavía no tienen) ubicación exacta: están en la lista y el calendario\.)?$/,
      m => [`${m[1]} ${+m[1] === 1 ? "place" : "places"} on the map. Tap a poster to see the event; if several share a place, they fan out.${m[3] ? ` ${m[3]} ${ev(m[3])} don't have an exact location yet: they're in the list and the calendar.` : ""}`,
            `${m[1]} ${+m[1] === 1 ? "lugar" : "lugares"} no mapa. Toque em um pôster para ver o evento; se houver vários no mesmo lugar, eles se abrem em leque.${m[3] ? ` ${m[3]} ${ev(m[3])} ainda não têm localização exata: estão na lista e no calendário.` : ""}`][L]],
    [/^botones en (\d+) eventos?$/, m => [`buttons on ${m[1]} ${ev(m[1])}`, `botões em ${m[1]} ${ev(m[1])}`][L]],
    [/^Pedir precio (.+)$/, m => `${["Get a price for", "Pedir preço"][L]} ${parts(m[1])}`],
    [/^Te mandamos el precio (.+) por mail\. Sin costo ni compromiso: pagás online solo si te sirve\.$/, m => [`We'll email you the price ${parts(m[1])}. Free, no commitment: you only pay online if it works for you.`, `A gente manda o preço ${parts(m[1])} por e-mail. Sem custo nem compromisso: você paga online só se servir.`][L]],
    [/^Pagar US\$ (\d+) con tarjeta$/, m => [`Pay US$ ${m[1]} by card`, `Pagar US$ ${m[1]} com cartão`][L]],
    [/^Total US\$ (\d+)$/, m => `Total US$ ${m[1]}`],
    [/^Pedido (.+)$/, m => [`Order ${m[1]}`, `Pedido ${m[1]}`][L]],
    [/^En Mercado Pago: (.+)$/, m => [`In Mercado Pago: ${m[1]}`, `No Mercado Pago: ${m[1]}`][L]],
    [/^¡Listo, (.+)! Recibimos tu plan\.$/, m => [`All set, ${m[1]}! We got your plan.`, `Pronto, ${m[1]}! Recebemos seu plano.`][L]],
    [/^¡Casi listo, (.+)!$/, m => [`Almost there, ${m[1]}!`, `Quase pronto, ${m[1]}!`][L]],
    [new RegExp(`^Eventos del (\\d{1,2}) de ${MF}$`, "i"), m => [`Events on ${cap(mf(m[2]))} ${m[1]}`, `Eventos de ${m[1]} de ${mf(m[2])}`][L]],
    [new RegExp(`^Eventos de ${MF}$`, "i"), m => [`Events in ${cap(mf(m[1]))}`, `Eventos de ${mf(m[1])}`][L]],
    [new RegExp(`^Eventos en Punta del Este en ${MF} (\\d{4})$`, "i"), m => [`Events in Punta del Este in ${cap(mf(m[1]))} ${m[2]}`, `Eventos em Punta del Este em ${mf(m[1])} de ${m[2]}`][L]],
    [/^Año Nuevo (\d{4}) en Punta del Este$/, m => [`New Year ${m[1]} in Punta del Este`, `Ano Novo ${m[1]} em Punta del Este`][L]],
    /* Etiquetas para lectores de pantalla */
    [/^Sacar (.+) de mi plan$/, m => [`Remove ${m[1]} from my plan`, `Tirar ${m[1]} do meu plano`][L]],
    [new RegExp(`^(\\d{1,2}) de ${MF}, (?:sin eventos|(\\d+) eventos?: (.+))$`, "i"), m => `${longDate("", m[1], m[2])}, ${m[3] ? `${m[3]} ${ev(m[3])}: ${m[4]}` : ["no events", "sem eventos"][L]}`],
    [new RegExp(`^(.+), ${DF} (\\d{1,2}) de ${MF}(\\. Ver evento)?$`, "i"), m => `${m[1]}, ${longDate(m[2], m[3], m[4])}${m[5] ? `. ${D["Ver evento"][L]}` : ""}`],
    [new RegExp(`^(.+), ${DS} (\\d{1,2}) ${MS}(, en tu plan)?$`), m => `${m[1]}, ${ds(m[2])} ${m[3]} ${ms(m[4])}${m[5] ? [", in your plan", ", no seu plano"][L] : ""}`],
    [/^(Fiestas|Música en vivo|Náutica|Autos|Deportes|Festivales|Gastronomía), (\d+) eventos?$/, m => `${D[m[1]][L]}, ${m[2]} ${ev(m[2])}`],
    [/^Mapa: (.+)$/, m => `${D["Mapa"][L]}: ${m[1]}`],
    [new RegExp(`^${DS} · (.+)$`), m => `${ds(m[1])} · ${m[2]}`],                                   // "Sáb · Soho"
    [/^(.+), ([^,]+)$/, m => { const d = dateExpr(m[2]); return d ? `${m[1]}, ${d}` : null; }],      // "FOMO Fest, 15 al 16 de enero"
    [/^(.+): (\d+) eventos?$/, m => `${m[1]}: ${m[2]} ${ev(m[2])}`]
  ];
  /* "del traslado y del alojamiento" */
  const PARTS = { "del traslado": ["the transfer", "do transfer"], "del alojamiento": ["the lodging", "da hospedagem"], "del chofer": ["the driver", "do motorista"] };
  const parts = s => s.split(" y ").map(p => (PARTS[p] || [p, p])[L]).join([" and ", " e "][L]);
  /* El resto del subtítulo de Armar plan (después de las fechas) */
  const SUB = { "Comprá las entradas, sumá el traslado del aeropuerto si lo necesitás y elegí dónde quedarte.": ["Buy the tickets, add the airport transfer if you need it and choose where to stay.", "Compre os ingressos, adicione o transfer do aeroporto se precisar e escolha onde ficar."] };

  const t = s => {
    if (lang === "es" || !s) return s;
    const k = s.replace(/\s+/g, " ").trim();
    if (!k) return s;
    let out = DICT.has(k) ? DICT.get(k)[L] : null;
    if (out == null) out = dateExpr(k);
    if (out == null) for (const [re, fn] of RULES) { const m = k.match(re); if (m) { out = fn(m); if (out != null) break; } }   // una regla puede pasar (null)
    if (out == null) return s;
    const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
    return lead + out + tail;
  };

  /* ---------- Traducción de la página ---------- */
  const ATTRS = ["placeholder", "aria-label", "title"];
  const skip = el => !el || el.closest('[translate="no"], script, style, noscript, textarea, [contenteditable]');
  const doText = n => { if (skip(n.parentElement)) return; const v = t(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; };
  const doEl = el => {
    if (!el || el.closest('[translate="no"], [contenteditable]')) return;              // el texto de ayuda de un cuadro sí se traduce
    for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const w = t(v); if (w !== v) el.setAttribute(a, w); } }
    if (el.tagName === "INPUT" && /^(submit|button)$/.test(el.type) && el.value) el.value = t(el.value);
  };
  const walk = root => {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doEl(root);
    root.querySelectorAll("*").forEach(doEl);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) doText(n);
  };
  /* Título de la pestaña: "Evento · Martes 29 de diciembre | Eventos PDE" */
  const TITLES = { "Eventos PDE – Todo lo que pasa en Punta del Este": ["Eventos PDE – Everything happening in Punta del Este", "Eventos PDE – Tudo o que acontece em Punta del Este"],
    "Armá tu plan en Punta – Eventos PDE": ["Plan your Punta trip – Eventos PDE", "Monte seu plano em Punta – Eventos PDE"], "Publicar un evento – Eventos PDE": ["List an event – Eventos PDE", "Publicar um evento – Eventos PDE"],
    "Pagar pedido – Eventos PDE": ["Pay order – Eventos PDE", "Pagar pedido – Eventos PDE"], "Quiénes somos – Eventos PDE": ["About us – Eventos PDE", "Quem somos – Eventos PDE"],
    "Página no encontrada – Eventos PDE": ["Page not found – Eventos PDE", "Página não encontrada – Eventos PDE"] };
  const doTitle = () => {
    const s = document.title, m = s.match(/^(.*) · (.+) \| Eventos PDE$/);
    const out = TITLES[s] ? TITLES[s][L] : m ? `${m[1]} · ${dateExpr(m[2]) || m[2]} | Eventos PDE` : s;
    if (out !== s) document.title = out;
  };

  if (lang !== "es") {
    walk(document.body);
    doTitle();
    new MutationObserver(list => {
      for (const r of list) {
        if (r.type === "characterData") doText(r.target);
        else if (r.type === "attributes") doEl(r.target);
        else r.addedNodes.forEach(walk);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    new MutationObserver(doTitle).observe(document.querySelector("title") || document.head, { childList: true, subtree: true, characterData: true });
  }

  /* ---------- Selector de idioma ---------- */
  const set = l => { try { localStorage.setItem(KEY, l); } catch (_) {} const u = new URL(location.href); u.searchParams.delete("lang"); location.replace(u); };
  document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-lang]"); if (b && b.dataset.lang !== lang) { ev.preventDefault(); set(b.dataset.lang); } });
  const switcher = () => `<div class="lang" role="group" aria-label="${["Idioma", "Language", "Idioma"][LANGS.indexOf(lang)]}" translate="no">${LANGS.map(l =>
    `<button type="button" data-lang="${l}" aria-pressed="${l === lang}" lang="${l}">${l.toUpperCase()}</button>`).join("")}</div>`;
  const WEEK = { es: ["L", "M", "M", "J", "V", "S", "D"], en: ["M", "T", "W", "T", "F", "S", "S"], pt: ["S", "T", "Q", "Q", "S", "S", "D"] };

  return { lang, t, switcher, week: () => WEEK[lang], booking: { es: "es", en: "en-us", pt: "pt-br" }[lang] };
})();
