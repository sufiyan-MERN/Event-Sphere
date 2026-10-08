import { Link } from "react-router-dom";
import { formatLongDate, money } from "../utils/format.js";
import Icon from "./Icon.jsx";
import "../styles/components/BookingCard.css";

export default function BookingCard({ booking, onViewTicket, onCancel }) {
  return (
    <article className="booking-card">
      <Link
        to={`/bookings/${booking.id}`}
        className="booking-card__poster-link"
      >
        <img src={booking.poster} alt={`${booking.title} poster`} />
      </Link>
      <div className="booking-card__details">
        <div className="booking-card__heading">
          <span
            className={`booking-status booking-status--${booking.status.toLowerCase()}`}
          >
            {booking.status}
          </span>
          <span className="booking-card__id">{booking.id}</span>
        </div>
        <Link to={`/bookings/${booking.id}`} className="booking-card__title">
          {booking.title}
        </Link>
        <span className="booking-card__venue">
          {booking.venue} · {booking.location || "Hyderabad"}
        </span>
        <div className="booking-card__facts">
          <span>
            <Icon name="calendar" size={14} />
            {formatLongDate(booking.date)}
          </span>
          <span>
            <Icon name="clock" size={14} />
            {booking.time}
          </span>
          <span>
            <Icon name="ticket" size={14} />
            {booking.seats.join(", ")}
          </span>
        </div>
        <div className="booking-card__bottom">
          <strong>{money(booking.amount)}</strong>
          <div>
            <button
              className="text-button"
              type="button"
              onClick={() => onViewTicket(booking)}
            >
              View Ticket
            </button>
            <Link className="text-button" to={`/bookings/${booking.id}`}>
              View Details
            </Link>
            {booking.status === "Upcoming" && (
              <button
                className="text-button text-button--danger"
                type="button"
                onClick={() => onCancel(booking)}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
