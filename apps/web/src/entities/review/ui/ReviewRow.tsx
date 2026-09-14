import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats, Review } from "@project/shared";
import { RatingStars } from "./RatingStars";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

function PencilIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }): JSX.Element {
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

interface ReviewRowProps {
  review: Review;
  album: AlbumWithStats;
  // Only shown when provided — a stranger looking at your profile doesn't
  // get edit/delete controls on your reviews, only you do.
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ReviewRow({
  review,
  album,
  onEdit,
  onDelete,
  isDeleting,
  isFavorite,
  onToggleFavorite,
}: ReviewRowProps): JSX.Element {
  return (
    <li className="flex gap-4 rounded-lg border border-border bg-bg-surface p-4">
      <Link
        to={`/albums/${album.id}`}
        aria-label={`Ver ${album.title}`}
        className={`relative size-20 shrink-0 overflow-hidden rounded border border-border/60 bg-bg-hover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] sm:size-24 ${focusRing}`}
      >
        {album.coverUrl ? (
          <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-label text-text-muted">
            Sin portada
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Link to={`/albums/${album.id}`} className={`truncate text-section-title text-text-primary ${focusRing}`}>
              {album.title}
            </Link>
            <p className="truncate text-secondary text-text-secondary">
              {album.artist.name}
              <span className="text-text-muted"> · {album.year}</span>
            </p>
          </div>
          {(onToggleFavorite || onEdit || onDelete) && (
            <div className="flex shrink-0 items-center gap-1">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-pressed={Boolean(isFavorite)}
                  aria-label={isFavorite ? `Quitar ${album.title} de favoritos` : `Agregar ${album.title} a favoritos`}
                  className={`flex size-11 items-center justify-center rounded ${focusRing} ${
                    isFavorite ? "text-danger" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <HeartIcon filled={Boolean(isFavorite)} />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label={`Editar tu reseña de ${album.title}`}
                  className={`flex size-11 items-center justify-center rounded text-text-secondary hover:text-text-primary ${focusRing}`}
                >
                  <PencilIcon />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleting}
                  aria-label={`Eliminar tu reseña de ${album.title}`}
                  className={`flex size-11 items-center justify-center rounded text-text-secondary hover:text-danger disabled:opacity-50 ${focusRing}`}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <RatingStars value={review.rating} readOnly label="Calificación" />
          <span className="text-secondary font-bold text-accent">{review.rating.toFixed(1)}</span>
          <span className="text-label text-text-muted">
            {new Date(review.createdAt).toLocaleDateString("es", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {review.isRelisten && (
            <span className="rounded-full bg-bg-raised px-2 py-0.5 text-label text-text-secondary">Reescucha</span>
          )}
        </div>

        {review.text && <p className="line-clamp-2 pt-1 text-body text-text-secondary">{review.text}</p>}
      </div>
    </li>
  );
}
