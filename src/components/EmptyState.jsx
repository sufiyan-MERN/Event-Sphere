import Icon from "./Icon.jsx";
import "../styles/components/EmptyState.css";

export function EmptyState({
  title = "Nothing here just yet",
  detail = "Try a different date or explore something new.",
  action,
  onAction,
}) {
  return (
    <div className="empty-state">
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

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="skeleton-grid" aria-label="Loading events" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton-card__image" />
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}
