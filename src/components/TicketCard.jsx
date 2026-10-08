import { formatLongDate, money } from '../utils/format.js';
import Icon from './Icon.jsx';
import '../styles/components/TicketCard.css';

export default function TicketCard({ booking, onDownload, compact = false }) {
  if (!booking) return null;
  return (
    <article className={`ticket-card ${compact ? 'ticket-card--compact' : ''}`}>
      <div className="ticket-card__top"><div><span className="eyebrow">SHOWBOOK PRESENTS</span><span className="ticket-card__confirmed"><Icon name="check" size={14} /> Booking confirmed</span></div><div className="ticket-card__logo"><span className="brand-mark"><span /><span /><span /></span></div></div>
      <div className="ticket-card__event">
        <img src={booking.poster} alt={`${booking.title} poster`} className="ticket-card__poster" />
        <div className="ticket-card__event-copy"><span className="ticket-card__kind">{booking.kind === 'movie' ? 'ON THE BIG SCREEN' : 'LIVE IN HYDERABAD'}</span><h2>{booking.title}</h2><p>{booking.venue} · {booking.location || 'Hyderabad'}</p><div className="ticket-card__id">BOOKING ID <strong>{booking.id}</strong></div></div>
      </div>
      <div className="ticket-card__perforation"><span /><span /></div>
      <div className="ticket-card__details">
        <div><small>DATE</small><strong>{formatLongDate(booking.date)}</strong></div><div><small>TIME</small><strong>{booking.time}</strong></div><div><small>SEATS</small><strong>{booking.seats.join(', ')}</strong></div><div><small>GUEST</small><strong>{booking.customerName}</strong></div>
      </div>
      <div className="ticket-card__bottom"><div className="ticket-card__amount"><small>PAID</small><strong>{money(booking.amount)}</strong></div><div className="qr-placeholder" aria-label="QR code placeholder"><div className="qr-grid">{Array.from({ length: 49 }, (_, index) => <i key={index} className={(index * 7 + index * index + 3) % 5 < 2 ? 'qr-on' : ''} />)}</div><span>SCAN AT ENTRY</span></div></div>
      {!compact && <div className="ticket-card__actions"><button type="button" className="button button--coral" onClick={onDownload}><Icon name="download" size={16} />Download ticket</button><span>Present this ticket at the venue.</span></div>}
    </article>
  );
}
