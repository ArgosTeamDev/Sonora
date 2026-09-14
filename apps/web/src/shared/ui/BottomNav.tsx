import type { JSX } from "react";
import { NavLink } from "react-router-dom";
import { useCurrentUser } from "@/entities/auth/api";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function HomeIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m15 9-4.5 1.5L9 15l4.5-1.5L15 9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: JSX.Element }): JSX.Element {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded py-2 text-label ${focusRing} ${
          isActive ? "text-accent" : "text-text-secondary"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active state doesn't rely on color alone: a dot above the icon
              also marks it, so it still reads for colorblind users. */}
          {isActive && <span aria-hidden="true" className="absolute top-0 size-1 rounded-full bg-accent" />}
          {icon}
          {label}
        </>
      )}
    </NavLink>
  );
}

// Rebuilt from Figma node 71:2060 ("Nav"), minus the raised "+" slot — the
// same action already lives as "+ Registrar" in TopNav and inside Explorar,
// so a second entry point here was redundant. "Listas" in the design has no
// backing entity either, so that slot is "My reviews" instead.
export function BottomNav(): JSX.Element {
  const { data: currentUser } = useCurrentUser();
  const profileHref = currentUser ? `/u/${currentUser.username}` : "/login";

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-border bg-bg-base pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <NavItem to="/" label="Inicio" icon={<HomeIcon />} />
      <NavItem to="/explore" label="Explorar" icon={<CompassIcon />} />
      <NavItem to="/my-reviews" label="Mis reseñas" icon={<BookmarkIcon />} />
      <NavItem to={profileHref} label="Perfil" icon={<UserIcon />} />
    </nav>
  );
}
