import { useEffect } from "react";

/**
 * Shared scroll-reveal controller.
 *
 * One IntersectionObserver for the whole app plus a MutationObserver, so
 * anything that mounts *after* first paint — cards that appear once data
 * lands, search results, route changes — is picked up automatically without
 * every caller wiring its own observer.
 *
 * A cheap rAF-throttled sweep backs the observer up: if the page jumps a long
 * distance in one frame (End key, deep link, restored scroll position) an
 * element can go from below the viewport to above it without ever registering
 * an intersection, and would otherwise stay invisible forever. The sweep
 * reveals anything at or above the fold, and the pending set only ever shrinks.
 *
 * Markup contract (see styles/animations.css):
 *   <section data-reveal>                                     fade + slide up
 *   <section data-reveal="left">                              slide from left
 *   <article data-reveal style={{ "--reveal-delay": 140 }}>   staggered
 */

const SELECTOR = "[data-reveal]";

const pending = new Set();
let observer = null;
let mutationObserver = null;
let frame = 0;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function reveal(node) {
  node.classList.add("is-revealed");
  pending.delete(node);
  observer?.unobserve(node);
}

function sweep() {
  frame = 0;
  if (!pending.size) return;
  const limit = window.innerHeight * 0.92;
  pending.forEach((node) => {
    // Negative top means it has been flung past the top — reveal it too.
    if (node.getBoundingClientRect().top < limit) reveal(node);
  });
}

function scheduleSweep() {
  if (frame || !pending.size) return;
  frame = requestAnimationFrame(sweep);
}

function ensureObserver() {
  if (observer) return observer;

  if (typeof IntersectionObserver === "undefined") {
    document.documentElement.classList.add("no-io");
    pending.forEach(reveal);
    return null;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  return observer;
}

function scan() {
  document.querySelectorAll(SELECTOR).forEach((node) => {
    if (node.classList.contains("is-revealed") || pending.has(node)) return;
    pending.add(node);
    ensureObserver()?.observe(node);
  });
  // Anything already on screen (or above it) settles on the next frame.
  scheduleSweep();
}

export default function useReveal() {
  useEffect(() => {
    if (reducedMotion()) {
      document.documentElement.classList.add("no-io");
      document.querySelectorAll(SELECTOR).forEach((node) => {
        node.classList.add("is-revealed");
      });
      return undefined;
    }

    scan();

    // Content added later (cards after data loads, route changes) gets
    // observed without any extra wiring in the components.
    mutationObserver = new MutationObserver(() => scan());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleSweep, { passive: true });
    window.addEventListener("resize", scheduleSweep, { passive: true });

    return () => {
      mutationObserver?.disconnect();
      mutationObserver = null;
      window.removeEventListener("scroll", scheduleSweep);
      window.removeEventListener("resize", scheduleSweep);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
  }, []);
}

/** Opt a single node into reveal handling (useful for imperative targets). */
export function revealNode(node) {
  if (!node) return;
  if (reducedMotion()) {
    node.classList.add("is-revealed");
    return;
  }
  pending.add(node);
  ensureObserver()?.observe(node);
  scheduleSweep();
}
