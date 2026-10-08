# ShowBook — Implementation Plan

## Product scope and constraints

Build **ShowBook**, a frontend-only Indian event and movie discovery and ticket-booking prototype, following the attached requirements. It demonstrates the complete browsing-to-confirmation journey with mock data, React state and browser `localStorage`. It does **not** connect to Shopify, a backend, a database, an external authentication service or live payment gateway; payment and seat holds are simulations. The mock catalogue is currently seeded for Hyderabad; unseeded city selections display an honest empty state instead of relabeling Hyderabad listings. The deliverable is a responsive React website in HTML, JavaScript and regular CSS.

## Implementation approach

- Initialize a small JavaScript React application with Vite and `react-router-dom`; keep all state and mock business data in the browser.
- Separate app shell, navigation, shared UI, page views, data, booking utilities and CSS instead of concentrating functionality in a monolithic file.
- Build a reusable content model for Hyderabad-oriented movies, events, venues, shows, seat categories, offers and example bookings. Use a common discoverable item shape where useful while preserving movie- and event-specific details.
- Use React Router for the requested routes and dynamic IDs. Centralize navigation helpers and persisted demo state so Home, detail views, seat selection, checkout, confirmation and booking history share one consistent in-progress booking.
- Persist location, simulated profile/sign-in state, bookings, last confirmed booking ID, favourites and preferences through guarded `localStorage` helpers. Derive totals from selected seat prices and the documented fees/tax/discount/coupon rules; do not trust stale display-only totals.
- Keep the payment flow explicitly simulated, including processing, success, failure and cancellation states. Never collect or retain real card details.
- Use a static Vite development server on the project's configured port 3000, listening on `0.0.0.0` for Preview. Provide a static `/manus-routes.json` manifest matching every requested route, including dynamic route patterns.
- Keep managed server and database features disabled. No server, database, Shopify integration, real checkout/payment provider or user authentication is needed for the approved scope.

## Information architecture and component boundaries

- `src/App.jsx` and `src/main.jsx`: route tree, application shell and entry point.
- `src/components/`: sticky responsive navbar and mobile drawer; hero carousel; category rail; movie/event cards; global search and suggestions; reusable SearchBar and FilterPanel; date/show selectors; seat/map/legend; dynamic booking summary; price breakdown and coupon input; PaymentForm; ticket and booking cards; modal/toast/loading/empty/error UI; footer.
- `src/pages/`: Home, movie and event discovery, movie/event detail, seat selection, checkout, simulated payment, booking confirmation, booking list/details, profile, and simulated login/register views.
- `src/data/`: Indian/Hyderabad-oriented mock movies, events, venues, shows, seats, offers and seed booking.
- `src/context/` and `src/utils/`: shared booking/application context, storage helpers, price/coupon calculations, date formatting, IDs and input validation.
- `src/styles/`: base tokens, responsive application styles and any narrowly scoped component styles; use regular CSS rather than a utility framework.
- `public/`: static route manifest, favicon/profile illustration; original promotional artwork is referenced from the generated managed-storage URLs in `src/data/content.js`.
- `public/manus-routes.json`: declared static route inventory; `public/` also holds durable local site icons where appropriate.
- Root: pinned package metadata/lockfile, `index.html`, Vite configuration, `plan.md`, approved-requirements `TODO.md`, and project branding metadata.

## Design direction

- **Design movement:** contemporary editorial nightlife guide, borrowing the pacing and hierarchy of a culture magazine rather than a generic ticket dashboard.
- **Core principles:** cinematic discovery; information-rich but breathable cards; obvious ticket/seat state; touch-first responsive controls.
- **Color philosophy:** near-black aubergine/ink grounds give imagery a theatre-like frame; warm ivory keeps descriptions calm and legible; a vivid tangerine-coral accent signals ShowBook actions and ticket moments; restrained mint/amber/rose state colors distinguish availability, selection and sold-out states.
- **Layout paradigm:** an asymmetric, left-anchored editorial hero followed by a horizontally gliding category strip, staggered feature rails and full-width discovery sections. Filter controls become a compact collapsible panel on smaller screens; on mobile the seat map owns its own horizontal scroll and the booking total stays in a fixed bottom summary.
- **Signature elements:** a notched ticket-edge outline on selected cards; a small radiating “showtime” spark on brand and section accents; a soft coral halo on key selected/active actions.
- **Interaction philosophy:** quick, legible feedback at every step; disabled seats explain their state, filter and coupon changes update immediately, mobile targets stay comfortably tappable, and confirmations summarize the exact simulated booking.
- **Animation:** short opacity/translate entrances for section and card reveal, gentle carousel transition, small button/seat press feedback, and reduced-motion fallbacks. Avoid animations that delay booking controls or destabilize the seat map.
- **Typography system:** a display face such as Space Grotesk for prominent titles paired with DM Sans for interface/body copy, with resilient sans-serif fallbacks and a clear scale from editorial hero title to compact seat/filter labels.
- **Brand essence:** “The easiest front row to Hyderabad’s next great night out”; for film fans and event-goers who want discovery and booking in one clear flow. Personality: **vibrant, thoughtful, dependable**.
- **Brand voice:** concise and inviting, grounded in real show details. Example lines: “Make tonight a story.” and “Your seats are waiting.”
- **Wordmark & logo:** custom ShowBook wordmark accompanied by a distinctive ticket-shaped tab and four-point showtime spark; use a simplified spark/ticket symbol for favicon and compact mobile use, not a default-font logo alone.
- **Signature brand color:** ShowBook Tangerine `#FF6848`.

## User journeys

The home page leads into searchable/filterable movie and event rails, then to an item detail page. A visitor selects a date and show, picks available seats, and sees live ticket/fee totals and a reservation countdown. Checkout validates name, email and phone, supports the example coupon codes and shows the full price breakdown. A selected simulated payment mode runs through processing into a chosen success/failure/cancel result; success creates a persisted booking, QR placeholder and downloadable or simulated digital ticket. The bookings page, booking-detail route and profile reuse persisted demo data. All interactions stay local to the browser.

## Route coverage

Implement `/`, `/movies`, `/events`, `/events/:id`, `/movies/:id`, `/show/:id/seats`, `/checkout`, `/payment`, `/booking/success`, `/bookings`, `/bookings/:id`, `/profile`, `/login` and `/register`, plus a deliberate not-found view. Route transitions retain the selected discovery item, date, show and seat information; unavailable or stale IDs fail gracefully rather than showing broken content.

## Responsive behavior

Desktop uses a full navigation, broad asymmetric hero, multi-column discovery cards, appropriate sidebar filters and side-by-side seat map/summary. Tablet uses fluid grids and collapsible filters. Mobile uses the hamburger menu, two-column cards, horizontally scrolling categories and movie rails, compact event detail hierarchy, large touch targets and bottom-fixed booking summary. Keep page overflow clipped; allow horizontal overflow only within designated horizontal rails and the seat-map viewport. Reduce motion when the user's operating-system preference requests it.

## Build and serving

Use JavaScript `.jsx` modules, React, React DOM, React Router and Vite with regular CSS. No backend framework or database is added. Pin the package manager and commit its lockfile; record lifecycle-script policy before installing dependencies. Use the initialization-provided runtime port rather than changing it. Configure the development server to bind to `0.0.0.0`. Keep `public/manus-routes.json` synchronized with the route tree and serve it as an actual JSON file, not an SPA fallback.