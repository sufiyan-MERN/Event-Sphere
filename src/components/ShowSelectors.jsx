import { formatShortDate, money } from "../utils/format.js";
import Icon from "./Icon.jsx";
import "../styles/components/ShowSelectors.css";

const exampleDates = ["2026-10-10", "2026-10-11", "2026-10-12"];
const showTimes = ["10:00 AM", "1:30 PM", "4:30 PM", "7:30 PM"];

export function DateSelector({ selected, onSelect }) {
  const dates = [
    ...new Set([...exampleDates, selected].filter(Boolean)),
  ].sort();
  return (
    <div className="date-selector">
      {dates.map((date) => {
        const [weekday, day, month] = formatShortDate(date)
          .replace(",", "")
          .split(" ");
        return (
          <button
            type="button"
            key={date}
            className={`date-card ${selected === date ? "date-card--active" : ""}`}
            onClick={() => onSelect(date)}
          >
            <span>{weekday}</span>
            <strong>{day}</strong>
            <small>{month}</small>
          </button>
        );
      })}
    </div>
  );
}

export function ShowTimeSelector({ item, selectedDate, onSelect }) {
  const shortFormat = formatShortDate(selectedDate).split(" ");
  return (
    <div className="show-grid">
      {showTimes.map((time, index) => {
        const available = [54, 38, 26, 19][index];
        return (
          <button
            type="button"
            key={time}
            className="show-time-card"
            onClick={() => onSelect(time)}
          >
            <span className="show-time-card__time">
              {time}
              <Icon name="arrow" size={14} />
            </span>
            <span className="show-time-card__meta">
              {item.kind === "movie"
                ? item.language
                : item.language || "Live show"}{" "}
              · {item.duration}
            </span>
            <span className="show-time-card__bottom">
              <span>
                <small>FROM</small>
                <strong>{money(item.price)}</strong>
              </span>
              <span>
                <i
                  className={
                    available < 25
                      ? "show-time-card__seats show-time-card__seats--low"
                      : "show-time-card__seats"
                  }
                />
                {available} seats
              </span>
            </span>
            <span className="show-time-card__date">
              {shortFormat.join(" ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
