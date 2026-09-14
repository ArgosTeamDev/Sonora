import type { JSX } from "react";

// Invisible until focused (first Tab press). Lets keyboard users jump past
// the nav straight to the page content instead of tabbing through every link.
export function SkipLink(): JSX.Element {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent-cta focus:px-4 focus:py-3 focus:text-secondary focus:font-semibold focus:text-on-cta"
    >
      Saltar al contenido
    </a>
  );
}
