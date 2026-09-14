import type { JSX } from "react";

// Just the identity/tagline side of the reference — the right-side links
// (Acerca de, API, Guías, Privacidad, Términos) would all be dead links,
// since none of those pages exist.
export function Footer(): JSX.Element {
  return (
    <footer className="mt-8 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-6 py-8">
        <span className="text-section-title text-text-primary">SONORA</span>
        <span className="text-secondary text-text-muted">© {new Date().getFullYear()}</span>
        <span aria-hidden="true" className="text-text-muted">
          ·
        </span>
        <span className="text-secondary text-text-muted">Hecho para melómanos y archivistas.</span>
      </div>
    </footer>
  );
}
