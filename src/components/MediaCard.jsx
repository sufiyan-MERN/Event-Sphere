import { Link } from "react-router-dom";
import { useBooking } from "../context/BookingContext.jsx";
import { formatShortDate, money } from "../utils/format.js";
import Icon from "./Icon.jsx";
import PosterImage from "./PosterImage.jsx";
import "../styles/components/MediaCard.css";

export function MediaCard({ item, compact = false, revealDelay }) {
  const { favorites, toggleFavorite } = useBooking();
  const detailPath = `/${item.kind === "movie" ? "movies" : "events"}/${item.id}`;
  const saved = favorites.includes(item.id);
  const revealStyle =
    typeof revealDelay === "number" ? { "--reveal-delay": `${revealDelay}ms` } : undefined;

  return (
    <article
      className={`media-card ${compact ? "media-card--compact" : ""}`}
      data-reveal
      style={revealStyle}
    >
      <Link
        className="media-card__image-link"
        to={detailPath}
        aria-label={`View ${item.title}`}
      >
        <PosterImage
          className="media-card__image"
          src={item.image}
          alt={`${item.title} artwork`}
        />
        <span className="media-card__image-shade" />
        <span className="media-card__tag">
          {item.kind === "movie" ? item.language : item.category}
        </span>
        <span className="media-card__rating">
          <Icon name="star" size={13} />
          {item.rating}
        </span>
      </Link>
      <button
        type="button"
        className={`favorite-button ${saved ? "favorite-button--active" : ""}`}
        onClick={() => toggleFavorite(item.id)}
        aria-label={
          saved
            ? `Remove ${item.title} from saved events`
            : `Save ${item.title}`
        }
        aria-pressed={saved}
      >
        <Icon name="heart" size={18} />
      </button>
      <div className="media-card__body">
        <div className="media-card__date">
          <Icon name="calendar" size={13} />
          {formatShortDate(item.date)}
          {item.kind === "event" && item.time && (
            <>
              <span className="media-card__date-dot">·</span>
              {item.time}
            </>
          )}
          <span className="media-card__date-dot">·</span>
          {item.location}
        </div>
        <Link className="media-card__title" to={detailPath}>
          {item.title}
        </Link>
        <div className="media-card__bottom">
          <span className="media-card__meta">
            {item.kind === "movie"
              ? `${item.genre} · ${item.duration}`
              : `${item.venue} · ${money(item.price)} onwards`}
          </span>
          <Link className="media-card__arrow" to={detailPath}>
            {item.kind === "movie" ? "Book now" : "View details"}
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function MiniMovieCard({ item, revealDelay }) {
  const path = `/movies/${item.id}`;
  const revealStyle =
    typeof revealDelay === "number" ? { "--reveal-delay": `${revealDelay}ms` } : undefined;
  return (
    <article className="mini-movie-card" data-reveal style={revealStyle}>
      <Link to={path} className="mini-movie-card__poster">
        <PosterImage src={item.image} alt={`${item.title} poster`} />
        <span className="mini-movie-card__rate">
          <Icon name="star" size={12} />
          {item.rating}
        </span>
      </Link>
      <div className="mini-movie-card__copy">
        <Link to={path} className="mini-movie-card__title">
          {item.title}
        </Link>
        <span>{item.genre}</span>
        <small>
          {item.language} · {item.duration}
        </small>
        <Link to={path} className="mini-movie-card__book">
          Book now <Icon name="arrow" size={14} />
        </Link>
      </div>
    </article>
  );
}
