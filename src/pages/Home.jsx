import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel.jsx';
import CategoryRail from '../components/CategoryRail.jsx';
import { MediaCard, MiniMovieCard } from '../components/MediaCard.jsx';
import { SectionHeading } from '../components/CategoryRail.jsx';
import { events, movies, offers } from '../data/content.js';
import { useBooking } from '../context/BookingContext.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, LoadingSkeleton } from '../components/EmptyState.jsx';
import '../styles/pages/Home.css';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { location, setLocation, showToast, updateDraft } = useBooking();
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 380);
    return () => window.clearTimeout(timer);
  }, []);

  const applyOffer = (offer) => {
    if (offer.code === 'FIRSTBOOKING' || offer.code === 'STUDENT50') {
      updateDraft({ coupon: offer.code });
      showToast(`${offer.code} saved for your next checkout.`);
    } else {
      showToast('A little extra value is waiting in your event details.');
    }
  };

  const cityMovies = movies.filter((movie) => movie.location === location);
  const cityEvents = events.filter((event) => event.location === location);
  const trending = [...cityMovies, ...cityEvents].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return <main className="home-page">
    {location === 'Hyderabad' ? <HeroCarousel /> : <section className="page-shell city-preview-note" role="status"><div><span className="eyebrow">CITY PREVIEW</span><h2>Our sample shows are in <em>Hyderabad.</em></h2><p>This frontend preview has Hyderabad mock listings only. There are no seeded movie or event listings for {location} yet.</p></div><button type="button" className="button button--coral" onClick={() => setLocation('Hyderabad')}>Browse Hyderabad <Icon name="arrow" size={16} /></button></section>}
    <div className="home-intro page-shell">
      <div><span className="eyebrow"><span className="eyebrow-spark">✦</span> THE CITY IS YOURS</span><h2>Good things are <em>happening</em><br />in {location}.</h2></div>
      <p>From a seat in the dark to a song under the stars — find the moments worth going out for.</p>
    </div>

    <section className="page-shell category-section"><div className="category-section__top"><span className="eyebrow">PICK YOUR KIND OF NIGHT</span><span className="section-index">01 / 06</span></div><CategoryRail /></section>

    {loading ? <section className="page-shell home-loading"><LoadingSkeleton count={4} /></section> : <>
      <section className="page-shell section-block">
        <SectionHeading eyebrow="THE BIG SCREEN" title="A story worth the ticket." detail="Fresh releases and the ones everyone is talking about." to="/movies" />
        <div className="mini-movie-row">{cityMovies.length ? cityMovies.map((movie) => <MiniMovieCard key={movie.id} item={movie} />) : <EmptyState title={`No movie listings in ${location}`} detail="This preview’s sample films are currently based in Hyderabad." action="Browse Hyderabad" onAction={() => setLocation('Hyderabad')} />}</div>
      </section>
      <section className="event-band">
        <div className="page-shell section-block section-block--band">
          <SectionHeading eyebrow="OUT IN THE CITY" title="Make a night of it." detail="Live sounds, new laughs and a few happy surprises." to="/events" />
          <div className="media-grid media-grid--featured">{cityEvents.length ? cityEvents.slice(0, 4).map((event) => <MediaCard key={event.id} item={event} />) : <EmptyState title={`No event listings in ${location}`} detail="This preview’s sample shows are currently based in Hyderabad." action="Browse Hyderabad" onAction={() => setLocation('Hyderabad')} />}</div>
        </div>
      </section>
      <section className="page-shell section-block trending-section">
        <div className="trending-panel"><div><span className="eyebrow">THIS WEEK’S NOTE TO SELF</span><h2>Do the thing<br />you keep <em>talking about.</em></h2><p>Seats go quickly for the nights the whole city is buzzing about.</p><Link to="/events" className="button button--outline">Find your next thing <Icon name="arrow" size={16} /></Link></div><div className="trending-picks"><span className="trending-picks__label">TOP PICKS THIS WEEK</span>{trending.length ? trending.map((item, index) => <Link className="trending-pick" to={`/${item.kind === 'movie' ? 'movies' : 'events'}/${item.id}`} key={item.id}><img src={item.image} alt="" /><span><small>0{index + 1} · {item.kind === 'movie' ? 'ON SCREEN' : item.category?.toUpperCase()}</small><strong>{item.title}</strong></span><Icon name="arrow" size={15} /></Link>) : <p className="trending-empty">No sample listings seeded for {location} yet.</p>}</div></div>
      </section>
      <section className="page-shell section-block offers-section">
        <SectionHeading eyebrow="A GOOD DEAL, TOO" title="More yes for your plans." detail="A little something for every kind of night." />
        <div className="offer-grid">{offers.map((offer, index) => <button type="button" key={offer.title} className={`offer-card offer-card--${offer.tone}`} onClick={() => applyOffer(offer)}><span className="offer-card__number">0{index + 1}</span><span className="offer-card__spark">✦</span><span className="offer-card__code">{offer.code}</span><strong>{offer.title}</strong><span className="offer-card__detail">{offer.detail}</span><span className="offer-card__action">Save this offer <Icon name="arrow" size={15} /></span></button>)}</div>
      </section>
      <section className="page-shell signoff-strip"><div><span className="eyebrow">MAKE IT A SHOWBOOK NIGHT</span><h2>We’ll save you a seat.</h2></div><button type="button" className="button button--coral" onClick={() => navigate('/events')}>Explore what’s on <Icon name="arrow" size={16} /></button></section>
    </>}
  </main>;
}
