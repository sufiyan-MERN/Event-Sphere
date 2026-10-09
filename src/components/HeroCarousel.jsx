import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { heroSlides } from "../data/content.js";
import Icon from "./Icon.jsx";
import "../styles/components/HeroCarousel.css";

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const go = (step) =>
    setActive(
      (index) => (index + step + heroSlides.length) % heroSlides.length,
    );

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % heroSlides.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const slide = heroSlides[active];
  const route = slide.itemId.startsWith("monsoon")
    ? `/movies/${slide.itemId}`
    : `/events/${slide.itemId}`;

  return (
    <section
      className="hero-shell"
      aria-roledescription="carousel"
      aria-label="Featured experiences"
    >
      <div
        className="hero-slide"
        key={slide.id}
        style={{ "--hero-image": `url("${slide.image}")` }}
      >
        <div className="hero-sheen" />
        <div className="hero-content">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="live-dot" />
              {slide.category}
            </span>
            <h1>
              {slide.title}
              <span className="hero-period">.</span>
            </h1>
            <p>{slide.subtitle}</p>
            <div className="hero-meta">
              <span>
                <Icon name="calendar" size={16} />
                {slide.date}
              </span>
              <span>
                <Icon name="pin" size={16} />
                {slide.location}
              </span>
            </div>
            <Link className="button button--coral hero-cta" to={route}>
              {slide.action}
              <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="hero-poster-wrap" aria-hidden="true">
            <img className="hero-poster" src={slide.poster} alt="" />
            {/* <span className="poster-orbit" /> */}
          </div>
        </div>
        <div className="hero-controls">
          <div className="hero-arrows">
            <button
              type="button"
              className="round-arrow"
              onClick={() => go(-1)}
              aria-label="Previous slide"
            >
              <Icon name="chevronLeft" />
            </button>
            <button
              type="button"
              className="round-arrow"
              onClick={() => go(1)}
              aria-label="Next slide"
            >
              <Icon name="chevronRight" />
            </button>
          </div>
          <div
            className="hero-dots"
            role="tablist"
            aria-label="Select a featured slide"
          >
            {heroSlides.map((entry, index) => (
              <button
                type="button"
                key={entry.id}
                role="tab"
                aria-label={`Show slide ${index + 1}`}
                aria-selected={active === index}
                className={
                  active === index ? "hero-dot hero-dot--active" : "hero-dot"
                }
                onClick={() => setActive(index)}
              />
            ))}
          </div>
          <span className="hero-count">
            0{active + 1}
            <i />0{heroSlides.length}
          </span>
        </div>
        <span className="hero-side-note">HYDERABAD · WHAT’S ON</span>
      </div>
    </section>
  );
}
