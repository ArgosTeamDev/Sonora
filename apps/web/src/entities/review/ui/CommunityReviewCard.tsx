import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { Review, User } from "@project/shared";
import { relativeTime } from "@/shared/lib/relative-time";
import { formatTag } from "../format";
import { RatingStars } from "./RatingStars";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function LikeIcon({ filled }: { filled: boolean }): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 20.5s-7-4.35-9.5-8.8C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 17.5 11.7 15 16.15 12 20.5 12 20.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CommunityReviewCardProps {
  review: Review;
  author: User | undefined;
  className?: string;
  likeCount?: number;
  isLiked?: boolean;
  // Undefined hides the button (signed out, or the review is yours); the
  // count still shows.
  onToggleLike?: () => void;
}

// A review as it reads on an album page: who, how many stars, how they
// listened, when — then the text and the like button.
export function CommunityReviewCard({
  review,
  author,
  className = "flex",
  likeCount = 0,
  isLiked = false,
  onToggleLike,
}: CommunityReviewCardProps): JSX.Element {
  const tag = formatTag(review);
  const name = author?.name ?? "Usuario desconocido";
  return (
    <li className={`${className} flex-col gap-2 rounded-lg bg-bg-surface p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-strong text-label text-text-primary">
            {author?.avatarUrl ? (
              <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : author ? (
              initials(author.username)
            ) : (
              "?"
            )}
          </span>
          <div className="flex min-w-0 flex-col">
            {author ? (
              <Link
                to={`/u/${author.username}`}
                className={`truncate text-[14px] font-semibold text-text-primary ${focusRing}`}
              >
                {name}
              </Link>
            ) : (
              <span className="truncate text-[14px] font-semibold text-text-primary">{name}</span>
            )}
            <div className="flex flex-wrap items-center gap-x-1 text-[10px] leading-5">
              <RatingStars value={review.rating} readOnly label="Calificación" />
              {tag && (
                <>
                  <span className="text-border" aria-hidden="true">
                    •
                  </span>
                  <span className="text-accent">Escuchado en {tag}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-[11px] leading-5 text-text-muted">{relativeTime(review.listenedAt)}</span>
      </div>
      {review.text && <p className="pt-1 text-[14px] leading-[22px] text-text-secondary">{review.text}</p>}
      {(onToggleLike || likeCount > 0) && (
        <div className="flex items-center">
          {onToggleLike ? (
            <button
              type="button"
              onClick={onToggleLike}
              aria-pressed={isLiked}
              aria-label={isLiked ? "Quitar like de esta reseña" : "Dar like a esta reseña"}
              className={`flex min-h-11 items-center gap-1.5 pr-2 text-secondary hover:text-text-primary ${focusRing} ${
                isLiked ? "text-danger hover:text-danger" : "text-text-secondary"
              }`}
            >
              <LikeIcon filled={isLiked} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
          ) : (
            <span className="flex min-h-11 items-center gap-1.5 text-secondary text-text-secondary">
              <LikeIcon filled={false} />
              {likeCount}
              <span className="sr-only"> likes</span>
            </span>
          )}
        </div>
      )}
    </li>
  );
}
