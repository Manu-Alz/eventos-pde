# Eventos PDE

Agenda de eventos de Punta del Este. Sitio estático (HTML, CSS y JS puros): se sube tal cual a GitHub Pages, Netlify o cualquier hosting.

## Estructura

```
index.html          home: slider de portada, filtros, lista y calendario (botón de calendario antes de "Todos")
publicar.html       planes, cómo funciona, formulario, pago y preguntas frecuentes
404.html            página para links rotos (GitHub Pages la muestra sola)
css/
  styles.css        base compartida (colores, botones, pie)
  eventos.css       hero, filtros y grilla de tarjetas
  calendario.css    calendario
  portada.css       slider de portada
  publicar.css      planes y pago
js/
  config.js         contacto, pagos, categorías, afiliados y planes  (se edita una vez)
  data.js           los eventos                                      (se edita seguido)
  utils.js          utilidades compartidas
  analytics.js      Google Analytics y conteo de clics
  site.js           pie de página
  cards.js          piezas de una publicación y tarjeta
  portada.js        slider de portada
  calendar.js       calendario
  app.js            filtros, lista e inicio
  publicar.js       página de publicar
```

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

- **Entradas:** un evento con `tickets` muestra "Entradas a la venta" en la tarjeta, "Comprar entradas" en la portada y un botón fijo abajo del detalle.
- **Agendar:** cada detalle tiene un botón que agrega el evento a Google Calendar (con hora: 3 horas; "A confirmar": día completo).
- **Para organizadores:** en la grilla aparece una tarjeta que lleva a publicar.html, con el precio más bajo de `PLANS`.
- **Google:** cada evento vigente se describe como schema.org/Event para que Google pueda mostrarlo en sus resultados de eventos.
- **Búsqueda:** sin tildes y también por fecha ("diciembre", "sábado").

## Página propia de cada evento (SEO)

- Cada evento vigente tiene su página: `eventospde.com/evento/<nombre-fecha>/` (HTML completo, con póster, datos para Google y botones). Al compartirla en WhatsApp o Instagram se ve el póster.
- **No se hacen a mano.** Las arma GitHub solo (`.github/workflows/eventos.yml` → `tools/build-eventos.js` → `tools/paginas.js`) cada vez que cambia `js/data.js`, y todos los días a las 6:15 para borrar las de eventos vencidos. También rehace `sitemap.xml` (no editarlo a mano).
- Como el robot sube esos cambios a `main`, antes de subir algo desde tu compu hacé **`git pull`** (o "Fetch/Pull" en GitHub Desktop).

## Mapa

- El botón del pin, al lado del calendario, muestra los eventos en un mapa (los de hoy laten). El pin sale solo si el lugar está en `VENUES` (`js/config.js`); si no, se le pone `geo: [lat, lng]` al evento. Los eventos sin ubicación siguen en la lista y el calendario.

## Cobros online (Mercado Pago, sin que el cliente tenga que escribirnos)

- **Traslados y alojamiento:** el cliente pide en `servicios.html` (con su mail) → le llega un mail de confirmación → vos completás en la pestaña "Servicios" las columnas **"Detalle para el cliente"** y **"Precio USD"** → al poner el precio le llega solo la cotización con el botón de pago → paga en `pagar.html` con Mercado Pago (monto exacto) o transferencia → se marca **"Pagado"** y les llega un mail a los dos.
- **Publicaciones:** al enviar el formulario, el botón de Mercado Pago ya trae el monto exacto (menos la Portada, que se confirma antes).
- Configuración (una vez): token de Mercado Pago en Apps Script (Propiedades del script → `MP_TOKEN`), correr `instalar` y publicar una nueva versión. Detalle en el encabezado de `apps-script/Code.gs`.

## Traslados y alojamiento (`servicios.html`)

- La gente pide chofer, alojamiento o los dos. El pedido (`SRV-XXXXX`) te llega por WhatsApp con todos los datos; vos conseguís opciones y precio y le respondés.
- Se llega desde: los dos accesos debajo de la portada, el detalle de cada evento (abre la página con el evento y las fechas ya puestas), la cabecera en PC y el pie.
- **Para que los pedidos también queden en la planilla:** pegá el `apps-script/Code.gs` nuevo en el script "Eventos PDE – Script de avisos" (es independiente, abre la planilla por su ID), **Implementar > Gestionar implementaciones > editar > Nueva versión**, y después poné `formServicios: true` en `config.js`. Se crea sola la pestaña "Servicios" (con columnas Estado, Precio pasado y Comisión para tu control).

## Precios (en `js/config.js`, `PLANS`)

Se cobra por día publicado y cada tramo sale más barato: `tiers: [[hastaElDía, precioPorDía], ...]`. Los tramos se suman (7 días nunca cuestan menos que 6). Hoy: Básico US$ 6 los días 1-2, US$ 3 del 3 al 7, US$ 2 del 8 al 30 y US$ 1 desde el 31; Portada US$ 30, 12, 8 y 5. `MAX_DAYS` es el tope de días por pedido. La página recalcula tarjetas, total y mensajes sola.

## Cobro (manual)

1. La persona elige plan, completa el formulario y recibe una referencia (`PDE-XXXXX`).
2. Paga con Mercado Pago, depósito bancario o PayPal indicando la referencia. Mercado Pago usa tu link de monto libre (`mercadopago.link` en `config.js`): la web le dice a la persona cuántos pesos escribir, con la cotización `mercadopago.uyuRate`. Actualizá la cotización cuando cambie el dólar.
3. Manda el comprobante por WhatsApp o mail (`eventospde.uy@gmail.com`).
4. Verificás el pago, cargás el evento en `data.js` y subís el cambio.

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

- **Fotos de eventos:** guardalas en `img/eventos/` con nombre `artista-lugar.webp` (minúsculas y guiones) y en data.js poné solo `photo: "artista-lugar.webp"`. Si el archivo no existe, la tarjeta usa el degradé de color.
- **Solo Punta del Este:** la agenda es local; los eventos de Montevideo u otras ciudades no se publican.
