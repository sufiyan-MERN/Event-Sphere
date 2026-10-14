# ShowBook — Approved Requirements Tracker

## 1. Brand, navigation and home discovery
- [x] Use an original brand name consistently; the selected example is **ShowBook**. Be inspired by overall usability of BookMyShow, but do not copy its logo, branding or exact UI. Deliver a modern, professional, clean, responsive and production-quality ticket-booking interface, not a basic template, with smooth animations, rounded cards, attractive posters, large banners, clear typography, good spacing, hover effects, subtle shadows and mobile-friendly design.
- [x] Create a responsive navigation bar that is sticky while scrolling. Desktop: logo, Home, Movies, Events, Sports, Concerts, Comedy, Search, Location and Login. Mobile: logo, search icon and hamburger icon. The JavaScript mobile menu must open and close.
- [x] The home page has a responsive promotional carousel. Every slide includes background image, movie/event poster, title, short description, category, date, location and Book Now; previous/next buttons and indicators work in JavaScript.
- [x] Show Hyderabad as default location. A dropdown/modal lets the user change among Hyderabad, Mumbai, Delhi, Bangalore, Chennai and Pune. The mock catalogue is currently seeded for Hyderabad; other selected cities must show a clear empty state rather than mislabel Hyderabad listings.
- [x] Provide horizontally scrollable Movies, Events, Concerts, Sports, Comedy, Theatre, Workshops and Kids categories, each with an icon/image.
- [x] Recommended movie cards show poster, movie name, rating, genre, language and Book Now, and scroll horizontally on mobile.
- [x] Upcoming event cards show event image, event name, date, venue, location, starting price and View Details. Include a Trending section and promotional offer cards: First Booking Offer, Student Discount, Weekend Offer and Cashback Offer.

## 2. Movie and event discovery/filtering
- [x] Movies page has search, genre, language, rating, date and sort controls; filters and sorting work against mock data. Its responsive grid shows poster, title, rating, genre, language, duration and Book Now. Layout supports 4–5 cards per desktop row, 2–3 per tablet row and 2 per mobile row.
- [x] Events page includes Concerts, Sports, Comedy, Theatre, Workshops, Festivals, Kids and Experiences. Category, date, location, price and availability filters work against mock data. Event cards show image, event name, date, time, venue, city and starting price, plus View Details.
- [x] Global search searches movies, events, concerts, sports and comedy, shows suggestions and dynamic results, and has a no-results state. JavaScript filtering supports category, date, location, price, rating and availability.

## 3. Event/movie details and show selection
- [x] Event/movie detail page shows large banner, poster, title, rating, category, description, duration, venue, location, price and terms & conditions; it has a Book Tickets button.
- [x] Users can select among date cards such as SAT 10 OCT, SUN 11 OCT and MON 12 OCT; the selected date changes visually.
- [x] Show selection offers 10:00 AM, 1:30 PM, 4:30 PM and 7:30 PM. Each show displays time, type/language, starting price and available seats. Selecting a show navigates to seat selection.

## 4. Seat map, booking summary and reservation timer
- [x] Build a realistic visual seating layout with a SCREEN label and multiple clickable seats/rows (example rows A–F with eight seats). Implement AVAILABLE (`.available`), SELECTED (`.selected`), LOCKED (`.locked`) and BOOKED (`.booked`) states. Available seats are clickable; locked and booked seats are disabled and cannot be selected.
- [x] Different rows use Silver ₹150, Gold ₹250 and Premium ₹400 categories. Display a legend for Available, Selected, Locked and Booked.
- [x] Dynamically update selected seat IDs, ticket price, convenience fee and total whenever seats are selected/deselected. Summary example: A5, A6, A7; ₹450 ticket price; ₹30 convenience fee; ₹480 total. Provide Proceed to Checkout.
- [x] After seat selection, display “Seats reserved for 04:59” and count down. When the timer reaches zero, clear selected seats, make them available again and show a notification. Seat holding is a frontend simulation only.

## 5. Checkout and coupon
- [x] Checkout collects Name, Email and Phone, and JavaScript validates these fields.
- [x] Show booking details (Movie/Event, Venue, Date, Time and selected seats), and a price breakdown with Ticket Price, Convenience Fee, Taxes, Discount and Total.
- [x] Implement an Enter promo code field and Apply action; example codes FIRSTBOOKING and STUDENT50 work.

## 6. Simulated payment
- [x] Payment is frontend-only: do not connect a real payment gateway. Provide UPI, Credit/Debit Card, Net Banking and Wallet options.
- [x] The payment action (example: “Pay ₹480”) shows “Processing Payment...” and simulates success. Implement simulated payment success, failure and cancellation states.
- [x] Do not store real card information.

## 7. Booking confirmation and digital ticket
- [x] After successful simulated payment, show “✓ Booking Confirmed” and a booking ID (example BK20261008001), event, venue, date (example 10 October 2026), time (example 7:30 PM), seats (example A5, A6, A7), amount (example ₹480) and payment status Successful.
- [x] Create a professional digital ticket containing a QR-code placeholder, Booking ID, event/movie, venue, date, time, seats, customer name and amount.
- [x] Include Download Ticket, View Booking and Back to Home. Download Ticket can create a frontend ticket/image/PDF if practical; otherwise show a simulated download interaction.

## 8. My Bookings and profile
- [x] My Bookings has Upcoming, Completed and Cancelled tabs. Each card shows poster, event/movie name, Booking ID, date, time, venue, seats, amount and status; buttons are View Ticket, View Details and Cancel Booking.
- [x] Persist demo booking information in localStorage so it remains available after page refresh **for the initial frontend-only prototype**; superseded in the Express follow-up by §13–14, where booking records come from Atlas and access tokens are session-scoped.
- [x] Profile is a simulated logged-in user, with user name, email, phone and profile image, and sections for My Bookings, Saved Events, Notifications, Account Settings and Logout. No real authentication is required. The local demo login/logout flag must change and persist without adding real authentication.

## 9. Responsive layout and accessibility of controls
- [x] The website is fully responsive; do not just scale the desktop design down.
- [x] Desktop: full navbar, large hero banner, multi-column cards, sidebar filters where appropriate, seat map with booking summary beside it.
- [x] Tablet: responsive grids, collapsible filters and adjusted hero/banner size.
- [x] Mobile: hamburger menu, two-column movie/event cards, horizontal category scrolling, horizontal movie carousel, mobile-friendly event details, mobile seat map, sticky bottom booking summary, large touch-friendly buttons, proper spacing and no horizontal page overflow.
- [x] If a seat layout is wider than the mobile viewport, scrolling is horizontal inside the seat-map container only (not the entire website); keep the booking summary visible at the bottom on mobile.
- [x] Use responsive CSS media queries, including breakpoints around 768px and 480px.

## 10. Mock data, persistence, components and routes
- [x] Create realistic Indian/Hyderabad-oriented JavaScript mock data for movies, events, venues, shows, seats, bookings and offers.
- [x] Use browser localStorage for selected location, user profile, bookings, favourite events and selected preferences **for the initial frontend-only prototype**. This is superseded for the backend follow-up: bookings live in Atlas, the checkout draft and access tokens use sessionStorage, and no database-free booking fallback is used.
- [x] Use reusable components, including Navbar, Footer, HeroCarousel, CategoryCard, MovieCard, EventCard, SearchBar, FilterPanel, DateSelector, ShowTimeSelector, Seat, SeatMap, SeatLegend, BookingSummary, PriceBreakdown, CouponInput, PaymentForm, TicketCard, BookingCard, Modal, Toast, LoadingSkeleton and EmptyState.
- [x] Implement React Router pages at `/`, `/movies`, `/events`, `/events/:id`, `/movies/:id`, `/show/:id/seats`, `/checkout`, `/payment`, `/booking/success`, `/bookings`, `/bookings/:id`, `/profile`, `/login` and `/register`.
- [x] Implement frontend UI states for Loading, Empty, Error, Success, Payment processing, Payment successful, Payment failed, Booking confirmed, Seat timer expired and No search results.

## 11. Frontend-only boundary and priorities
- [x] This is ONLY a frontend project. Do NOT create a Node.js backend, Express, MongoDB, PostgreSQL, REST APIs, authentication backend, real payment gateway, server-side seat locking, Redis, WebSockets, Docker or backend admin APIs.
- [x] All functionality uses React state, JavaScript, localStorage and mock data. No database; no real authentication. Payment and seat locking are simulated only.
- [x] Prioritize: beautiful homepage; movies/events discovery; event/movie details; date/show selection; interactive seat selection; dynamic booking summary; checkout; simulated payment; digital ticket; My Bookings; excellent mobile responsiveness; clean reusable React components.
- [x] Use regular CSS organized in separate CSS files.


> **Follow-up scope note:** The initial prototype clauses above document the completed frontend checkpoint. In particular, the localStorage booking statements in §§8 and 10 are historical and superseded: current booking data comes from Atlas, while checkout drafts and guest access tokens are session-scoped. The old frontend-only exclusion in §11 is superseded for this user's backend follow-up by the Express + Atlas criteria below; the demo-auth and simulated-payment restrictions remain.

## 12. Express.js API and runtime
- [x] Run an Express.js server in the same ShowBook project. In development, serve the existing Vite Preview on port 3000 and proxy same-origin `/api` requests to Express on port 3001. In production, bind Express to `0.0.0.0:$PORT` (default 3000), serve the compiled frontend and React SPA routes, and provide an unauthenticated `GET /_app/health` that returns process readiness without exposing secrets. Verified with local and public Preview HTTP requests and production-mode Express smoke checks.
- [x] Serve `GET /api/catalog` and `GET /api/catalog/:id` from the existing shared Hyderabad-oriented mock catalogue; support safe type/category/location filters. Keep API/health paths out of the 14-page `/manus-routes.json` route manifest. Verified the 14-entry static JSON manifest and catalogue filter on local and public Preview.
- [x] Validate JSON request bodies and query parameters, limit JSON request size, apply basic rate safeguards, return appropriate 4xx/5xx status codes and safe error messages, and never log Atlas URIs or booking/hold access tokens. The test suite covers strict schedule/seat validation, malformed and oversized bodies, untrusted totals, safe health state and fail-closed Atlas behavior.

## 13. MongoDB Atlas persistence and reservation rules
- [x] Use only MongoDB Atlas for durable backend booking data; keep managed Webdev MySQL disabled. Read `MONGODB_URI` only from the server runtime environment. The URI is currently unavailable because the user cancelled the protected credential-input card; do not reopen it or collect a credential in chat. With the URI absent, health/catalogue can work, but database-dependent operations return explicit HTTP 503 `persistence_not_configured` and the UI must not represent local data as durable. The no-URI state and 503 response are verified through the public Preview.
- [x] Add idempotent Atlas index/schema initialization for temporary holds, seat inventory and bookings without overwriting existing bookings. Enforce unique `(showKey, seatId)` inventory/hold constraints; check expiry in application code and use an expiry index for cleanup. The initializer and indexes are in source and have been reviewed, but cannot be exercised against Atlas until its URI is configured.
- [ ] Implement `GET /api/seats` to return six rows A–F with eight seats per row, row prices Silver ₹150 (A–B), Gold ₹250 (C–D), Premium ₹400 (E–F), and the existing locked/booked demo seat states. Dynamically reflect live Atlas holds/booked seats and return available, selected/held, locked and booked states. Code is implemented; live persistence/seat contention remains unverified because Atlas is not configured.
- [ ] Implement `POST /api/holds` and `DELETE /api/holds` to create/update/release five-minute holds for validated show/date/time and seat IDs. Holds must be atomic, must not claim locked/booked or actively held seats owned by someone else, must expire server-side, and must return an opaque owner-only token that is not written to the URL or server logs. Code is implemented; live Atlas transaction behavior remains unverified because Atlas is not configured.
- [ ] Implement transactional `POST /api/bookings` to verify an active hold and contact data, calculate ticket price, ₹30 convenience fee, 5% tax and `FIRSTBOOKING` (10%) / `STUDENT50` (50%) discount on the server, and then create a booking and mark the reserved seats sold. Do not trust a browser-supplied total or payment-success assertion. Record payment explicitly as `DEMO_SUCCESS`; do not collect/store card data or call a payment gateway. Validation/pricing and rejection of browser totals are tested; the Atlas write transaction remains unverified because Atlas is not configured.
- [ ] Implement guest-safe `POST /api/bookings/lookup`, `GET /api/bookings/:id` and `DELETE /api/bookings/:id`. Generate unguessable booking-access tokens, store only their hashes, return raw tokens once, require token possession for retrieval/cancellation, omit unnecessary customer PII from list responses, and make cancellation release inventory without claiming a refund or venue-side action. Token handling and source behavior are implemented; live Atlas retrieval/cancellation remains unverified because Atlas is not configured.

## 14. React integration, demo boundaries and deployment
- [x] Add a same-origin browser API client and connect seat availability/holds, checkout confirmation, booking history/details and cancellation to the Express API. Store booking-access tokens only in current-session `sessionStorage`; browser localStorage may retain display preferences, not act as a substitute booking database. Always fetch direct booking details using the owner token, even when a summary is cached. Store checkout contact drafts in `sessionStorage` and migrate/remove the previous `localStorage` draft. Source integration is present; Atlas-backed end-to-end operation awaits the URI.
- [x] When Atlas persistence is not configured or unavailable, show a clear recoverable error and do not fall back to browser-only durable claims or show a false booking confirmation. Keep demo login/profile local-only and never treat the demo sign-in flag as API authentication. Verified API operations fail closed with HTTP 503 and booking tests reject untrusted totals.
- [x] Add the committed Express Dockerfile with pinned pnpm install from `pnpm-lock.yaml`, Vite production build, Express runtime entrypoint, and the runtime port contract. Prepare the Webdev server deployment declaration with health path `/_app/health`; keep managed database disabled. Do not publish unless the user separately requests it. Frozen-lock install, Vite build, production Express smoke tests and deployment config have been checked; no publication was requested or performed.
- [x] Keep `MONGODB_URI` server-only, out of source, Git, frontend output and Docker build args. Do not reopen the cancelled Atlas secret-input card; a later explicit user request is required before asking for a new value through protected input. Runtime-only access and Docker exclusions are implemented; no credential is present in config or the worktree.

## 15. Integration-review corrections
- [x] Use one shared show schedule in React and Express: movies expose the item's catalogue date and the next two dates with `10:00 AM`, `1:30 PM`, `4:30 PM` and `7:30 PM`; events expose only their actual catalogue date and time. Reject impossible dates and unscheduled event/show combinations. Unit and local/public Preview checks pass.
- [x] Return booking seat IDs as strings for ticket/history components; omit customer name, email, phone, access-token hash and internal show key from guest-history summaries. Derive and persist `Completed` only after the full scheduled duration has elapsed in India time; completed bookings cannot be cancelled. Direct ticket pages must always request owner-token-authorized detail even when a summary is cached. Pure status/privacy tests pass; Atlas write-through remains unverified until configured.
- [x] Keep the Express development port at `3001` even if `PORT=3000` is inherited; allow `API_PORT` as the development override and honor production `PORT` with a `3000` fallback. Unit-tested.
- [x] Exclude Git state, dependencies, build artifacts, `.env*`, `.pem` and `.key` files from the local Docker build context with `.dockerignore`.
