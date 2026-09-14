import type { JSX } from "react";
import { NavLink } from "react-router-dom";
import { useCurrentUser } from "@/entities/auth/api";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function NavItem({ to, label }: { to: string; label: string }): JSX.Element {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `rounded px-3 py-2 text-secondary font-semibold ${focusRing} ${
          isActive
            ? "border-b-2 border-accent text-accent"
            : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

// No desktop frame exists in the Figma file (only the mobile "Nav", 71:2060)
// — this is our own equivalent, same tokens, same 5 destinations, laid out
// as a sticky top bar instead of a bottom bar. Hidden below the md breakpoint,
// where BottomNav takes over.
export function TopNav(): JSX.Element {
  const { data: currentUser } = useCurrentUser();
  const profileHref = currentUser ? `/u/${currentUser.username}` : "/login";

  return (
    <nav
      aria-label="Principal"
      className="sticky top-0 z-20 hidden border-b border-border bg-bg-base/85 backdrop-blur-md md:block"
    >
      {/* Same max-w-6xl container as the page content below (see FeedPage),
          so the logo and the right-side actions line up with the content's
          edges instead of sitting flush against the viewport. */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <NavLink
          to="/"
          className={`flex items-center gap-2 rounded text-section-title text-text-primary ${focusRing}`}
        >
          <img src="/icons/icon.svg" alt="" className="size-7" />
          SONORA
        </NavLink>

        <div className="flex items-center gap-1">
          <NavItem to="/" label="Inicio" />
          <NavItem to="/explore" label="Explorar" />
          <NavItem to="/my-reviews" label="Mis reseñas" />
          <NavItem to={profileHref} label="Perfil" />
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <NavLink
                to="/explore"
                className={`inline-flex min-h-11 items-center justify-center rounded bg-accent-strong px-4 text-secondary font-semibold text-text-primary shadow-[0_8px_10px_rgba(77,142,255,0.35)] motion-safe:transition-colors hover:bg-accent-cta ${focusRing}`}
              >
                + Registrar
              </NavLink>

              <NavLink to={profileHref} aria-label="Tu perfil" className={`rounded-full ${focusRing}`}>
                <span className="flex size-9 items-center justify-center rounded-full bg-accent-strong text-label text-text-primary">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={`inline-flex min-h-11 items-center justify-center rounded px-4 text-secondary font-semibold text-text-secondary hover:text-text-primary ${focusRing}`}
              >
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/login?mode=register"
                className={`inline-flex min-h-11 items-center justify-center rounded bg-accent-strong px-4 text-secondary font-semibold text-text-primary shadow-[0_8px_10px_rgba(77,142,255,0.35)] motion-safe:transition-colors hover:bg-accent-cta ${focusRing}`}
              >
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
