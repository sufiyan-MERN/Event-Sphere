import Icon from './Icon.jsx';
import '../styles/components/SeatMap.css';

const rows = [
  { label: 'A', tier: 'Silver', price: 150 }, { label: 'B', tier: 'Silver', price: 150 },
  { label: 'C', tier: 'Gold', price: 250 }, { label: 'D', tier: 'Gold', price: 250 },
  { label: 'E', tier: 'Premium', price: 400 }, { label: 'F', tier: 'Premium', price: 400 },
];
const unavailable = { A: { 3: 'booked', 7: 'locked' }, B: { 2: 'locked', 8: 'booked' }, C: { 5: 'booked' }, D: { 1: 'booked', 7: 'locked' }, E: { 4: 'locked' }, F: { 6: 'booked' } };

export function Seat({ row, number, price, status, onClick }) {
  return <button type="button" className={`seat seat--${status}`} aria-label={`Seat ${row}${number}, ${status}, ${price} rupees`} title={`${row}${number} · ₹${price}${status !== 'available' && status !== 'selected' ? ` · ${status}` : ''}`} disabled={status === 'locked' || status === 'booked'} onClick={onClick}><span>{number}</span></button>;
}

export function SeatLegend() {
  return <div className="seat-legend"><span><i className="seat-key seat-key--available" />Available</span><span><i className="seat-key seat-key--selected" />Selected</span><span><i className="seat-key seat-key--locked" />Locked</span><span><i className="seat-key seat-key--booked" />Booked</span></div>;
}

export default function SeatMap({ selectedSeats, onToggle }) {
  return (
    <div className="seat-map-wrap">
      <div className="screen-curtain"><span className="screen-glow" /><span>SCREEN</span></div>
      <div className="seat-map-scroller" aria-label="Select seats; scroll within this map on smaller screens">
        <div className="seat-map">
          {rows.map((row) => <div className="seat-row" key={row.label}>
            <span className="seat-row__label">{row.label}</span>
            <div className="seat-row__seats">{Array.from({ length: 8 }, (_, index) => {
              const number = index + 1;
              const baseStatus = unavailable[row.label]?.[number] || 'available';
              const selected = selectedSeats.some((seat) => seat.id === `${row.label}${number}`);
              const status = selected ? 'selected' : baseStatus;
              const seat = { id: `${row.label}${number}`, price: row.price, tier: row.tier };
              return <Seat key={seat.id} row={row.label} number={number} price={row.price} status={status} onClick={() => onToggle(seat)} />;
            })}</div>
            <span className="seat-row__label seat-row__price">{row.price}</span>
          </div>)}
        </div>
      </div>
      <div className="seat-tier-note"><span>Front row, best night.</span><span>Silver ₹150 <i /> Gold ₹250 <i /> Premium ₹400</span></div>
      <SeatLegend />
    </div>
  );
}
