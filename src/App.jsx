import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import Loader from './components/Loader.jsx';
import Home from './pages/Home.jsx';
import { EventsPage, MoviesPage } from './pages/CatalogPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import SeatPage from './pages/SeatPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import { BookingSuccessPage, BookingDetailPage, BookingsPage } from './pages/BookingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { useBooking } from './context/BookingContext.jsx';
import { ADMIN_ROUTE } from './utils/routes.js';
import useReveal from './hooks/useReveal.js';

export default function App() {
  const { toast, dismissToast } = useBooking();
  const location = useLocation();

  // One shared scroll-reveal observer for every page.
  useReveal();

  // Start each new page at the top. `instant` (rather than the global smooth
  // behaviour) keeps navigation snappy on long pages.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return <div className="app-frame">
    <Loader />
    <Navbar /><div className="route-stage" key={location.pathname}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/movies" element={<MoviesPage />} />
    <Route path="/events" element={<EventsPage />} />
    <Route path="/movies/:id" element={<DetailPage kind="movie" />} />
    <Route path="/events/:id" element={<DetailPage kind="event" />} />
    <Route path="/show/:id/seats" element={<SeatPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/payment" element={<PaymentPage />} />
    <Route path="/booking/success" element={<BookingSuccessPage />} />
    <Route path="/bookings" element={<BookingsPage />} />
    <Route path="/bookings/:id" element={<BookingDetailPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path={ADMIN_ROUTE} element={<AdminPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/show/:id" element={<Navigate to="/events" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></div><Footer /><Toast toast={toast} onDismiss={dismissToast} /></div>;
}
