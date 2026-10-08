import { useEffect } from "react";
import Icon from "./Icon.jsx";
import "../styles/components/Modal.css";

export default function Modal({ open, title, children, onClose, actions }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="icon-button modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">A QUICK CHECK</span>
        <h2 id="modal-title">{title}</h2>
        <div className="modal-copy">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </section>
    </div>
  );
}
