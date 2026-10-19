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

interface CommunityReviewCardProps {
  review: Review;
  author: User | undefined;
  className?: string;
}

// A review as it reads on an album page: who, how many stars, how they
// listened, when — then the text. Likes/replies aren't modelled, so there's
// no action row.
export function CommunityReviewCard({ review, author, className = "flex" }: CommunityReviewCardProps): JSX.Element {
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
    </li>
  );
}
