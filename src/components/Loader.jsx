import { useEffect, useState } from "react";
import "../styles/components/Loader.css";

/**
 * Full-screen brand loader.
 *
 * Shown once per full document load (first visit, refresh, direct URL) and
 * never on client-side route changes, so navigation stays instant. It waits
 * for `window.load` (or a hard timeout) *and* a minimum on-screen time, then
 * fades out into the page — no flash of half-painted content.
 */
const MIN_VISIBLE_MS = 850;
const MAX_WAIT_MS = 2600;
const EXIT_MS = 520;

export default function Loader() {
  const [phase, setPhase] = useState("loading"); // loading → exiting → done

  useEffect(() => {
    const startedAt = performance.now();
    let exitTimer = 0;
    let doneTimer = 0;
    let finished = false;

    // Keep the page from scrolling behind the curtain.
    document.documentElement.classList.add("is-loading");

    const finish = () => {
      if (finished) return;
      finished = true;
      setPhase("exiting");
      doneTimer = window.setTimeout(() => {
        setPhase("done");
        document.documentElement.classList.remove("is-loading");
      }, EXIT_MS);
    };

    const schedule = () => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
      exitTimer = window.setTimeout(finish, remaining);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    // Safety net for slow or blocked third-party requests.
    const safety = window.setTimeout(finish, MAX_WAIT_MS);

    return () => {
      window.removeEventListener("load", schedule);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(safety);
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`loader ${phase === "exiting" ? "loader--exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="ShowBook is loading"
    >
      <div className="loader__backdrop" aria-hidden="true">
        <span className="loader__orb loader__orb--1" />
        <span className="loader__orb loader__orb--2" />
        <span className="loader__orb loader__orb--3" />
        <span className="loader__halo" />
        <span className="loader__grain" />
      </div>

      <div className="loader__center">
        <div className="loader__logo">
          <span className="loader__mark brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="loader__word">
            show<span>book</span>
            <i>.</i>
          </span>
        </div>

        <div className="loader__bar" aria-hidden="true">
          <span className="loader__bar-track" />
          <span className="loader__bar-fill" />
        </div>

        <p className="loader__tagline">
          Your next experience awaits
          <span className="loader__ellipsis" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
      </div>
    </div>
  );
}
