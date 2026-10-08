import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getItem } from "../data/content.js";
import { useBooking } from "../context/BookingContext.jsx";
import { formatLongDate, money } from "../utils/format.js";
import {
  DateSelector,
  ShowTimeSelector,
} from "../components/ShowSelectors.jsx";
import Icon from "../components/Icon.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import "../styles/pages/DetailPage.css";

export default function DetailPage({ kind }) {
  const { id } = useParams();
  const item = getItem(id);
  const [date, setDate] = useState(item?.date || "2026-10-10");
  const [show, setShow] = useState(item?.time || "7:30 PM");
  useEffect(() => {
    setDate(item?.date || "2026-10-10");
    setShow(item?.time || "7:30 PM");
  }, [id, item?.date, item?.time]);
  const navigate = useNavigate();
  const { beginBooking, favorites, toggleFavorite } = useBooking();
  const matchingKind = useMemo(() => item && item.kind === kind, [item, kind]);

  if (!item || !matchingKind)
    return (
      <main className="page-shell detail-not-found">
        <EmptyState
          title="That show moved off the marquee"
          detail="Try the full listing to find your next plan."
          action="Browse all events"
          onAction={() => navigate("/events")}
        />
      </main>
    );

  const path = `/${item.kind === "movie" ? "movies" : "events"}`;
  const saved = favorites.includes(item.id);
  const goToSeats = (time = show) => {
    beginBooking(item, date, time);
    navigate(`/show/${item.id}/seats`);
  };

  return (
    <main className="detail-page">
      <div
        className="detail-hero"
        style={{ "--detail-image": `url("${item.image}")` }}
      >
        <div className="detail-hero__veil" />
        <div className="page-shell detail-hero__inner">
          <div className="detail-breadcrumb">
            <Link to={path}>{item.kind === "movie" ? "Movies" : "Events"}</Link>
            <span>/</span>
            <span>{item.category || item.genreTag}</span>
          </div>
          <span className="eyebrow detail-eyebrow">
            {item.kind === "movie"
              ? "THE BIG SCREEN"
              : item.category?.toUpperCase()}
          </span>
          <h1>
            {item.title}
            <span className="hero-period">.</span>
          </h1>
          <p className="detail-hero__sub">{item.description}</p>
          <div className="detail-hero__actions">
            <button
              type="button"
              className="button button--coral"
              onClick={() => goToSeats()}
            >
              <Icon name="ticket" size={17} />
              Book Tickets
            </button>
            <button
              type="button"
              className={`button button--ghost ${saved ? "button--saved" : ""}`}
              onClick={() => toggleFavorite(item.id)}
            >
              <Icon name="heart" size={17} />
              {saved ? "Saved" : "Save for later"}
            </button>
          </div>
        </div>
      </div>

      <div className="page-shell detail-main">
        <aside className="detail-poster-column">
          <img
            className="detail-poster"
            src={item.image}
            alt={`${item.title} poster`}
          />
          <div className="detail-score">
            <span className="detail-score__icon">
              <Icon name="star" size={18} />
            </span>
            <div>
              <strong>
                {item.rating}
                <small>/ 10</small>
              </strong>
              <span>audience score</span>
            </div>
          </div>
          <div className="detail-facts">
            <span>
              <Icon name="clock" size={16} />
              {item.duration}
            </span>
            <span>
              <Icon name="pin" size={16} />
              {item.venue}
            </span>
            <span>
              <Icon name="location" size={16} />
              {item.location}
            </span>
            <span>
              <Icon name="ticket" size={16} />
              From {money(item.price)}
            </span>
          </div>
        </aside>
        <section className="detail-content">
          <div className="detail-overview">
            <span className="eyebrow">THE STORY SO FAR</span>
            <h2>
              A little something
              <br />
              to <em>look forward to.</em>
            </h2>
            <p>
              {item.description} Settle in for a night that feels like it was
              planned just for you. Doors open before the show; give yourself a
              little time to find your seat.
            </p>
            <div className="detail-tags">
              {(item.tags || []).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="booking-selection">
            <div className="booking-section-heading">
              <div>
                <span className="eyebrow">MAKE YOUR PICK</span>
                <h2>Choose a date</h2>
              </div>
              <span className="selection-note">OCTOBER 2026</span>
            </div>
            <DateSelector selected={date} onSelect={setDate} />
            <div className="booking-section-heading booking-section-heading--shows">
              <div>
                <span className="eyebrow">
                  {formatLongDate(date).toUpperCase()}
                </span>
                <h2>Pick your show</h2>
              </div>
              <span className="selection-note">{item.location}</span>
            </div>
            <ShowTimeSelector
              item={item}
              selectedDate={date}
              onSelect={(time) => goToSeats(time)}
            />
            <p className="detail-terms">
              <strong>Good to know</strong> Tickets are for the selected show
              only. Arrive a little early. Event timing and entry policies may
              vary by venue; check the venue’s guidance before attending.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
