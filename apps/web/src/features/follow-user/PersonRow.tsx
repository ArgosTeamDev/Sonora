import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { User } from "@project/shared";
import { FollowButton } from "./FollowButton";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

interface PersonRowProps {
  user: User;
  currentUser: User | undefined;
  // This person follows the signed-in user.
  followsYou?: boolean;
  onNavigate?: () => void;
}

// One person in any list (followers, following, search, suggestions): avatar,
// name, @handle · location, a line of bio, a "Te sigue" tag and — for anyone
// who isn't you — a follow button.
export function PersonRow({ user, currentUser, followsYou = false, onNavigate }: PersonRowProps): JSX.Element {
  const isSelf = currentUser?.id === user.id;

  return (
    <li className="flex items-center gap-3 rounded-lg bg-bg-surface p-3">
      <Link
        to={`/u/${user.username}`}
        onClick={onNavigate}
        className={`flex min-w-0 flex-1 items-center gap-3 ${focusRing}`}
      >
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-strong text-label text-text-primary">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(user.username)
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate text-secondary font-semibold text-text-primary">{user.name}</span>
            {user.badge && (
              <span className="shrink-0 rounded-xl bg-accent-cta/30 px-1.5 py-px text-[10px] font-bold uppercase text-accent">
                {user.badge}
              </span>
            )}
          </span>
          <span className="truncate text-label font-normal normal-case tracking-normal text-text-muted">
            @{user.username}
            {user.location ? ` · ${user.location}` : ""}
          </span>
          {user.bio && <span className="line-clamp-1 pt-0.5 text-secondary text-text-secondary">{user.bio}</span>}
        </span>
      </Link>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {followsYou && !isSelf && (
          <span className="rounded-sm bg-bg-hover px-1.5 py-0.5 text-[10px] font-bold uppercase text-text-secondary">
            Te sigue
          </span>
        )}
        {currentUser && !isSelf && <FollowButton currentUser={currentUser} target={user} />}
      </div>
    </li>
  );
}
