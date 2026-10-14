import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
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

export default function App() {
  const { toast, dismissToast } = useBooking();
  return <div className="app-frame"><Navbar /><Routes>
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
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/show/:id" element={<Navigate to="/events" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes><Footer /><Toast toast={toast} onDismiss={dismissToast} /></div>;
}
