import { useEffect, useState } from "react";
import type { JSX } from "react";
import { useCurrentUser } from "@/entities/auth/api";
import { useFollowers, useFollowing } from "@/entities/user/api";
import { PersonRow } from "./PersonRow";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

export type FollowListTab = "followers" | "following";

interface FollowListDialogProps {
  // Whose followers / following these are.
  username: string;
  initialTab: FollowListTab;
  onClose: () => void;
}

// Both lists in one sheet, switchable with tabs, each with a live count, a
// filter box and a follow button per person — instead of two read-only
// pop-ups you had to close and reopen.
export function FollowListDialog({ username, initialTab, onClose }: FollowListDialogProps): JSX.Element {
  const [tab, setTab] = useState<FollowListTab>(initialTab);
  const [filter, setFilter] = useState("");

  const { data: currentUser } = useCurrentUser();
  const { data: followers } = useFollowers(username);
  const { data: following } = useFollowing(username);
  // Who follows the signed-in user — for the "Te sigue" tag on each row.
  const { data: myFollowers } = useFollowers(currentUser?.username ?? "");
  const myFollowerIds = new Set((myFollowers ?? []).map((u) => u.id));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const list = (tab === "followers" ? followers : following) ?? [];
  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? list.filter((u) => u.name.toLowerCase().includes(needle) || u.username.includes(needle))
    : list;

  const tabs: { id: FollowListTab; label: string; count: number }[] = [
    { id: "followers", label: "Seguidores", count: followers?.length ?? 0 },
    { id: "following", label: "Siguiendo", count: following?.length ?? 0 },
  ];

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
        aria-label={`Seguidores y seguidos de @${username}`}
        className="fixed inset-x-0 bottom-0 z-30 flex h-[80dvh] flex-col gap-3 rounded-t-lg border-t border-border bg-bg-base p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-[640px] sm:max-h-[85dvh] sm:w-[28rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-section-title-lg text-text-primary">@{username}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`flex min-h-11 min-w-11 items-center justify-center rounded text-text-muted ${focusRing}`}
          >
            ✕
          </button>
        </div>

        <div role="group" aria-label="Lista" className="flex gap-1 rounded bg-bg-surface p-1">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`min-h-11 flex-1 rounded-md px-3 text-secondary font-semibold motion-safe:transition-colors ${focusRing} ${
                tab === id ? "bg-accent text-on-accent shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label} <span className={tab === id ? "" : "text-text-muted"}>{count}</span>
            </button>
          ))}
        </div>

        <label className="relative flex items-center">
          <span className="sr-only">Filtrar la lista</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 text-text-muted"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por nombre o usuario…"
            className={`min-h-11 w-full rounded bg-bg-surface py-2 pl-10 pr-4 text-body text-text-primary placeholder:text-text-muted ${focusRing}`}
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <p className="px-1 pt-2 text-body text-text-secondary">
              {tab === "followers" ? "Todavía no tiene seguidores." : "Todavía no sigue a nadie."}
            </p>
          ) : visible.length === 0 ? (
            <p className="px-1 pt-2 text-body text-text-secondary">Nadie coincide con "{filter}".</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((user) => (
                <PersonRow
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  followsYou={myFollowerIds.has(user.id)}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
