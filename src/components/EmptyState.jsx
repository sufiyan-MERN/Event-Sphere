import Icon from "./Icon.jsx";
import "../styles/components/EmptyState.css";

export function EmptyState({
  title = "Nothing here just yet",
  detail = "Try a different date or explore something new.",
  action,
  onAction,
}) {
  return (
    <div className="empty-state" data-reveal>
      <span className="empty-state__icon">
        <Icon name="spark" size={24} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action && (
        <button
          className="button button--outline"
          type="button"
          onClick={onAction}
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "We couldn’t load that",
  detail = "Something went wrong on our side. Give it another go.",
  action = "Try again",
  onAction,
}) {
  return (
    <div className="empty-state empty-state--error" role="alert" data-reveal>
      <span className="empty-state__icon empty-state__icon--error">
        <Icon name="close" size={22} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {onAction && (
        <button className="button button--coral" type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__image" />
      <div className="skeleton-card__pill" />
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line" />
    </div>
  );
}

function PosterSkeleton() {
  return (
    <div className="skeleton-card skeleton-card--poster">
      <div className="skeleton-card__image skeleton-card__image--tall" />
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line" />
    </div>
  );
}

/**
 * Loading placeholders. `variant="posters"` gives tall cinema-style posters,
 * the default gives landscape listing cards.
 */
export function LoadingSkeleton({
  count = 4,
  variant = "grid",
  label = "Loading events",
}) {
  const posters = variant === "posters";
  return (
    <div
      className={`skeleton-grid ${posters ? "skeleton-grid--posters" : ""}`}
      aria-label={label}
      aria-busy="true"
      role="status"
    >
      {Array.from({ length: count }, (_, index) =>
        posters ? <PosterSkeleton key={index} /> : <CardSkeleton key={index} />,
      )}
    </div>
  );
}
