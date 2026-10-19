import type { JSX } from "react";
import type { User } from "@project/shared";
import { useFollowing } from "@/entities/user/api";
import { Button } from "@/shared/ui/Button";
import { useFollowUser } from "./useFollowUser";

interface FollowButtonProps {
  currentUser: User;
  target: User;
  className?: string;
}

// Self-contained follow toggle: it works out whether you already follow
// `target` from your own following list (the same cache the profile page
// patches), so it can sit in any list of people without the parent wiring
// state into every row.
export function FollowButton({ currentUser, target, className = "" }: FollowButtonProps): JSX.Element {
  const { data: myFollowing } = useFollowing(currentUser.username);
  const isFollowing = Boolean(myFollowing?.some((u) => u.id === target.id));
  const follow = useFollowUser({ followerUser: currentUser, targetUser: target });

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      onClick={() => follow.mutate(!isFollowing)}
      disabled={follow.isPending}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? `Dejar de seguir a ${target.name}` : `Seguir a ${target.name}`}
      className={`shrink-0 px-4 ${className}`}
    >
      {isFollowing ? "Siguiendo" : "Seguir"}
    </Button>
  );
}
