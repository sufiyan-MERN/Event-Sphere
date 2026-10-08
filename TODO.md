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
- [x] Persist demo booking information in localStorage so it remains available after page refresh.
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
- [x] Use browser localStorage for selected location, user profile, bookings, favourite events and selected preferences. No database is required.
- [x] Use reusable components, including Navbar, Footer, HeroCarousel, CategoryCard, MovieCard, EventCard, SearchBar, FilterPanel, DateSelector, ShowTimeSelector, Seat, SeatMap, SeatLegend, BookingSummary, PriceBreakdown, CouponInput, PaymentForm, TicketCard, BookingCard, Modal, Toast, LoadingSkeleton and EmptyState.
- [x] Implement React Router pages at `/`, `/movies`, `/events`, `/events/:id`, `/movies/:id`, `/show/:id/seats`, `/checkout`, `/payment`, `/booking/success`, `/bookings`, `/bookings/:id`, `/profile`, `/login` and `/register`.
- [x] Implement frontend UI states for Loading, Empty, Error, Success, Payment processing, Payment successful, Payment failed, Booking confirmed, Seat timer expired and No search results.

## 11. Frontend-only boundary and priorities
- [x] This is ONLY a frontend project. Do NOT create a Node.js backend, Express, MongoDB, PostgreSQL, REST APIs, authentication backend, real payment gateway, server-side seat locking, Redis, WebSockets, Docker or backend admin APIs.
- [x] All functionality uses React state, JavaScript, localStorage and mock data. No database; no real authentication. Payment and seat locking are simulated only.
- [x] Prioritize: beautiful homepage; movies/events discovery; event/movie details; date/show selection; interactive seat selection; dynamic booking summary; checkout; simulated payment; digital ticket; My Bookings; excellent mobile responsiveness; clean reusable React components.
- [x] Use regular CSS organized in separate CSS files.
