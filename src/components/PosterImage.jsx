import { useState } from "react";
import Icon from "./Icon.jsx";
import "../styles/components/PosterImage.css";

/**
 * Poster image with the boring parts handled:
 *  - shimmer placeholder while the bytes arrive (no layout shift, the box is
 *    already sized by its container),
 *  - a soft fade-in once decoded,
 *  - a branded fallback instead of the browser's broken-image glyph.
 */
export default function PosterImage({
  src,
  alt = "",
  className = "",
  eager = false,
  ...rest
}) {
  const [status, setStatus] = useState("loading");

  if (status === "error") {
    return (
      <span
        className={`${className} poster-fallback`.trim()}
        role="img"
        aria-label={alt}
      >
        <Icon name="spark" size={20} />
      </span>
    );
  }

  return (
    <img
      {...rest}
      className={`${className} poster-media ${status === "ready" ? "is-ready" : ""}`.trim()}
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setStatus("ready")}
      onError={() => setStatus("error")}
    />
  );
}
