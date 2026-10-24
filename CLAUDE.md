# Eventos PDE: instrucciones para Claude

The site's owner writes in Spanish (Uruguayan voseo). Reply in Spanish and keep the code comments in Spanish, as they already are.
More detail in README.md (how it works) and PENDIENTES.md (what is pending).

## Checklist: adding or editing an event (no step can be skipped)

An event is not "loaded" until every point below is checked off. The site does part of this on its own, but only if the data is complete.

1. **Real data, only in Punta del Este** (La Barra, Manantiales, José Ignacio, Maldonado and Punta Ballena/Solanas count). Verify date, time and venue on the ticketing page or the official source. Montevideo, Canelones and other cities do not go in. Events can be added without asking the owner.
2. **`js/data.js`.** Copy a similar event and fill in:
   - required: `title`, `cat` (one of the 7 categories), `date`, `time` (24h, or "A confirmar"), `place` and `desc` (1 or 2 lines, in Spanish);
   - when known: `tickets`, `price`.
   - Strip tracking parameters from links (utm_, fbclid, seller_code, or other sellers' referral codes).
3. **Map:** the event needs a pin. The `place` must contain a name from `VENUES` (js/config.js), or the event must carry `geo: [lat, lng]`. For a new venue, add it to `VENUES` with real coordinates (Nominatim/OpenStreetMap). If there is no exact location, note it in PENDIENTES.md.
4. **Getting there and back (transfer/Uber):** this appears on its own for **Fiestas and Música en vivo with `tickets`** and a pin. For any other event, `traslado: true` forces it and `traslado: false` turns it off. The build script warns when an event "should have it but has no venue": fix that.
5. **Tickets:** search Entraste (app.entraste.com), Venti (venti.live), Passline, RedTickets, GETIN, Kicket, Ticketplus, Mi Entrada, and the organizers' Instagram/Linktree. If there are tickets, add `tickets` and the `price` currently on sale.
6. **Photo:** official poster if available. Otherwise a related Unsplash photo, downloaded as webp to `img/eventos/artista-lugar.webp`:
   - URL format: `https://images.unsplash.com/photo-<id>?w=1000&q=60&fm=webp&fit=max`, under ~300 KB;
   - add the comment `// foto genérica de Unsplash (licencia libre): cambiala por el póster oficial cuando lo tengas`;
   - list it in PENDIENTES.md.
7. **Calendar, grid, plan, event page and Google pages:** these come out on their own from data.js. The event page (`evento/<slug>/`), the guide pages (`agenda/`: category, month, New Year's, weekend) and the sitemap only exist after the build is run (point 9). For a new category, add its text to `CAT_GUIDE` in tools/paginas.js.
8. **Translation:**
   - the event's text stays in Spanish (title, desc, place);
   - dates, categories and buttons are translated by `js/i18n.js` on its own;
   - **if you add any new interface text** (a button, a message, a label), add it to `D` in js/i18n.js with English and Portuguese: `"Texto": ["English", "Português"]`;
   - text with numbers or dates goes in `RULES`.
9. **Build and version:**
   - run `node tools/build-eventos.js` (portable node in the scratchpad if Node is not installed);
   - if JS or CSS changed, bump `?v=` in **all** the .html files before building;
   - check the build output: pages, the Uber count and the warnings.
10. **Test** at 375px (90% of visitors are on phones): the grid card, the event page (buy button, Uber, map), no broken images, no sideways overflow, no errors in the console.
11. **Documentation:**
    - update PENDIENTES.md (generic photos, missing pins, events without tickets);
    - update the Claude Doc manual ("Eventos PDE – Manual de operación") if anything about operating the site changes;
    - update README.md if anything about how the site works changes.
12. **Commit and push** to main: `git pull --rebase` first, because the GitHub robot pushes event pages every day. Then confirm it is live on eventospde.com (the new `?v=` or the event's page returns 200).

## Other rules

- Mobile first. The style is dark with glass; the slider looks the same as the grid cards.
- "Que un abuelo pueda usarla": plain numbered questions, large text, inputs of 16px or more, 24h times.
- Do not fake data, hotels or partners. Do not publish partners' names without their permission.
- Payments by card only (Mercado Pago). If `apps-script/Code.gs` changes, the owner has to paste it and publish a "Nueva versión".
- Switches live in `js/config.js`: `CHOFER.propio`, `TARIFAS` (must match Code.gs), `BOOKING.link` and `uyuRate` (must match `COTIZACION` in Code.gs).
