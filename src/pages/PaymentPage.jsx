import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getItem } from '../data/content.js';
import { useBooking } from '../context/BookingContext.jsx';
import { calculatePrice, money } from '../utils/format.js';
import PriceBreakdown from '../components/PriceBreakdown.jsx';
import PaymentForm from '../components/PaymentForm.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import '../styles/pages/PaymentPage.css';

export default function PaymentPage() {
  const { draft, updateDraft, confirmBooking, showToast } = useBooking();
  const item = getItem(draft.itemId);
  const pricing = useMemo(() => calculatePrice(draft.selectedSeats, draft.coupon), [draft.selectedSeats, draft.coupon]);
  const [state, setState] = useState('idle');
  const navigate = useNavigate();

  useEffect(() => {
    if (state !== 'processing') return undefined;
    let isMounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const booking = await confirmBooking(pricing);
        if (!isMounted) return;
        if (booking) {
          showToast('Payment successful. Your night is booked.');
          navigate('/booking/success', { state: { booking } });
        } else {
          setState('failed');
        }
      } catch (err) {
        if (isMounted) setState('failed');
      }
    }, 1500);
    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [state, confirmBooking, pricing, navigate, showToast]);

  if (!item || !draft.selectedSeats.length) return <main className="page-shell page-state"><EmptyState title="No payment due yet" detail="Select your show and seats before continuing." action="Explore events" onAction={() => navigate('/events')} /></main>;

  const cancel = () => { setState('cancelled'); showToast('Payment cancelled. Your seats are still held briefly.', 'error'); };

  return <main className="page-shell payment-page">
    <div className="flow-breadcrumb"><Link to="/checkout">Checkout</Link><span>/</span><strong>Payment</strong></div>
    <div className="payment-heading"><div><span className="eyebrow">ALMOST AT THE SHOW</span><h1>Pick how you’d <em>like to pay.</em></h1><p>This is a safe frontend simulation — no payment details are collected.</p></div><div className="payment-amount"><small>AMOUNT DUE</small><strong>{money(pricing.total)}</strong></div></div>
    <div className="payment-grid"><section className="payment-methods"><PaymentForm selectedMethod={draft.paymentMethod} onSelect={(paymentMethod) => updateDraft({ paymentMethod })} state={state} onPay={() => setState('processing')} onFailure={() => setState('failed')} onCancel={cancel} onRetry={() => setState('idle')} amount={money(pricing.total)} /></section>
      <aside className="payment-summary"><span className="eyebrow">TONIGHT’S PLAN</span><div className="payment-event"><img src={item.image} alt="" /><div><strong>{item.title}</strong><span>{item.venue}</span><span>{draft.date} · {draft.show}</span></div></div><div className="payment-seatline"><span>Seats</span><strong>{draft.selectedSeats.map((seat) => seat.id).join(', ')}</strong></div><PriceBreakdown pricing={pricing} /><Link className="payment-edit-link" to="/checkout">Edit booking details <Icon name="arrow" size={14} /></Link></aside>
    </div>
  </main>;
}
