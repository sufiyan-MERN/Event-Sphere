import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { allItems } from "../data/content.js";
import { useBooking } from "../context/BookingContext.jsx";
import Icon from "./Icon.jsx";
import "../styles/components/Navbar.css";

const cities = ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"];
const routeFor = (item) =>
  `/${item.kind === "movie" ? "movies" : "events"}/${item.id}`;

export default function Navbar() {
  const { location, setLocation, profile, isAuthenticated } = useBooking();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

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
    { label: "Sports", to: "/events?category=Sports" },
    { label: "Concerts", to: "/events?category=Concerts" },
    { label: "Comedy", to: "/events?category=Comedy" },
    // { label: "Login", to: "/login" },
  ];

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/events?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
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
        </Link>
        <nav
          className={`primary-nav ${menuOpen ? "primary-nav--open" : ""}`}
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {/* <NavLink
            to="/events?category=Theatre"
            onClick={() => setMenuOpen(false)}
            className="nav-link nav-link--extra"
          >
            Theatre
          </NavLink> */}
          {/* <NavLink
            to="/events?category=Workshops"
            onClick={() => setMenuOpen(false)}
            className="nav-link nav-link--extra"
          >
            Workshops
          </NavLink> */}
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
    </header>
  );
}
