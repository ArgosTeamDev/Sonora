import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats, Review, User } from "@project/shared";
import { RatingStars } from "./RatingStars";

interface ReviewCardProps {
  review: Review;
  author?: User;
  album?: AlbumWithStats;
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `hace ${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `hace ${hours}h`;
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return `hace ${minutes}m`;
}

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

// Rebuilt from Figma node 54:1805 ("Reseñas y Críticas de la Comunidad").
// Dropped: the "Curador" role badge (no curator concept in the data model),
// the format tag ("Vinilo 180g" — no format field on Review), and the
// like/comment counters in the bottom bar (no social engagement entity).
// "Relisten" replaces the design's numbered "4ta escucha registrada" since we
// track a boolean, not a listen count.
export function ReviewCard({ review, author, album }: ReviewCardProps): JSX.Element {
  return (
    <article className="flex gap-4 rounded-lg border border-border bg-bg-surface/80 p-4 backdrop-blur-sm sm:p-6">
      <Link
        to={album ? `/albums/${album.id}` : "#"}
        aria-label={album ? `Ver ${album.title}` : "Álbum desconocido"}
        className={`relative size-24 shrink-0 overflow-hidden rounded border border-border/60 bg-bg-hover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ${focusRing}`}
      >
        {album?.coverUrl ? (
          <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-label text-text-muted">
            Sin portada
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-cta text-label text-on-cta">
            {author ? initials(author.username) : "?"}
          </span>
          <Link
            to={`/u/${author?.username ?? ""}`}
            className={`text-secondary font-semibold text-text-primary ${focusRing}`}
          >
            {author?.username ?? "Desconocido"}
          </Link>
          <span className="text-secondary text-text-muted">{timeAgo(review.createdAt.toString())}</span>
          {review.isRelisten && (
            <span className="ml-auto rounded-full bg-bg-raised px-2 py-0.5 text-label text-text-secondary">
              Reescucha
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link
            to={album ? `/albums/${album.id}` : "#"}
            className={`text-section-title-lg text-text-primary ${focusRing}`}
          >
            {album?.title ?? "Álbum desconocido"}
          </Link>
          {album && (
            <span className="text-secondary text-text-muted">
              de <span className="text-text-secondary">{album.artist.name}</span> ({album.year})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <RatingStars value={review.rating} readOnly label="Calificación" />
          <span className="text-secondary font-bold text-accent">{review.rating.toFixed(1)}</span>
        </div>

        {review.text && <p className="pt-2 text-body text-text-secondary">{review.text}</p>}
      </div>
    </article>
  );
}
