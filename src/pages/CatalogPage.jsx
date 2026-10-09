import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { allItems, events, movies } from "../data/content.js";
import { useBooking } from "../context/BookingContext.jsx";
import { MediaCard } from "../components/MediaCard.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import SearchBar from "../components/SearchBar.jsx";
import CategoryRail from "../components/CategoryRail.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import Icon from "../components/Icon.jsx";
import "../styles/pages/CatalogPage.css";

const dateOptions = [
  ["2026-10-10", "Sat · 10 Oct"],
  ["2026-10-11", "Sun · 11 Oct"],
  ["2026-10-12", "Mon · 12 Oct"],
  ["2026-10-17", "Sat · 17 Oct"],
  ["2026-10-18", "Sun · 18 Oct"],
  ["2026-10-19", "Mon · 19 Oct"],
];
const cities = ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"];

function FilterSelect({ label, value, onChange, options, className = "" }) {
  return (
    <label className={`filter-select ${className}`}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function CatalogPage({ type }) {
  const isMovies = type === "movies";
  const [searchParams, setSearchParams] = useSearchParams();
  const { location, setLocation } = useBooking();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [rating, setRating] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState(searchParams.get("city") || location);
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setCity(searchParams.get("city") || location);
  }, [searchParams, location]);

  const source =
    !isMovies && search.trim() ? allItems : isMovies ? movies : events;
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = source.filter((item) => {
      const matchesTerm =
        !term ||
        `${item.title} ${item.genre} ${item.category || ""} ${item.location} ${item.language}`
          .toLowerCase()
          .includes(term);
      const matchesCategory =
        !category ||
        (item.kind === "movie" && category === "Movies") ||
        item.category === category;
      const matchesGenre =
        !genre || item.genreTag === genre || item.genre.includes(genre);
      const matchesLanguage = !language || item.language.includes(language);
      const matchesRating = !rating || item.rating >= Number(rating);
      const matchesDate = !date || item.date === date;
      const matchesCity = item.location === city;
      const matchesPrice = !maxPrice || item.price <= Number(maxPrice);
      const matchesAvailability =
        !availability ||
        (availability === "limited"
          ? item.tags?.some((tag) => /almost full|limited seats/i.test(tag))
          : item.available);
      return (
        matchesTerm &&
        matchesCategory &&
        matchesGenre &&
        matchesLanguage &&
        matchesRating &&
        matchesDate &&
        matchesCity &&
        matchesPrice &&
        matchesAvailability
      );
    });
    const sorters = {
      popular: (a, b) => b.rating - a.rating,
      rating: (a, b) => b.rating - a.rating,
      price: (a, b) => a.price - b.price,
      date: (a, b) => a.date.localeCompare(b.date),
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return list.sort(sorters[sort] || sorters.popular);
  }, [
    source,
    search,
    category,
    genre,
    language,
    rating,
    date,
    city,
    maxPrice,
    availability,
    sort,
  ]);

  const reset = () => {
    setSearch("");
    setCategory("");
    setGenre("");
    setLanguage("");
    setRating("");
    setDate("");
    setCity(location);
    setMaxPrice("");
    setAvailability("");
    setSort("popular");
    setSearchParams({});
  };
  const searchChange = (value) => {
    setSearch(value);
    if (value) setCategory("");
  };
  const activeFilters = [
    category,
    genre,
    language,
    rating,
    date,
    maxPrice,
    availability,
  ].filter(Boolean).length;

  return (
    <main className={`page-shell catalog-page catalog-page--${type}`}>
      {/* <div className="catalog-heading">
        <div>
          <span className="eyebrow">
            {isMovies ? "THE BIG SCREEN, YOUR WAY" : "GO WHERE THE GOOD IS"}
          </span>
          <h1>
            {search ? (
              <>
                Results for <em>“{search}”</em>
              </>
            ) : isMovies ? (
              <>
                Find a film.
                <br />
                <em>Find your feeling.</em>
              </>
            ) : (
              <>
                What sounds like
                <br />
                <em>a good night?</em>
              </>
            )}
          </h1>
          <p>
            {search
              ? `${results.length} ${results.length === 1 ? "match" : "matches"} from all movies and events.`
              : isMovies
                ? "New releases, old favourites and stories made for the dark."
                : `Good music, live comedy, bright ideas and more around ${location}.`}
          </p>
        </div>
        <div className="catalog-aside">
          <span className="catalog-aside__big">
            {String(results.length).padStart(2, "0")}
          </span>
          <span>
            things to
            <br />
            look forward to
          </span>
        </div>
      </div> */}
      <section className="catalog-category-section" aria-label="Browse by category">
        <div className="category-section__top">
          <span className="eyebrow">BROWSE BY CATEGORY</span>
          <span className="section-index">01 / 08</span>
        </div>
        <CategoryRail />
      </section>
      <div className="catalog-toolbar">
        <SearchBar
          value={search}
          onChange={searchChange}
          placeholder={`Search ${isMovies ? "movies" : "events, movies, concerts"}…`}
          label={`Search ${isMovies ? "movies" : "events"}`}
        />
        <button
          type="button"
          className={`filter-toggle ${filtersOpen ? "filter-toggle--active" : ""}`}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Icon name="filter" size={18} />
          Filters <span>{activeFilters || ""}</span>
        </button>
        <FilterSelect
          label="SORT BY"
          value={sort}
          onChange={setSort}
          options={[
            ["popular", "Popular"],
            ["rating", "Top rated"],
            ["date", "Date"],
            ["price", "Price: low to high"],
            ["title", "Name A–Z"],
          ]}
          className="sort-select"
        />
      </div>
      <div
        className={`catalog-layout ${filtersOpen ? "catalog-layout--filters-open" : ""}`}
      >
        <FilterPanel onReset={reset}>
          {isMovies && (
            <>
              <FilterSelect
                label="GENRE"
                value={genre}
                onChange={setGenre}
                options={[
                  ["", "All genres"],
                  ["Drama", "Drama"],
                  ["Action", "Action"],
                  ["Romance", "Romance"],
                  ["Mystery", "Mystery"],
                ]}
              />
              <FilterSelect
                label="LANGUAGE"
                value={language}
                onChange={setLanguage}
                options={[
                  ["", "All languages"],
                  ["Telugu", "Telugu"],
                  ["Hindi", "Hindi"],
                  ["Tamil", "Tamil"],
                  ["English", "English"],
                ]}
              />
              <FilterSelect
                label="RATING"
                value={rating}
                onChange={setRating}
                options={[
                  ["", "Any rating"],
                  ["7", "7+ audience score"],
                  ["8", "8+ audience score"],
                  ["8.5", "8.5+ audience score"],
                ]}
              />
            </>
          )}
          <FilterSelect
            label="DATE"
            value={date}
            onChange={setDate}
            options={[["", "Any date"], ...dateOptions]}
          />
          <FilterSelect
            label="LOCATION"
            value={city}
            onChange={(value) => {
              setCity(value);
              setLocation(value);
            }}
            options={cities.map((item) => [
              item,
              item === location ? `Selected · ${item}` : item,
            ])}
          />
          {!isMovies && (
            <>
              <FilterSelect
                label="PRICE"
                value={maxPrice}
                onChange={setMaxPrice}
                options={[
                  ["", "Any price"],
                  ["500", "Under ₹500"],
                  ["800", "Under ₹800"],
                  ["1200", "Under ₹1,200"],
                  ["2000", "Under ₹2,000"],
                ]}
              />
              <FilterSelect
                label="AVAILABILITY"
                value={availability}
                onChange={setAvailability}
                options={[
                  ["", "All availability"],
                  ["available", "Available now"],
                  ["limited", "Limited seats"],
                ]}
              />
            </>
          )}
          {isMovies && (
            <FilterSelect
              label="PRICE"
              value={maxPrice}
              onChange={setMaxPrice}
              options={[
                ["", "Any price"],
                ["200", "Under ₹200"],
                ["250", "Under ₹250"],
                ["300", "Under ₹300"],
              ]}
            />
          )}
        </FilterPanel>
        <section className="catalog-results" aria-live="polite">
          <div className="catalog-results__heading">
            <span>
              {results.length
                ? `Showing ${results.length} ${results.length === 1 ? "experience" : "experiences"}`
                : "A little quiet here"}
            </span>
            <span className="catalog-results__city">
              <Icon name="pin" size={14} />
              {city}
            </span>
          </div>
          {results.length ? (
            <div className="media-grid">
              {results.map((item) => (
                <MediaCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No shows in ${city} match this view`}
              detail={
                city === "Hyderabad"
                  ? "Try a different date, category or filter. The good stuff is still out there."
                  : `This prototype currently has mock listings for Hyderabad only. Change the city to Hyderabad to explore the catalogue.`
              }
              action={
                city === "Hyderabad" ? "Clear filters" : "Browse Hyderabad"
              }
              onAction={
                city === "Hyderabad"
                  ? reset
                  : () => {
                      setCity("Hyderabad");
                      setLocation("Hyderabad");
                    }
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}

export function MoviesPage() {
  return <CatalogPage type="movies" />;
}
export function EventsPage() {
  return <CatalogPage type="events" />;
}
