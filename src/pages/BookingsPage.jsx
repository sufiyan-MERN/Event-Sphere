import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import BookingCard from '../components/BookingCard.jsx';
import TicketCard from '../components/TicketCard.jsx';
import Modal from '../components/Modal.jsx';
import { useBooking } from '../context/BookingContext.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useEffect } from 'react';
import { money } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import '../styles/pages/BookingsPage.css';

export function BookingsPage() {
  const { bookings, updateBookingStatus, showToast } = useBooking();
  const [tab, setTab] = useState('Upcoming');
  const [cancelTarget, setCancelTarget] = useState(null);
  const navigate = useNavigate();
  const visible = useMemo(() => bookings.filter((booking) => booking.status === tab), [bookings, tab]);

  const downloadTicket = () => { window.print(); showToast('Print view opened. Choose “Save as PDF” for a ticket copy.'); };
  const confirmCancel = () => {
    updateBookingStatus(cancelTarget.id, 'Cancelled');
    setCancelTarget(null);
    showToast('Booking cancelled in this demo.');
  };

  return <main className="page-shell bookings-page">
    <div className="bookings-heading"><div><span className="eyebrow">YOUR STORY SO FAR</span><h1>Plans made <em>real.</em></h1><p>Tickets, memories and nights still to come.</p></div><Link to="/events" className="button button--coral">Find your next show <Icon name="arrow" size={16} /></Link></div>
    <div className="booking-tabs" role="tablist" aria-label="Booking status">{['Upcoming', 'Completed', 'Cancelled'].map((status) => <button type="button" role="tab" aria-selected={tab === status} className={tab === status ? 'booking-tab booking-tab--active' : 'booking-tab'} key={status} onClick={() => setTab(status)}>{status}<span>{bookings.filter((booking) => booking.status === status).length}</span></button>)}</div>
    {visible.length ? <div className="booking-list">{visible.map((booking) => <BookingCard key={booking.id} booking={booking} onViewTicket={() => navigate(`/bookings/${booking.id}`)} onCancel={setCancelTarget} />)}</div> : <EmptyState title={`No ${tab.toLowerCase()} plans yet`} detail={tab === 'Upcoming' ? 'The next great night is one scroll away.' : 'Your past and cancelled bookings will show here.'} action="Explore events" onAction={() => navigate('/events')} />}
    <Modal open={Boolean(cancelTarget)} title="Cancel this booking?" onClose={() => setCancelTarget(null)} actions={<><button className="button button--outline" type="button" onClick={() => setCancelTarget(null)}>Keep my seats</button><button className="button button--coral" type="button" onClick={confirmCancel}>Cancel booking</button></>}>{cancelTarget && <p>Cancel <strong>{cancelTarget.title}</strong> in this local demo? The booking will move to your Cancelled tab. No refund or venue action is triggered.</p>}</Modal>
  </main>;
}

export function BookingSuccessPage() {
  const { state } = useLocation();
  const { bookings, lastConfirmedBookingId, showToast } = useBooking();
  const booking = state?.booking || bookings.find((record) => record.id === lastConfirmedBookingId);
  const navigate = useNavigate();
  const printTicket = () => { window.print(); showToast('Print view opened. Choose “Save as PDF” to keep your ticket.'); };
  if (!booking) return <main className="page-shell page-state"><EmptyState title="No confirmed ticket yet" detail="Complete the simulated checkout to see your booking confirmation." action="Explore events" onAction={() => navigate('/events')} /></main>;
  return <main className="page-shell success-page"><div className="success-copy"><span className="success-check"><Icon name="check" size={29} /></span><span className="eyebrow">THE NIGHT IS YOURS</span><h1>Booking<br /><em>confirmed.</em></h1><p>Your next great story has a date. We’ve saved your ticket below.</p><div className="success-meta"><span>BOOKING ID</span><strong>{booking.id}</strong><span>PAYMENT</span><strong>Successful · {money(booking.amount)}</strong></div><div className="success-actions"><button type="button" className="button button--coral" onClick={printTicket}><Icon name="download" size={16} />Download ticket</button><Link to={`/bookings/${booking.id}`} className="button button--outline">View booking</Link><Link to="/" className="text-link">Back to home <Icon name="arrow" size={15} /></Link></div></div><div className="success-ticket"><TicketCard booking={booking} compact /><div className="ticket-watermark">SB <span>✦</span></div></div></main>;
}

export function BookingDetailPage() {
  const { id } = useParams();
  const { bookings, showToast } = useBooking();
  const booking = bookings.find((record) => record.id === id);
  const navigate = useNavigate();
  useEffect(() => { if (!booking) return; document.title = `${booking.title} ticket · ShowBook`; }, [booking]);
  const printTicket = () => { window.print(); showToast('Print view opened. Choose “Save as PDF” for a copy.'); };
  if (!booking) return <main className="page-shell page-state"><EmptyState title="We couldn’t find that booking" detail="Head back to My Bookings to see your tickets." action="My bookings" onAction={() => navigate('/bookings')} /></main>;
  return <main className="page-shell booking-detail-page"><div className="flow-breadcrumb"><Link to="/bookings">My bookings</Link><span>/</span><strong>{booking.id}</strong></div><div className="booking-detail-heading"><div><span className="eyebrow">YOUR TICKET</span><h1>One for <em>the memory book.</em></h1><p>{booking.title} · {booking.status}</p></div><button type="button" className="button button--coral" onClick={printTicket}><Icon name="download" size={16} />Download ticket</button></div><div className="booking-detail-ticket"><TicketCard booking={booking} compact /></div><div className="booking-detail-note"><span><Icon name="spark" /></span><p>This is a frontend demo ticket. It is not valid for admission and no venue booking has been created.</p></div></main>;
}
