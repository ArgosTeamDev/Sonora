import { useEffect } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { User } from "@project/shared";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

interface FollowListDialogProps {
  title: string;
  users: User[];
  onClose: () => void;
}

export function FollowListDialog({ title, users, onClose }: FollowListDialogProps): JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-20 bg-bg-deep/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-30 flex max-h-[80dvh] flex-col gap-3 rounded-t-lg border-t border-border bg-bg-surface p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-section-title text-text-primary">
            {title} <span className="text-text-muted">({users.length})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`flex min-h-11 min-w-11 items-center justify-center rounded text-text-muted ${focusRing}`}
          >
            ✕
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-body text-text-secondary">Nadie por acá todavía.</p>
        ) : (
          <ul className="flex flex-col overflow-y-auto">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  to={`/u/${user.username}`}
                  onClick={onClose}
                  className={`flex min-h-11 items-center gap-3 rounded py-2 ${focusRing}`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-strong text-label text-text-primary">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(user.username)
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-secondary font-semibold text-text-primary">{user.name}</span>
                    <span className="truncate text-label text-text-muted">@{user.username}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
