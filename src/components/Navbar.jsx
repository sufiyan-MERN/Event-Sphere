import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { allItems } from "../data/content.js";
import { useBooking } from "../context/BookingContext.jsx";
import Icon from "./Icon.jsx";
import "../styles/components/Navbar.css";

const cities = ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"];
const routeFor = (item) =>
  `/${item.kind === "movie" ? "movies" : "events"}/${item.id}`;

export default function Navbar() {
  const { location, setLocation, profile, isAuthenticated, backendHealth } = useBooking();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Compact floating navbar once the page is scrolled past the hero threshold.
  // Passive listener + rAF throttle keeps scroll jank-free; setState bails out
  // when the boolean does not change. The timeout is a safety net: browsers
  // drop rAF callbacks in hidden/occluded tabs, which would otherwise leave
  // the throttle flag stuck and freeze the navbar state.
  useEffect(() => {
    let frame = 0;
    let fallback = 0;
    const update = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (fallback) {
        clearTimeout(fallback);
        fallback = 0;
      }
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
      if (!fallback) fallback = setTimeout(update, 120);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (fallback) clearTimeout(fallback);
    };
  }, []);

  // Escape closes any open overlay.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setCityOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Collapse the mobile menu if the viewport grows back to desktop.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = (event) => {
      if (event.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return allItems
      .filter(
        (item) =>
          item.location === location &&
          `${item.title} ${item.genre} ${item.category || ""} ${item.location}`
            .toLowerCase()
            .includes(term),
      )
      .slice(0, 5);
  }, [query, location]);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Movies", to: "/movies" },
    { label: "Events", to: "/events" },
  ];

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/events?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <header
      className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
    >
      <div className="nav-wrap">
        <Link
          to="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
          aria-label="ShowBook home"
        >
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-word">
            show<span>book</span>
            <i>.</i>
          </span>
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: backendHealth?.online ? "#10b981" : "#f59e0b",
              marginLeft: "4px",
              boxShadow: backendHealth?.online ? "0 0 6px #10b981" : "none",
              alignSelf: "center",
            }}
            title={backendHealth?.online ? `API Connected (${backendHealth?.persistence?.status || "Ready"})` : "API Offline (using resilient local mock)"}
          />
        </Link>
        <nav
          className={`primary-nav ${menuOpen ? "primary-nav--open" : ""}`}
          aria-label="Main navigation"
        >
          {navItems.map((item, index) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              style={{ "--i": index }}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link--active" : ""}`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="mobile-nav-extra">
            <Link to="/bookings" onClick={() => setMenuOpen(false)}>
              My bookings
            </Link>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              My profile
            </Link>
          </div>
        </nav>
        <div className="nav-actions">
          <div className="city-picker-wrap">
            <button
              className="city-picker"
              type="button"
              onClick={() => {
                setCityOpen((open) => !open);
                setSearchOpen(false);
              }}
              aria-expanded={cityOpen}
            >
              <Icon name="pin" size={17} />
              <span>{location}</span>
              <Icon name="chevron" size={14} />
            </button>
            {cityOpen && (
              <div
                className="city-menu"
                role="dialog"
                aria-label="Choose your city"
              >
                <p className="eyebrow">PICK YOUR CITY</p>
                <div className="city-grid">
                  {cities.map((city) => (
                    <button
                      type="button"
                      key={city}
                      className={
                        city === location
                          ? "city-option city-option--active"
                          : "city-option"
                      }
                      onClick={() => {
                        setLocation(city);
                        setCityOpen(false);
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className="search-toggle"
            type="button"
            onClick={() => {
              setSearchOpen((open) => !open);
              setCityOpen(false);
            }}
            aria-label="Search movies and events"
          >
            <Icon name="search" />
          </button>
          {isAuthenticated && (
            <Link
              to="/profile"
              className="avatar-link"
              aria-label={`Profile for ${profile.name}`}
            >
              <span className="avatar avatar--nav">
                {profile.avatar || "AM"}
              </span>
            </Link>
          )}
          <Link
            to="/events"
            className="nav-cta"
            onClick={() => setMenuOpen(false)}
          >
            Book tickets
          </Link>
          <button
            className="mobile-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={23} />
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="search-popover">
          <form className="global-search" onSubmit={submitSearch}>
            <Icon name="search" size={19} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find movies, music, good times…"
              aria-label="Search movies and events"
            />
            {query && (
              <button
                type="button"
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <Icon name="close" size={17} />
              </button>
            )}
          </form>
          {query && (
            <div className="search-results">
              {matches.length ? (
                matches.map((item) => (
                  <Link
                    to={routeFor(item)}
                    className="search-result"
                    key={item.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                    }}
                  >
                    <img src={item.image} alt="" />
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.kind === "movie" ? item.genre : item.category} ·{" "}
                        {item.location}
                      </small>
                    </span>
                    <Icon name="arrow" size={16} />
                  </Link>
                ))
              ) : (
                <p className="search-no-result">
                  No matches yet. Try a different search.
                </p>
              )}
              {matches.length > 0 && (
                <button
                  type="button"
                  className="search-all"
                  onClick={submitSearch}
                >
                  See all results <Icon name="arrow" size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div
        className={`nav-scrim ${menuOpen ? "nav-scrim--visible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
    </header>
  );
}
