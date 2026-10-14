import { Link } from "react-router-dom";
import "../styles/components/Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-col">
          <Link to="/" className="brand brand--footer">
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-word">
              show<span>book</span>
              <i>.</i>
            </span>
          </Link>
          <p>
            Find your next great night out.
            <br />
            Hyderabad, and wherever the good times take you.
          </p>
        </div>
        <div className="footer-links">
          <strong>Discover</strong>
          <Link to="/movies">Movies</Link>
          <Link to="/events">All events</Link>
          <Link to="/events?category=Concerts">Live music</Link>
        </div>
        <div className="footer-links">
          <strong>Your ShowBook</strong>
          <Link to="/bookings">My bookings</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/admin">Admin Panel</Link>
          <Link to="/events?category=Workshops">Things to try</Link>
        </div>
        <div className="footer-note">
          <span className="footer-spark">✦</span>
          <strong>Make tonight a story.</strong>
          <p>Good plans look good on you.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ShowBook. A little more show in every day.</span>
        <span>Made for the moments that matter.</span>
      </div>
    </footer>
  );
}
