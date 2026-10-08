import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getItem } from '../data/content.js';
import { useBooking } from '../context/BookingContext.jsx';
import { calculatePrice, formatLongDate, money } from '../utils/format.js';
import PriceBreakdown from '../components/PriceBreakdown.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import '../styles/pages/CheckoutPage.css';

export default function CheckoutPage() {
  const { draft, updateDraft, showToast } = useBooking();
  const [promoInput, setPromoInput] = useState(draft.coupon || '');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const item = getItem(draft.itemId);
  const pricing = calculatePrice(draft.selectedSeats, draft.coupon);

  if (!item || !draft.selectedSeats.length) return <main className="page-shell page-state"><EmptyState title="Your booking is almost ready" detail="Choose a show and seat before heading to checkout." action="Explore what’s on" onAction={() => navigate('/events')} /></main>;

  const updateCustomer = (key, value) => updateDraft({ customer: { ...draft.customer, [key]: value } });
  const validate = () => {
    const next = {};
    if ((draft.customer.name || '').trim().length < 2) next.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customer.email || '')) next.email = 'Enter a valid email address.';
    const digits = (draft.customer.phone || '').replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) next.phone = 'Enter a valid phone number.';
    setErrors(next);
    if (Object.keys(next).length) return false;
    return true;
  };

  const applyCoupon = () => {
    const code = promoInput.trim().toUpperCase();
    if (['FIRSTBOOKING', 'STUDENT50'].includes(code)) {
      updateDraft({ coupon: code });
      showToast(`${code} applied. Your total has been updated.`);
    } else {
      updateDraft({ coupon: '' });
      showToast('That code didn’t work. Try FIRSTBOOKING or STUDENT50.', 'error');
    }
  };

  return <main className="page-shell checkout-page">
    <div className="flow-breadcrumb"><Link to="/events">Discover</Link><span>/</span><Link to={`/show/${item.id}/seats`}>Seats</Link><span>/</span><strong>Checkout</strong></div>
    <div className="checkout-heading"><div><span className="eyebrow">JUST ONE MORE THING</span><h1>Let’s make it <em>official.</em></h1><p>Your night is coming together.</p></div><div className="secure-note"><span className="secure-note__lock">✦</span><span>DEMO CHECKOUT<br /><small>No real payment details are collected.</small></span></div></div>
    <div className="checkout-grid"><section className="checkout-form-column">
      <div className="form-card"><div className="form-card__heading"><span className="step-number">01</span><div><span className="eyebrow">WHO’S GOING?</span><h2>Contact information</h2></div></div><div className="form-fields">
        <label className={`form-field ${errors.name ? 'form-field--error' : ''}`}><span>Full name</span><input value={draft.customer.name || ''} onChange={(event) => updateCustomer('name', event.target.value)} placeholder="The name on your ticket" autoComplete="name" />{errors.name && <small>{errors.name}</small>}</label>
        <div className="form-row"><label className={`form-field ${errors.email ? 'form-field--error' : ''}`}><span>Email address</span><input type="email" value={draft.customer.email || ''} onChange={(event) => updateCustomer('email', event.target.value)} placeholder="you@example.com" autoComplete="email" />{errors.email && <small>{errors.email}</small>}</label><label className={`form-field ${errors.phone ? 'form-field--error' : ''}`}><span>Phone number</span><input type="tel" value={draft.customer.phone || ''} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />{errors.phone && <small>{errors.phone}</small>}</label></div>
      </div></div>
      <div className="form-card"><div className="form-card__heading"><span className="step-number">02</span><div><span className="eyebrow">YOUR NIGHT OUT</span><h2>Booking details</h2></div></div><div className="checkout-event"><img src={item.image} alt={`${item.title} artwork`} /><div><span className="checkout-event__kind">{item.kind === 'movie' ? item.genre : item.category}</span><strong>{item.title}</strong><span>{item.venue} · {item.location}</span><span>{formatLongDate(draft.date)} · {draft.show}</span><span className="checkout-event__seats">{draft.selectedSeats.map((seat) => seat.id).join(', ')}</span></div><Link to={`/show/${item.id}/seats`} aria-label="Edit seats"><Icon name="arrow" size={18} /></Link></div></div>
      <div className="form-card coupon-card"><div className="form-card__heading"><span className="step-number">03</span><div><span className="eyebrow">A LITTLE EXTRA</span><h2>Have a promo code?</h2></div></div><div className="coupon-entry"><label className="form-field"><span>Promo code</span><input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Try FIRSTBOOKING" onKeyDown={(event) => { if (event.key === 'Enter') applyCoupon(); }} /></label><button className="button button--outline" type="button" onClick={applyCoupon}>Apply</button></div>{draft.coupon && <p className="coupon-applied"><Icon name="check" size={15} />{draft.coupon} is applied to this booking.</p>}</div>
    </section><aside className="checkout-side">
      <div className="checkout-total-card"><span className="eyebrow">YOUR BOOKING</span><h2>The details,<br /><em>all in one place.</em></h2><div className="checkout-total-card__seatline"><span>{draft.selectedSeats.length} {draft.selectedSeats.length === 1 ? 'seat' : 'seats'} selected</span><strong>{draft.selectedSeats.map((seat) => seat.id).join(', ')}</strong></div><PriceBreakdown pricing={pricing} /><button type="button" className="button button--coral button--wide checkout-pay-cta" onClick={() => { if (validate()) navigate('/payment'); }}>Continue to payment <Icon name="arrow" size={16} /></button><p className="checkout-demo-note">Demo only · No payment will be taken.</p></div>
      <div className="checkout-help"><span className="checkout-help__icon"><Icon name="spark" /></span><div><strong>A smooth night, from here.</strong><p>Your ticket will be saved to My Bookings after simulated payment.</p></div></div>
    </aside></div>
  </main>;
}
