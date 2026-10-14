import { money } from "../utils/format.js";
import "../styles/components/PriceBreakdown.css";

export default function PriceBreakdown({ pricing, compact = false }) {
  return (
    <div
      className={`price-breakdown ${compact ? "price-breakdown--compact" : ""}`}
    >
      <div className="price-breakdown__row">
        <span>Ticket price</span>
        <strong>{money(pricing.ticketPrice)}</strong>
      </div>
      <div className="price-breakdown__row">
        <span>Convenience fee</span>
        <strong>{money(pricing.convenienceFee)}</strong>
      </div>
      <div className="price-breakdown__row">
        <span>Taxes</span>
        <strong>{money(pricing.taxes)}</strong>
      </div>
      {pricing.discount > 0 && (
        <div className="price-breakdown__row price-breakdown__row--discount">
          <span>Discount</span>
          <strong>−{money(pricing.discount)}</strong>
        </div>
      )}
      <div className="price-breakdown__total">
        <span>Total payable</span>
        <strong>{money(pricing.total)}</strong>
      </div>
    </div>
  );
}
