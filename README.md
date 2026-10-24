# Eventos PDE

Agenda de eventos de Punta del Este. Sitio estático (HTML, CSS y JS puros): se sube tal cual a GitHub Pages, Netlify o cualquier hosting.

> Lo que está apagado, de prueba o esperando algo tuyo: [PENDIENTES.md](PENDIENTES.md).

## Estructura

```
index.html          home: slider de portada, filtros, lista y calendario (botón de calendario antes de "Todos")
publicar.html       planes, cómo funciona, formulario, pago y preguntas frecuentes
plan.html           Armar plan: el planificador de viaje (entradas, traslados y alojamiento)
nosotros.html       Quiénes somos (qué hacemos, cómo trabajamos y contacto; los textos se editan en el HTML)
404.html            página para links rotos (GitHub Pages la muestra sola)
css/
  styles.css        base compartida (colores, botones, pie de página)
  eventos.css       hero, filtros y grilla de tarjetas
  calendario.css    calendario
  portada.css       slider de portada
  plan.css          Armar plan y la píldora "Tu plan · Continuar"
  nosotros.css      Quiénes somos
  publicar.css      planes y pago
js/
  config.js         contacto, pagos, categorías, afiliados y planes  (se edita una vez)
  data.js           los eventos                                      (se edita seguido)
  utils.js          utilidades compartidas
  analytics.js      Google Analytics y conteo de clics
  site.js           pie de página (marca, columnas Agenda / Trabajá con nosotros / Contacto; los links se cambian acá) y animación de todas las preguntas frecuentes (.faq y .pl-faq)
  cards.js          piezas de una publicación y tarjeta
  tarifas.js        zonas de Punta y cálculo del precio de los traslados (los precios están en config.js, TARIFAS)
  traslado.js       "Traslado con chofer" de la página de cada evento (precio al instante y pago con tarjeta)
  plan.js           la lista de eventos del plan y la píldora "Tu plan · Continuar"
  planner.js        Armar plan (plan.html)
  pagar.js          página de pago (pagar.html): solo tarjeta, con Mercado Pago
  portada.js        slider de portada
  calendar.js       calendario con pósters: cada día muestra el póster del evento (como el mapa), con el número del día y la cantidad
  app.js            filtros, lista e inicio
  publicar.js       página de publicar
```

## Mail

- **Contacto oficial: `contacto@eventospde.com`** (web, mails a clientes, media kit). No es una casilla aparte: Namecheap lo reenvía al Gmail `eventospde.uy@gmail.com`, que sigue administrando todo (planilla, script, Mercado Pago, Analytics, GitHub).
- Desde Gmail se responde como contacto@ (Configuración > Cuentas e importación > Enviar como). El script manda los mails a clientes desde contacto@ si ese alias está configurado (`probarMail` lo comprueba); los avisos internos llegan al Gmail.

## Antes de publicar (una sola vez, en `js/config.js`)

1. `whatsapp`: tu número con código de país, sin `+` (hoy es de ejemplo).
2. `ga`: el ID de Google Analytics 4 (`G-XXXXXXXXXX`).
3. `paypal`: tu usuario de paypal.me.
4. `bank`: titular, banco, tipo y número de cuenta. Si la cuenta es en pesos: `moneda: "UYU"` y la cotización en `uyuRate`.
5. `AFFILIATES`: la ticketera de ejemplo (`tuticketera.com`) es falsa; reemplazala por una real cuando tengas el acuerdo.

## Tareas de todos los días (en `js/data.js`)

- **Agregar un evento:** copiá uno existente y cambiá los campos. La lista de campos está al principio del archivo.
- **Poner un evento en la portada (slider):** agregale `portada: true` al evento. Se ven hasta 6, los más cercanos primero. Los eventos sin `portada` solo aparecen en la agenda, ordenada por fecha.
- **Publicaciones pagas (por día):** al cargar el evento poné `from` (primer día pagado) y `until` (último día pagado; con 7 días contratados desde el 1/12, `until` es el 7/12). Pasado `until` deja de verse solo, aunque el evento sea después.
- **Un evento vence solo** después de su fecha (`date`, o `endDate` si dura varios días). No hace falta borrarlo.
- **Links:** cada publicación muestra un solo embed.
  - `tickets`: link de entradas. Si el dominio está en `AFFILIATES`, se le agrega tu código y se marca como "enlace de referido".
  - `affiliate: true`: para un link de afiliado que ya viene armado.
  - `link` + `linkLabel`: link libre (web, programa, reservas) cuando no hay entradas.
  - `contact`: botón de WhatsApp, Instagram o `mailto:`.

## Qué hace la web sola

- **Entradas:** un evento con `tickets` muestra "Entradas" en la tarjeta y un botón fijo abajo del detalle. El botón de la portada siempre dice "Ver evento" (lleva a la página del evento, donde están las entradas).
- **Agendar:** cada detalle tiene un botón que agrega el evento a Google Calendar (con hora: 3 horas; "A confirmar": día completo).
- **Para organizadores:** en la grilla aparece una tarjeta que lleva a publicar.html, con el precio más bajo de `PLANS`.
- **Google:** cada evento vigente se describe como schema.org/Event para que Google pueda mostrarlo en sus resultados de eventos.
- **Búsqueda:** sin tildes y también por fecha ("diciembre", "sábado").
- **Volver a la agenda:** desde la página de un evento (con "atrás", "‹ Todos los eventos" o el logo) se vuelve a la misma altura, vista y filtros. También en iPhone y en el navegador de Instagram, que guardan la página entera y la mostraban arriba de todo (`pageshow` en `js/app.js`).
- **Un solo botón de entradas en el celular:** con link de entradas, el botón va fijo abajo y no se repite en la página.

## Página propia de cada evento (SEO)

- Cada evento vigente tiene su página: `eventospde.com/evento/<nombre-fecha>/` (HTML completo, con póster, datos para Google y botones). Al compartirla en WhatsApp o Instagram se ve el póster.
- **No se hacen a mano.** Las arma GitHub solo (`.github/workflows/eventos.yml` → `tools/build-eventos.js` → `tools/paginas.js`) cada vez que cambia `js/data.js`, y todos los días a las 6:15 para borrar las de eventos vencidos. También rehace `sitemap.xml` (no editarlo a mano).
- **Para verlas en tu compu antes de subir** (por ejemplo con Live Server): un evento nuevo no tiene página hasta que GitHub la arma, así que su link da "Cannot GET". Para armarlas a mano hace falta Node: `node tools/build-eventos.js` (rehace todas las páginas y el sitemap, igual que GitHub). Si no tenés Node, subí el cambio y esperá uno o dos minutos.
- **Fotos de eventos vencidos:** el mismo robot borra de `img/eventos/` la foto de cada evento que terminó hace más de 3 días (solo si ningún evento vigente la usa; una foto que todavía no está en `data.js` no se toca). El evento puede quedar en `data.js`: la web ya no lo muestra.
- Como el robot sube esos cambios a `main`, antes de subir algo desde tu compu hacé **`git pull`** (o "Fetch/Pull" en GitHub Desktop).

## Armar plan (planificador de viaje): el único lugar para pedir entradas, traslados y alojamiento

Pensado sobre todo para quien viene de afuera y quiere resolver todo en un solo lugar. No hay formularios aparte: `servicios.html` quedó solo para los links viejos (lleva a `plan.html` y, con `?e=<id>`, suma ese evento).

- Se llama **"Armar plan"** en todo el sitio. Se llega desde un solo lugar por pantalla, para no repetirlo:
  - Inicio: la tarjeta clara debajo de la portada ("¿Necesitás traslado o alojamiento?" → **Armar plan**). En PC también está en la cabecera.
  - Página de cada evento: el bloque **"Traslado con chofer"** (ver abajo) y, adentro, el link "¿Venís de afuera? Armá tu plan…" (`plan.html?add=<id>`, suma ese evento). Las tarjetas de la agenda no lo repiten.
  - El pie de página de todas las páginas.
- La lista queda guardada en el navegador de la persona. Si ya tiene eventos en su plan, abajo aparece la píldora **"Tu plan · Continuar"** (nunca tapa el pie: la página deja lugar debajo).
- `plan.html` tiene cuatro pasos y un resumen fijo al costado (en el celular, una barra abajo):
  1. **Elegí tus eventos:** la agenda adentro del plan, en su propio panel (buscador, categorías y mini tarjetas que se deslizan) para sumar o sacar eventos. Por cada evento elegido: entradas (con link de compra, por defecto **"Las compro yo"**, que las paga al instante en la ticketera con nuestro código de afiliado; o "Incluilas en el plan", que se cotiza) y, **solo en fiestas y música en vivo con entradas**, chofer (**ida y vuelta, solo ida, solo vuelta o no**) con la hora a la que la buscamos. Eventos gratis o sin datos de entradas no muestran opciones.
  2. **Llegada y regreso:** avión a Montevideo o a Punta, barco a Montevideo o Colonia, ómnibus o por su cuenta; día, hora y vuelo, y el traslado con chofer (**ida y vuelta, solo llegada, solo regreso o no**).
  3. **Dónde te quedás:** viene **apagado** ("Necesito alojamiento"). Prendido: fechas y **noches** (por defecto, del día antes del primer evento al día después del último, nunca antes de hoy; se cambian con − y +, que mueven la salida), un mapa con las zonas y sus eventos, los minutos de cada zona a sus eventos (recomienda la más cercana) y tipo; el botón **"Ver alojamientos en Booking"** abre Booking con esas fechas, la zona, las personas y el tipo ya puestos (ver "Alojamiento en Booking"). Si hay **alojamientos con convenio** en `STAYS` (`js/config.js`), aparecen para elegir con pin en el mapa, y esos sí se cotizan. La llegada del paso 2 usa las mismas fechas por defecto.
  4. **Tus datos:** nombre, mail, WhatsApp, país e idioma.
- Se puede pedir **sin eventos** (solo traslado o solo alojamiento).
- **Solo traslados = pago al instante:** si no pide alojamiento ni que le consigamos entradas ("Las compro yo", el valor por defecto) y eligió su zona, el resumen muestra el **total** y el botón "Pagar US$ X con tarjeta" (reserva `TRS-XXXXX`, igual que en la página del evento). Un evento sin ubicación o una llegada sin precio vuelven a "Pedir cotización".
- Si no pide nada para resolver (ni chofer, ni aeropuerto, ni alojamiento, ni entradas incluidas), no deja enviar y le dice qué puede sumar.
- Si no, manda **una sola cotización**: entra a la pestaña "Servicios" (referencia `PLN-XXXXX`). En "Algo más" va el itinerario, una línea "•" por tramo (llegada, cada evento con entradas y chofer, regreso), más país e idioma. El mail de cotización y `pagar.html` muestran esas líneas completas, así que no hay que borrarlas de la planilla.
- "Compartir mi plan" genera un link (`plan.html?e=...`) para mandarle a los amigos.
- Abajo de todo, `plan.html` tiene **preguntas frecuentes** (costo, pago, solo traslado o alojamiento, entradas, cambios de fecha, aeropuerto), escritas en el HTML con sus datos para Google (FAQPage). Si cambia cómo trabajan, actualizá el texto y el bloque `ld+json` del encabezado.

## Alojamiento: Booking (afiliado) o aliados (inmobiliarias y hoteles)

En el paso 3 de Armar plan, con fechas, zona y tipo elegidos, la persona elige **cómo reservar**:

- **"Lo reservo yo en Booking"** (el valor por defecto): el botón abre Booking con fechas, zona, personas y tipo ya puestos. Elige, reserva y paga ahí; no pasa por la planilla. Si el plan tiene traslados, se pagan al instante igual (en el pedido queda "Alojamiento: lo reserva en Booking"; sin hotel todavía, la dirección dice "Hotel a confirmar").
- **"Que me lo busquen ustedes"**: pedido a inmobiliarias y hoteles aliados, con presupuesto por noche. Se cotiza como siempre (pestaña Servicios, `PLN-`). **El script le reenvía el pedido solo a los aliados** de la propiedad `AVISO_ALOJAMIENTO` (mails separados por coma, en copia oculta), **sin los datos del cliente**: responden a contacto@ con opciones y precio, vos armás la cotización con tu margen o la comisión acordada, y la reserva pasa por Eventos PDE.
- **Catálogo con convenio** (`STAYS` en `js/config.js`): propiedades de aliados con foto, pin en el mapa, precio desde y `partner` (de qué inmobiliaria u hotel es). Se cotizan. Solo con datos reales y permiso del aliado.

**Script de Travelpayouts:** el código que da la cuenta (Herramientas > Drive) está en el `<head>` de `index.html` y `plan.html`. Sirve para verificar el sitio y convierte solo los links a Booking en links de afiliado. En la compu (localhost) da "config is not valid": es normal, solo valida en eventospde.com.

**Comisión de Booking desde Uruguay:** el programa propio de Booking (por CJ) es para Europa y algunos países; desde acá se usa **Travelpayouts** ([travelpayouts.com](https://www.travelpayouts.com/)), que acepta cualquier país, tiene a Booking.com entre sus programas y paga por PayPal o transferencia. Creá la cuenta, agregá eventospde.com, sumate al programa de Booking.com y, en "Links", generá un link a booking.com. Copiá todo lo que va **antes** de la dirección de Booking (termina en `u=`) y pegalo en `BOOKING.link` (`js/config.js`); la web le agrega la búsqueda. Sirve igual para CJ (`url=`) o Awin (`ued=`). **Vacío, los links funcionan pero sin comisión.** Cada link lleva `label=eventospde-plan`. Debajo del botón se avisa que es un enlace de referido.

**Hoteles e inmobiliarias que quieran sumarse:** la sección "Para hoteles e inmobiliarias" de `nosotros.html` (link en el pie, "Hoteles e inmobiliarias") explica cómo trabajamos y tiene el botón "Quiero sumarme" (mail a contacto@).

## Chofer propio o Uber (interruptor `CHOFER.propio` en `js/config.js`)

**Hoy está apagado** (`CHOFER = { propio: false }`), porque todavía no hay choferes propios. Mientras tanto:
- En la página de cada fiesta o show con entradas sale **"Cómo ir y volver"** con dos botones de **Uber**: "Para ir" (destino: el evento) y "Para volver" (origen: el evento; el destino lo pone la persona en Uber). Se abre la app de Uber o su web, con el lugar ya cargado. Sin comisión.
- En Armar plan no se ofrece chofer a los eventos, y el traslado del aeropuerto o del puerto **se cotiza** (no se paga al instante): lo coordinás con un remise o chofer por pedido.
- Al final del paso 2, solo si pidió algún traslado, una pregunta: **"Para el chofer: ¿dónde te alojás?"** (zona, que se completa sola con la del alojamiento, y dirección opcional; si falta, se pide por WhatsApp).

**Cuando tengan choferes:** poné `propio: true`, subí el cambio y vuelve todo lo de abajo (reserva con precio al instante y pago con tarjeta, en la página del evento y en Armar plan). Revisá también la pregunta frecuente "¿Cómo voy y vuelvo de los eventos?" y la de "¿Cómo pago?" en `plan.html` (texto y bloque `ld+json`).

## Traslados con chofer: reservar y pagar al instante

Para turistas y también para la gente de acá (la vuelta de la fiesta sin manejar ni buscar taxi).

- **En qué eventos:** solo los que tienen **entradas a la venta** (`tickets`) y son **Fiestas o Música en vivo** (`RIDE_CATS` en `js/config.js`): ahí la gente sale tarde y conviene no manejar. Un evento puntual se fuerza con `traslado: true` o se apaga con `traslado: false` en `data.js`. Es una sola regla (`rideOK`, `js/cards.js`) para la página del evento y Armar plan. En los demás eventos la página muestra solo una línea discreta: "¿Venís de afuera? Armá tu plan…".
- **Dónde y cómo:** en la página del evento, debajo de los botones, el bloque **"Traslado con chofer"**, pensado para que cualquiera lo use: pasos numerados con preguntas simples. **1. ¿Qué viaje necesitás?** (ida y vuelta, solo ida o solo vuelta, cada una con su explicación) · **2. ¿Dónde te buscamos?** (zona y dirección; en solo vuelta, ¿a dónde te llevamos?) · **3. ¿Cuántos son y a qué hora?** (personas, día si dura varios y hora en formato 24 h) · resumen tipo ticket con cada tramo y el total · **4. Tus datos** y pagar. La vuelta no tiene hora: avisa por WhatsApp cuando quiere irse.
- **Letra grande y campos de 16 px o más** en todo el sitio, para que el iPhone no agrande la pantalla al tocar un campo.
- **Precio:** sale solo con `TARIFAS` (`js/config.js`): un precio por tramo según los km desde su zona hasta el evento, por auto de hasta 4 personas; de 5 a 8, camioneta (× `grupo`). Las llegadas (aeropuertos, puertos, terminal) tienen precio fijo por tramo. **Hoy son precios de ejemplo: ajustalos a lo que te cobre tu chofer o empresa más tu margen.**
- **Pago:** "Reservar" pide nombre, mail y WhatsApp → "Pagar US$ X con tarjeta" → el script vuelve a calcular el precio (no confía en el de la web), guarda la fila en "Servicios" con el precio y Estado **"Por pagar"** (referencia `TRS-XXXXX`) y abre Mercado Pago. Al aprobarse: Estado **"Pagado"**, mail al cliente con el itinerario, mail a vos y **mail automático a la empresa de traslados** con el viaje ya pagado (pasajero, WhatsApp, dónde buscarlo, horario).
- **Empresa de traslados (cuando haya convenio):** en Apps Script, Configuración del proyecto → Propiedades del script → `AVISO_TRASLADOS` con su mail (o varios separados por coma). Vacío = el aviso te llega solo a vos.
- **Si al reservar dice "No encontramos el pedido" o "No pudimos abrir el pago":** el script publicado es una versión vieja, sin traslados. En Apps Script: pegá el `Code.gs` de GitHub, guardá y **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar** (pegar y guardar no alcanza). La web ya no manda a pagar si el script no devuelve una reserva `TRS-`.
- **Copias que tienen que coincidir:** `TARIFAS` en `js/config.js` y en `apps-script/Code.gs`, y las zonas de `js/tarifas.js` y `ZONAS` del script. La web muestra el precio, pero cobra el script.
- **Siempre con precio, nunca "a cotizar":** antes de elegir zona muestra "Desde US$ X"; con la zona, el total y el desglose (ida + vuelta, por auto, no por persona). Para calcularlo usa el lugar del evento (`VENUES` o `geo`) o, si el lugar solo nombra una zona ("La Barra"), el centro de esa zona. Si un evento que debería tenerlo no tiene lugar, no sale el bloque y `tools/build-eventos.js` lo avisa ("Sin traslado por falta de ubicación…" en el registro de GitHub Actions).

## Mapa

- **Calendario:** cada día con eventos muestra el póster (marco blanco y franja del color de la categoría, igual que los pines del mapa), el número del día y, si hay varios, otro póster detrás y la cantidad. Primero van los eventos que empiezan ese día; los días en que un evento largo solo continúa (festival de una semana) se ven atenuados.
- El botón del pin, al lado del calendario, muestra los eventos en un mapa (los de hoy laten). El pin sale solo si el lugar está en `VENUES` (`js/config.js`); si no, se le pone `geo: [lat, lng]` al evento. Los eventos sin ubicación siguen en la lista y el calendario.

## Cobros online (Mercado Pago, sin que el cliente tenga que escribirnos)

- **Armar plan (entradas, traslados y alojamiento):** el cliente pide en `plan.html` (con su mail) → le llega un mail de confirmación → vos completás en la pestaña "Servicios" las columnas **"Detalle para el cliente"** y **"Precio USD"** → al poner el precio le llega solo la cotización con el botón de pago → paga en `pagar.html` con tarjeta (Mercado Pago, monto exacto) → se marca **"Pagado"** y les llega un mail a los dos.
- **Traslados (página del evento o plan solo de traslados):** el precio sale solo y se paga al reservar, sin cotizar (ver "Traslados con chofer").
- **Solo tarjeta:** el pago se abre en Mercado Pago con tarjeta de crédito, débito o saldo de Mercado Pago, y se aprueba o rechaza al instante (sin efectivo ni "pendiente"). `pagar.html` y Publicar ya no ofrecen transferencia ni depósito (la cuenta queda en `config.js` solo como dato).
- **Publicaciones:** al enviar el formulario, el botón de Mercado Pago ya trae el monto exacto (menos la Portada, que se confirma antes).
- Configuración (una vez): token de Mercado Pago en Apps Script (Propiedades del script → `MP_TOKEN`), correr `instalar` y publicar una nueva versión. `instalar` activa dos cosas: el aviso al poner un precio y un reloj que cada 10 minutos manda las cotizaciones que hayan quedado pendientes (si un mail falla, la fila queda en "Nuevo" y se reintenta sola). Detalle en el encabezado de `apps-script/Code.gs`.
- El precio se puede escribir como `120`, `US$ 120` o `1.250,50`. Lo que llega de la web (por ejemplo un celular `+598 …`) se guarda como texto, así la planilla no lo confunde con una fórmula (`#ERROR!`).

## Precios (en `js/config.js`, `PLANS`)

Se cobra por día publicado y cada tramo sale más barato: `tiers: [[hastaElDía, precioPorDía], ...]`. Los tramos se suman (7 días nunca cuestan menos que 6). Hoy: Básico US$ 6 los días 1-2, US$ 3 del 3 al 7, US$ 2 del 8 al 30 y US$ 1 desde el 31; Portada US$ 30, 12, 8 y 5. `MAX_DAYS` es el tope de días por pedido. La página recalcula tarjetas, total y mensajes sola.

## Cobro de publicaciones

1. La persona elige plan, completa el formulario y recibe una referencia (`PDE-XXXXX`).
2. Paga con tarjeta en Mercado Pago (monto exacto; se marca solo en la planilla y se publica sin que tenga que mandar nada). El link de monto libre (`mercadopago.link`) queda de respaldo si el script no responde.
3. La cotización del dólar está en dos lugares que tienen que coincidir: `COTIZACION` en `apps-script/Code.gs` y `mercadopago.uyuRate` en `config.js`.
4. Con el pago confirmado, cargás el evento en `data.js` (`from`/`until`) y subís el cambio (`git pull` antes).

## Aviso automático de solicitudes (opcional, gratis)

Con esto, cada vez que alguien envía el formulario se agrega una fila a una planilla tuya y te llega un mail. Se hace una sola vez:

1. Creá una planilla nueva en Google Sheets (con la cuenta eventospde.uy@gmail.com).
2. Menú **Extensiones > Apps Script**. Borrá lo que haya y pegá el contenido de `apps-script/Code.gs`. Guardá.
3. **Implementar > Nueva implementación > Aplicación web**. Ejecutar como: *Yo*. Quién tiene acceso: *Cualquier persona*. Implementar y aceptar los permisos.
4. Copiá la dirección que termina en `/exec` y pegala en `formUrl` de `js/config.js`.
5. Si cambiás el script después, hay que volver a implementar (Nueva versión) para que tome el cambio.

La pestaña "Solicitudes" tiene las columnas "Pagó", "Publicado desde" y "Hasta" para que llenes vos. Límite: Gmail deja mandar unos 100 avisos por día desde una cuenta gratis; si se pasara, las filas igual quedan guardadas en la planilla.

## Notas

- Categorías (7): Fiestas, Música en vivo, Náutica, Autos, Deportes, Festivales y Gastronomía. Para cambiar una, editá `CATS` (`config.js`).
- Dominio: las direcciones públicas (canonical, og:url, og:image y sitemap) apuntan a https://eventospde.com/. Al activarlo en GitHub Pages, el archivo `CNAME` tiene que quedar en la raíz del repo.

- **Fotos de eventos:** guardalas en `img/eventos/` con nombre `artista-lugar.webp` (minúsculas y guiones) y en data.js poné solo `photo: "artista-lugar.webp"`. Si el archivo no existe, la tarjeta usa el degradé de color. **Mejor una foto que el degradé:** si no hay póster oficial, usá una foto libre de Unsplash relacionada con el evento (licencia libre, sin pedir permiso) y anotá al lado `// foto genérica de Unsplash…` para cambiarla cuando llegue el póster. Una foto del Instagram del organizador, solo con su permiso.
- **Solo Punta del Este:** la agenda es local; los eventos de Montevideo u otras ciudades no se publican.
