import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { User } from "@project/shared";
import { LogoutDialog } from "./LogoutDialog";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const itemClass = `flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-secondary text-text-primary hover:bg-bg-raised ${focusRing}`;

function UserIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Avatar button with a small dropdown: profile, your reviews and — the point
// of it — "Cerrar sesión", reachable from every page instead of only from
// your own profile. Closes on outside click, Escape, or choosing an item.
export function AccountMenu({ user }: { user: User }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menú de tu cuenta"
        className={`flex min-h-11 items-center gap-1 rounded-full pr-1 ${focusRing}`}
      >
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-accent-strong text-label text-text-primary">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            user.username.slice(0, 2).toUpperCase()
          )}
        </span>
        <span aria-hidden="true" className="text-[10px] text-text-muted">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Tu cuenta"
          className="absolute right-0 top-full z-30 mt-2 flex w-60 flex-col gap-1 rounded-lg border border-border bg-bg-surface p-2 shadow-2xl"
        >
          <div className="flex flex-col px-3 py-2">
            <span className="truncate text-secondary font-semibold text-text-primary">{user.name}</span>
            <span className="truncate text-label font-normal normal-case tracking-normal text-text-muted">
              @{user.username}
            </span>
          </div>
          <div className="h-px bg-border/60" role="separator" />
          <Link to={`/u/${user.username}`} role="menuitem" onClick={() => setIsOpen(false)} className={itemClass}>
            <UserIcon />
            Ver perfil
          </Link>
          <Link to="/my-reviews" role="menuitem" onClick={() => setIsOpen(false)} className={itemClass}>
            <BookmarkIcon />
            Mis reseñas
          </Link>
          <div className="h-px bg-border/60" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setIsLogoutOpen(true);
            }}
            className={`${itemClass} text-danger`}
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      )}

      {isLogoutOpen && <LogoutDialog onClose={() => setIsLogoutOpen(false)} />}
    </div>
  );
}
