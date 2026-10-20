# Eventos PDE

Agenda de eventos de Punta del Este. Sitio estático (HTML, CSS y JS puros): se sube tal cual a GitHub Pages, Netlify o cualquier hosting.

## Estructura

```
index.html          home: Hot topic, filtros, lista y calendario (botón de calendario antes de "Todos")
publicar.html       planes, formulario y pago
css/
  styles.css        base compartida (colores, botones, pie)
  eventos.css       hero, filtros y grilla de tarjetas
  calendario.css    calendario
  portada.css       Hot topic
  publicar.css      planes y pago
js/
  config.js         contacto, pagos, categorías, afiliados y planes  (se edita una vez)
  data.js           los eventos                                      (se edita seguido)
  utils.js          utilidades compartidas
  analytics.js      Google Analytics y conteo de clics
  site.js           pie de página
  cards.js          piezas de una publicación y tarjeta
  hot.js            Hot topic
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
- **Cambiar el Hot topic:** sacale `hot` al evento anterior y ponelo en el nuevo, con `hotUntil` (último día en portada). Se muestra uno solo. Flyer opcional: `img: "img/nombre.webp"`.
- **Publicaciones pagas (por semana):** al cargar el evento poné `from` (primer día) y `until` (último día pagado, ej. 7 días después). Pasado `until` deja de verse solo, aunque el evento sea después.
- **Un evento vence solo** después de su fecha (`date`, o `endDate` si dura varios días). No hace falta borrarlo.
- **Links:** cada publicación muestra un solo embed.
  - `tickets`: link de entradas. Si el dominio está en `AFFILIATES`, se le agrega tu código y se marca como "enlace de referido".
  - `affiliate: true`: para un link de afiliado que ya viene armado.
  - `link` + `linkLabel`: link libre (web, programa, reservas) cuando no hay entradas.
  - `contact`: botón de WhatsApp, Instagram o `mailto:`.

## Cobro (manual)

1. La persona elige plan, completa el formulario y recibe una referencia (`PDE-XXXXX`).
2. Paga por depósito bancario o PayPal indicando la referencia.
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
