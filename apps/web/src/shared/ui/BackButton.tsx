import type { JSX } from "react";
import { useNavigate } from "react-router-dom";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

// Mobile "back" for secondary screens (the bottom nav only covers the five
// top-level tabs). Hidden from md up, where the top bar and the browser's own
// back button take over. If the page was opened directly (no history to go
// back to), it falls back to home instead of leaving the app.
export function BackButton({ className = "" }: { className?: string }): JSX.Element {
  const navigate = useNavigate();
  const goBack = (): void => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`flex min-h-11 w-fit items-center gap-1.5 rounded pr-2 text-secondary font-semibold text-text-secondary hover:text-text-primary md:hidden ${focusRing} ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Volver
    </button>
  );
}
