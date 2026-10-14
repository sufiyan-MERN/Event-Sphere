import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SeatMap from '../components/SeatMap.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import { useBooking } from '../context/BookingContext.jsx';
import { formatLongDate } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { createSeatHold } from '../services/api.js';
import '../styles/pages/SeatPage.css';

export default function SeatPage() {
  const { id } = useParams();
  const { draft, updateDraft, beginBooking, toggleSeat, clearSeats, showToast, getItem } = useBooking();
  const item = getItem(id);
  const navigate = useNavigate();
  const selectedSeats = draft.itemId === id ? draft.selectedSeats : [];
  const [seconds, setSeconds] = useState(300);
  const deadline = useRef(null);

  useEffect(() => {
    if (!selectedSeats.length) {
      deadline.current = null;
      setSeconds(300);
      return undefined;
    }
    if (!deadline.current) { deadline.current = Date.now() + 300_000; setSeconds(299); }
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        deadline.current = null;
        clearSeats();
        setSeconds(300);
        showToast('Your seat hold expired. Choose your seats again.', 'error');
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [selectedSeats.length, clearSeats, showToast]);

  if (!item) return <main className="page-shell page-state"><EmptyState title="Choose a show first" detail="Pick a date and showtime to open the seat map." action="Explore events" onAction={() => navigate('/events')} /></main>;
  if (draft.itemId !== id) return <main className="page-shell page-state"><EmptyState title="Your seats are waiting" detail="Choose a date and showtime before selecting seats." action="See showtimes" onAction={() => navigate(`/${item.kind === 'movie' ? 'movies' : 'events'}/${id}`)} /></main>;

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return <main className="page-shell seat-page">
    <div className="flow-breadcrumb"><Link to="/events">Events</Link><span>/</span><Link to={`/${item.kind === 'movie' ? 'movies' : 'events'}/${item.id}`}>{item.title}</Link><span>/</span><strong>Choose seats</strong></div>
    <div className="seat-page-heading"><div><span className="eyebrow">THE BEST PART IS YOURS</span><h1>Pick your <em>perfect seat.</em></h1><p>{item.title} · {formatLongDate(draft.date)} · {draft.show}</p></div>{selectedSeats.length > 0 && <div className="reservation-clock"><span className="reservation-clock__ring"><Icon name="clock" size={17} /></span><span><small>SEATS RESERVED FOR</small><strong>{minutes}:{secs}</strong></span></div>}</div>
    <div className="seat-layout"><section className="seat-map-panel"><div className="seat-map-panel__top"><span className="eyebrow">{item.venue}</span><span>Tap seats to choose your view</span></div><SeatMap selectedSeats={selectedSeats} onToggle={toggleSeat} /></section><BookingSummary item={{ ...item, dateLabel: formatLongDate(draft.date), showLabel: draft.show }} seats={selectedSeats} onContinue={async () => {
      if (selectedSeats.length) {
        try {
          const res = await createSeatHold({
            itemId: draft.itemId,
            date: draft.date,
            time: draft.show,
            seatIds: selectedSeats.map((s) => s.id),
            holdToken: draft.holdToken || '',
          });
          if (res?.holdToken) updateDraft({ holdToken: res.holdToken });
        } catch {
          // Gracefully continue locally if offline
        }
      }
      navigate('/checkout');
    }} sticky disabled={!selectedSeats.length} /></div>
    <div className="seat-tip"><Icon name="spark" size={16} /><span>Seats are held for five minutes while you check out. Your real seat booking is simulated for this demo.</span></div>
  </main>;
}
