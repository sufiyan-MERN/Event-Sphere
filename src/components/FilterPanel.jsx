import Icon from "./Icon.jsx";
import "../styles/components/FilterPanel.css";

export default function FilterPanel({ children, onReset, className = "" }) {
  return (
    <aside className={`filter-panel ${className}`}>
      <div className="filter-panel__top">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h2>Filters</h2>
        </div>
        <button className="text-button" type="button" onClick={onReset}>
          <Icon name="close" size={13} /> Clear all
        </button>
      </div>
      {children}
    </aside>
  );
}
