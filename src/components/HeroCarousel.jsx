import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { heroSlides } from "../data/content.js";
import Icon from "./Icon.jsx";
import "../styles/components/HeroCarousel.css";

const SLIDE_MS = 7000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  // Background layers: the outgoing slide stays mounted until its fade ends.
  const [layers, setLayers] = useState([{ index: 0, key: 0 }]);
  const [paused, setPaused] = useState(false);
  const shellRef = useRef(null);
  const seq = useRef(0);
  const started = useRef(false);
  const frame = useRef(0);

  const goTo = useCallback((index) => {
    setActive((current) => {
      const next =
        (index + heroSlides.length) % heroSlides.length;
      return next === current ? current : next;
    });
  }, []);

  const go = useCallback((step) => {
    setActive((index) => (index + step + heroSlides.length) % heroSlides.length);
  }, []);

  // Track the outgoing layer so backgrounds cross-fade instead of cutting.
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      return;
    }
    seq.current += 1;
    setLayers((current) => [...current, { index: active, key: seq.current }].slice(-2));
  }, [active]);

  // Autoplay, restarted on every slide so the progress rail stays in sync.
  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(() => go(1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, go]);

  // Don't burn cycles (or advance slides) in a background tab.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Warm the next background so the cross-fade never shows a blank frame.
  useEffect(() => {
    const next = new Image();
    next.src = heroSlides[(active + 1) % heroSlides.length].image;
  }, [active]);

  // Pointer parallax — eased by a CSS transition, so a throttled write is
  // enough. Skipped for touch input and reduced motion.
  const onPointerMove = (event) => {
    if (event.pointerType === "touch" || prefersReducedMotion()) return;
    if (frame.current) return;
    const clientX = event.clientX;
    const clientY = event.clientY;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const node = shellRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty("--px", x.toFixed(3));
      node.style.setProperty("--py", y.toFixed(3));
    });
  };

  const resetParallax = () => {
    const node = shellRef.current;
    if (!node) return;
    node.style.setProperty("--px", "0");
    node.style.setProperty("--py", "0");
  };

  // Swipe support.
  const touchStart = useRef(0);
  const onTouchStart = (event) => {
    touchStart.current = event.changedTouches[0].clientX;
  };
  const onTouchEnd = (event) => {
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  };

  const slide = heroSlides[active];
  const route = slide.itemId.startsWith("monsoon")
    ? `/movies/${slide.itemId}`
    : `/events/${slide.itemId}`;

  return (
    <section
      className={`hero-shell ${paused ? "hero-shell--paused" : ""}`}
      ref={shellRef}
      aria-roledescription="carousel"
      aria-label="Featured experiences"
      onPointerMove={onPointerMove}
      onPointerLeave={resetParallax}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        resetParallax();
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="hero-slide">
        <div className="hero-bg-stack" aria-hidden="true">
          {layers.map((layer, position) => {
            const isCurrent = position === layers.length - 1;
            return (
              <div
                key={layer.key}
                className={`hero-bg ${isCurrent ? "hero-bg--current" : "hero-bg--out"}`}
                style={{
                  "--hero-image": `url("${heroSlides[layer.index].image}")`,
                }}
              />
            );
          })}
        </div>

        <div className="hero-sheen" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-copy" key={`copy-${slide.id}`}>
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
            <Link
              className="button button--coral hero-cta sheen-host"
              to={route}
            >
              {slide.action}
              <Icon name="arrow" size={17} />
            </Link>
          </div>

          <div
            className="hero-poster-wrap"
            aria-hidden="true"
            key={`poster-${slide.id}`}
          >
            <span className="poster-orbit" />
            <img className="hero-poster" src={slide.poster} alt="" />
          </div>
        </div>

        <div className="hero-controls">
          <div className="hero-arrows">
            <button
              type="button"
              className="round-arrow"
              onClick={() => go(-1)}
              aria-label="Previous slide"
              tabIndex={0}
            >
              <Icon name="chevronLeft" />
            </button>
            <button
              type="button"
              className="round-arrow"
              onClick={() => go(1)}
              aria-label="Next slide"
              tabIndex={0}
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
                aria-label={`Show slide ${index + 1}: ${entry.title}`}
                aria-selected={active === index}
                className={
                  active === index ? "hero-dot hero-dot--active" : "hero-dot"
                }
                onClick={() => goTo(index)}
              >
                {active === index && (
                  <span
                    className="hero-dot__progress"
                    key={`progress-${active}`}
                  />
                )}
              </button>
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
