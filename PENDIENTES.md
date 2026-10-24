# Pendientes de Eventos PDE

Cosas apagadas, de prueba o esperando algo tuyo. Cuando resuelvas una, borrala de acá.

## 1. Esperando algo tuyo

| Qué | Dónde | Qué hacer |
|---|---|---|
| **Link de afiliado de Booking** (Travelpayouts) | `js/config.js` → `BOOKING.link` | Cuando Travelpayouts apruebe Booking (hoy está "In review"), andá a Tools → Links, armá un link a booking.com y pasámelo. Sin ese link, el botón de Booking igual funciona, pero **no cobrás comisión**. |
| **Mails de inmobiliarias y hoteles aliados** | Apps Script → Configuración del proyecto → Propiedades del script → `AVISO_ALOJAMIENTO` | Poné los mails separados por coma. Les llega cada pedido de "Que me lo busquen ustedes" en copia oculta, sin los datos del cliente. Vacío = no le llega a nadie más que a vos. |
| **Mails de la empresa de traslados** | Propiedad `AVISO_TRASLADOS` | Mails que reciben cada traslado pagado. Vacío = solo vos. |
| **Alojamientos de aliados en el mapa** | `js/config.js` → `STAYS` | Vacío a propósito. Solo con permiso del aliado (fotos, ubicación, precio desde). |
| **Ticketera de ejemplo** | `js/config.js` → `AFFILIATES` | `tuticketera.com` es un ejemplo. Cambiala por una ticketera real con la que tengas código, o borrala. |
| **PayPal** | `js/config.js` → `CONFIG.paypal` | Dice `TU_USUARIO_PAYPAL`. No se usa (se cobra con Mercado Pago), pero si no vas a usar PayPal, dejalo así. |

## 2. Funciones apagadas (se prenden con un cambio)

| Qué | Dónde | Hoy | Para prenderla |
|---|---|---|---|
| **Chofer propio a los eventos** | `js/config.js` → `CHOFER.propio` | `false`: los 15 eventos con entrada de Fiestas y Música en vivo muestran "Cómo ir y volver" con Uber. En Armar plan solo hay traslado del aeropuerto o del puerto. | Cuando tengas choferes, pasalo a `true`. Avisame para cambiar también las preguntas frecuentes de Armar plan ("¿Cómo voy y vuelvo de los eventos?"). |
| **Precios de traslados** | `TARIFAS` en `js/config.js` **y** en `apps-script/Code.gs` | Simbólicos (US$ 20 a 65 por evento, 50 a 320 aeropuerto/puerto). | Poné los precios reales en los **dos** archivos, iguales. Después pegá Code.gs y publicá una **Nueva versión**. |
| **Modo de alojamiento** | Armar plan, paso 3 | Booking (con afiliado) por defecto; la persona también puede elegir "Que me lo busquen ustedes" (va a los aliados). | Nada que hacer: anda solo. |

## 3. Cosas que hay que mantener al día

- **Cotización del dólar:** `uyuRate: 42` en `js/config.js` y `COTIZACION = 42` en `Code.gs`. Si cambia, cambiala en los dos y publicá Nueva versión del script.
- **Cada cambio en Code.gs:** pegalo en Apps Script y publicá **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Si no, la web sigue usando el script viejo.
- **Fotos genéricas (Unsplash):** reemplazalas por los afiches oficiales cuando los tengas. Son las de Jamie Jones, Artbat, el Festival de Jazz, el Rolex Circuito Atlántico Sur, el Festival de Cine, el Karting, 12 Violoncellos, Callas Trio y el IRONMAN.
- **Eventos sin pin en el mapa:** Festival de Jazz, Festival de Cine, The 30 Limones, Volvé Mi Negra y Box NYE. Hace falta el lugar exacto.
- **Para confirmar:** la fecha y el lugar del IRONMAN 70.3 (2027-03-07). La mayoría de las fiestas no tiene hora: sale "A confirmar".
- **Fiestas sin cargar (tienen entradas):** El Templo NYE (31/12, El Bosque), Arde By JW (3/1, Open Park), Palito Bombón (29/12, Ruta 104 km 3,5) y Lovers (2/1, Ruta 104 km 3,5) en Entraste; Franky Rizardo en Polo Medellín (3/1) en Venti; Hugel (2/1) en Mi Entrada.
- **Sin entradas encontradas (24/10):** Jamie Jones en MACA (31/12) y FOMO Fest (todavía no está en Ticketplus).

## 4. Limpieza de la planilla

- **Servicios:** borrá la fila de prueba **TRS-KA67F** ("PRUEBA Claude (borrar)").
- **Solicitudes:** borrá las filas vacías de prueba de antes.

## 5. Comisiones: de dónde sale plata

- **Booking:** sí, por Travelpayouts, una vez que esté puesto `BOOKING.link`.
- **Aliados (inmobiliarias y hoteles):** la comisión que acuerdes con cada uno.
- **Traslados y entradas que cobrás con Mercado Pago:** tu margen.
- **Uber:** **no.** Los botones de Uber son links comunes, sin código de afiliado. Uber tiene un programa de afiliados en algunos países (paga por cada usuario nuevo que hace su primer viaje), pero la página para Uruguay no responde. Si algún día lo habilitan, el código va en `uberUrl` en `js/cards.js`.
