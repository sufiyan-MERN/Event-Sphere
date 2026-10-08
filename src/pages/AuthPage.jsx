import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext.jsx';
import Icon from '../components/Icon.jsx';
import '../styles/pages/AuthPage.css';

export default function AuthPage({ mode = 'login' }) {
  const register = mode === 'register';
  const { updateProfile, signIn, showToast } = useBooking();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (register && form.name.trim().length < 2) { setError('Please add your name.'); return; }
    const name = register ? form.name.trim() : form.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    updateProfile({ name, email: form.email, ...(form.phone ? { phone: form.phone } : {}), avatar: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() });
    signIn();
    showToast(register ? 'Your demo profile is ready.' : 'You’re signed in for this local demo.');
    navigate('/profile');
  };

  return <main className="auth-page page-shell"><div className="auth-art"><span className="auth-art__spark">✦</span><span className="eyebrow">SHOWBOOK · HYDERABAD</span><h1>{register ? 'A good story starts with a plan.' : 'Welcome back to the good stuff.'}</h1><p>{register ? 'Keep your tickets, favourites and next nights out all in one place.' : 'Your saved shows and upcoming nights are just around the corner.'}</p><div className="auth-art__scribble">MAKE TONIGHT<br /><em>A STORY.</em></div></div><form className="auth-card" onSubmit={submit} noValidate><span className="eyebrow">{register ? 'COME ON IN' : 'GOOD TO SEE YOU'}</span><h2>{register ? 'Create your profile.' : 'Sign in to ShowBook.'}</h2><p className="auth-card__note">{register ? 'This is a local demo profile; no password or account server is used.' : 'Demo sign-in only — this stays in your browser.'}</p>{register && <label className="form-field"><span>Your name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" autoComplete="name" /></label>}<label className="form-field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" autoComplete="email" /></label>{register && <label className="form-field"><span>Phone number (optional)</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" autoComplete="tel" /></label>}{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button button--coral button--wide">{register ? 'Create profile' : 'Continue'}<Icon name="arrow" size={16} /></button><p className="auth-switch">{register ? 'Already have a profile?' : 'New to ShowBook?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create one'}</Link></p><Link to="/" className="text-link auth-home-link">Back to home <Icon name="arrow" size={15} /></Link></form></main>;
}
