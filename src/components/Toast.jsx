import Icon from "./Icon.jsx";
import "../styles/components/Toast.css";

export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.tone || "success"}`} role="status">
      <span className="toast__icon">
        <Icon name={toast.tone === "error" ? "close" : "check"} size={17} />
      </span>
      <span>{toast.message}</span>
      <button
        className="icon-button toast__close"
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
