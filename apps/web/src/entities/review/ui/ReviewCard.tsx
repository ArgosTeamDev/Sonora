import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats, Review, User } from "@project/shared";
import { relativeTime } from "@/shared/lib/relative-time";
import { formatTag } from "../format";
import { RatingStars } from "./RatingStars";

interface ReviewCardProps {
  review: Review;
  author?: User;
  album?: AlbumWithStats;
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

// A community review as it reads on the home page. One grid, two shapes:
// on a phone the author row spans the top and the cover sits beside the
// title; on desktop the cover takes the left column and everything else
// stacks to its right. There's no like/reply counter — no engagement entity
// exists — so the footer carries the listening format and "first listen /
// relisten" instead.
export function ReviewCard({ review, author, album }: ReviewCardProps): JSX.Element {
  const tag = formatTag(review);
  const albumHref = album ? `/albums/${album.id}` : "#";

  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-lg bg-bg-surface p-4 lg:grid-cols-[96px_minmax(0,1fr)] lg:gap-x-4 lg:p-5">
      <header className="col-span-2 flex items-center justify-between gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-strong text-label text-text-primary lg:size-6 lg:rounded-full">
            {author?.avatarUrl ? (
              <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : author ? (
              initials(author.username)
            ) : (
              "?"
            )}
          </span>
          <div className="flex min-w-0 flex-col lg:flex-row lg:items-baseline lg:gap-2">
            <Link
              to={`/u/${author?.username ?? ""}`}
              className={`truncate text-secondary font-semibold text-text-primary ${focusRing}`}
            >
              {author?.name ?? "Desconocido"}
            </Link>
            <span className="text-label font-normal normal-case tracking-normal text-text-muted">
              {relativeTime(review.listenedAt)}
            </span>
          </div>
        </div>
        {tag && (
          <span className="shrink-0 rounded-xl bg-bg-hover px-2.5 py-0.5 text-label text-text-secondary lg:hidden">
            {tag}
          </span>
        )}
        <span className="hidden lg:block">
          <RatingStars value={review.rating} readOnly label="Calificación" />
        </span>
      </header>

      <Link
        to={albumHref}
        aria-label={album ? `Ver ${album.title}` : "Álbum desconocido"}
        className={`relative aspect-square w-full overflow-hidden rounded bg-bg-hover shadow-md lg:row-span-3 lg:row-start-1 lg:col-start-1 ${focusRing}`}
      >
        {album?.coverUrl ? (
          <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-label text-text-muted">
            Sin portada
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-col justify-center gap-0.5 lg:col-start-2 lg:row-start-2 lg:flex-row lg:flex-wrap lg:items-baseline lg:justify-start lg:gap-x-2">
        <Link to={albumHref} className={`truncate text-section-title-lg text-text-primary ${focusRing}`}>
          {album?.title ?? "Álbum desconocido"}
        </Link>
        {album && (
          <span className="truncate text-secondary text-text-muted">
            <span className="hidden lg:inline">—</span> {album.artist.name}{" "}
            <span className="hidden lg:inline">({album.year})</span>
            <span className="lg:hidden">• {album.year}</span>
          </span>
        )}
        <span className="pt-1 lg:hidden">
          <RatingStars value={review.rating} readOnly label="Calificación" />
        </span>
      </div>

      {review.text && (
        <p className="col-span-2 line-clamp-4 text-body text-text-secondary lg:col-span-1 lg:col-start-2 lg:line-clamp-3">
          {review.text}
        </p>
      )}

      <footer className="col-span-2 flex items-center justify-between gap-2 border-t border-border/40 pt-3 lg:col-span-1 lg:col-start-2">
        <span className="hidden text-label font-normal normal-case tracking-normal text-text-muted lg:inline">
          {tag ?? ""}
        </span>
        <span className="ml-auto text-label uppercase text-text-muted">
          {review.isRelisten ? "Reescucha" : "Primera escucha"}
        </span>
      </footer>
    </article>
  );
}
