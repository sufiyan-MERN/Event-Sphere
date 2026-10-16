import { Link } from "react-router-dom";
import { categories } from "../data/content.js";
import Icon from "./Icon.jsx";
import "../styles/components/CategoryRail.css";

export default function CategoryRail({ compact = false }) {
  return (
    <div className={`category-rail ${compact ? "category-rail--compact" : ""}`}>
      {categories.map((category, index) => {
        const to =
          category.label === "Movies"
            ? "/movies"
            : category.label === "Events"
              ? "/events"
              : `/events?category=${encodeURIComponent(category.label)}`;
        return (
          <Link
            className={`category-card category-card--${category.tone}`}
            to={to}
            key={category.label}
            data-reveal
            style={{ "--reveal-delay": `${index * 45}ms` }}
          >
            <span className="category-card__number">0{index + 1}</span>
            <span className="category-card__icon">{category.icon}</span>
            <span className="category-card__label">{category.label}</span>
            <Icon className="category-card__arrow" name="arrow" size={15} />
          </Link>
        );
      })}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  detail,
  to,
  action = "See all",
}) {
  return (
    <div className="section-heading" data-reveal>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {action}
          <Icon name="arrow" size={16} />
        </Link>
      )}
    </div>
  );
}
