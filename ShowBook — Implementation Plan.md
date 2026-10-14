# ShowBook — Implementation Plan (Express Backend Extension)

## Scope and existing product

Keep the approved ShowBook React/Vite ticket-discovery experience, responsive design, visual identity, routes and mock Hyderabad catalogue. Expand this existing project into a full-stack application using **Express.js**. Replace browser-only booking persistence and seat selection with same-origin APIs backed by a managed MySQL database. Keep the existing demo login and simulated payment flow: no real authentication provider, Stripe, payment gateway, card collection or live charge is included. Do not connect Shopify. This is a prototype backend, not a live production ticketing/payment service.

## Backend behavior

- Add an Express server in `server/` that serves `/api/*`, a public unauthenticated health endpoint, and the compiled Vite `dist/` application with SPA fallback. Use the same origin for frontend/API calls.
- Add a Vite development proxy from `/api` to the Express development listener; preserve the existing Webdev Preview port 3000 as the browser-facing origin.
- Use the platform-managed MySQL database for durable catalog/show references, seat holds, bookings, customers’ booking contact details, and simulated payment status. Load `DATABASE_URL` only from the runtime environment; never bundle it into browser code, source literals, or container build arguments.
- Use explicit committed SQL migrations and parameterized queries. Keep migrations additive and idempotent. Boot the HTTP listener promptly; perform database readiness checks without blocking the health route indefinitely.
- Expose validated endpoints for health, catalogue/show data, seat availability, creating/extending/releasing time-limited seat holds, creating/confirming bookings, retrieving booking details, and cancelling a booking. Enforce hold expiry on the server; create holds and finalize seats/bookings with MySQL transactions and uniqueness/locking constraints so two clients cannot book the same seat concurrently. Never accept browser-submitted prices or payment-success claims as authoritative: calculate prices, discounts, fees and totals on the server, and represent payment as an explicitly simulated result only.
- Keep the current user/profile flow as demo mode. Do not imply it is secure production identity or use it to authorize sensitive account data. For booking lookups, use an unguessable booking-access token issued at booking creation, persist only its hash, and require it for guest retrieval/cancellation. Avoid returning unrelated customers’ contact information from public APIs. Do not store payment credentials.
- Keep existing UI routes and route manifest. Update the React booking context/pages to use the API for live availability, holds, booking creation, booking list/detail and cancellation, retaining localStorage only for display preferences, in-progress non-sensitive selection and demo profile state. Present expired/unavailable hold responses clearly and release a hold on cancellation or expiry.
- Validate request bodies and query parameters, use appropriate status codes, safe error responses, basic request size/rate safeguards, and server-side price/coupon/seat validation. Configure same-origin request behavior. No admin API is included.

## Hosting, packages and project structure

- Keep the existing pinned pnpm 11 toolchain and `pnpm-lock.yaml`; add Express.js and a maintained MySQL driver. Use parameterized SQL and committed migration files rather than adding an ORM without need.
- `server/index.js`: Express app, static asset serving, `/api` route registration and readiness endpoint.
- `server/db/`: connection pool, schema migrations, seed data, and repository/query modules for catalogue, holds and bookings.
- `server/routes/` and `server/services/`: request validation and HTTP mapping separated from transactional booking/inventory rules.
- `src/api/`: browser fetch client and API error handling; existing `src/pages/`, `src/components/` and CSS remain the presentation layer.
- `vite.config.js`: development proxy configuration; `Dockerfile`: pinned install, frontend build, runtime server entrypoint; `app.config.ts` retains the existing project logo literal.
- Configure Webdev server capability and managed MySQL. **These capabilities are one-way enablement**; development and published runtime share the same managed database, so development migrations/writes affect published data. Preserve `public/manus-routes.json` as the 14-page React route inventory; API endpoints are not page routes.
- Declare container deployment with the committed Dockerfile and an unauthenticated health path. Do not publish the site unless separately requested. A successful build, Preview, checkpoint and publication are separate outcomes.

## Design direction

Preserve the approved contemporary editorial nightlife guide design: cinematic discovery, readable breathable information, legible booking states and touch-first responsiveness. Retain the asymmetric editorial hero, horizontal discovery rails, ticket-edge cards and showtime spark. Tangerine `#FF6848` remains the signature action color; Space Grotesk display headings pair with DM Sans interface text. API loading, unavailable-seat and expired-hold states should use existing visual language and clear recovery actions rather than exposing technical errors.

## Explicit exclusions and future choices

This scope does not create customer accounts or secure user sessions, and it does not charge money. Existing simulated login and payment are demonstrations; confirmation records `DEMO_SUCCESS`, not a real payment. Enabling real authentication or a live payment provider later requires selecting the provider and its security/credential workflow before implementation. No production-data migration is planned: the current localStorage seed bookings remain demo data and are not automatically inserted into the managed database.
