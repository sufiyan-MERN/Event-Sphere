import { calculatePrice, money } from "../utils/format.js";
import Icon from "./Icon.jsx";
import "../styles/components/BookingSummary.css";

export default function BookingSummary({
  item,
  seats,
  onContinue,
  continueLabel = "Proceed to checkout",
  sticky = false,
  disabled = false,
}) {
  const pricing = calculatePrice(seats);
  return (
    <aside
      className={`booking-summary ${sticky ? "booking-summary--sticky" : ""}`}
    >
      <div className="booking-summary__top">
        <span className="eyebrow">YOUR EVENING</span>
        <span className="summary-status">
          <i /> Seats
        </span>
      </div>
      <h2>{item?.title || "Your selection"}</h2>
      <p className="booking-summary__meta">
        {item?.venue || "Choose a show"}
        {item?.location ? ` · ${item.location}` : ""}
      </p>
      <div className="booking-summary__event">
        <span>
          <Icon name="calendar" size={15} />
          {item?.dateLabel || item?.date || "Select a date"}
        </span>
        <span>
          <Icon name="clock" size={15} />
          {item?.showLabel || item?.time || "Select a show"}
        </span>
      </div>
      <div className="booking-summary__seats">
        <span>Selected seats</span>
        <strong>
          {seats.length ? seats.map((seat) => seat.id).join(", ") : "None yet"}
        </strong>
      </div>
      <div className="summary-line">
        <span>
          Ticket price{" "}
          <small>
            ({seats.length} {seats.length === 1 ? "seat" : "seats"})
          </small>
        </span>
        <strong>{money(pricing.ticketPrice)}</strong>
      </div>
      <div className="summary-line">
        <span>Convenience fee</span>
        <strong>{money(pricing.convenienceFee)}</strong>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money(pricing.ticketPrice + pricing.convenienceFee)}</strong>
      </div>
      <button
        type="button"
        className="button button--coral button--wide"
        disabled={disabled || !seats.length}
        onClick={onContinue}
      >
        {continueLabel}
        <Icon name="arrow" size={16} />
      </button>
      <p className="summary-footnote">Taxes are calculated at checkout.</p>
    </aside>
  );
}
