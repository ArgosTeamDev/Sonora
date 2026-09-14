import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats } from "@project/shared";
import { RatingStars } from "@/entities/review/ui/RatingStars";
import { buttonClasses } from "@/shared/ui/Button";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

interface AlbumOfTheMonthProps {
  album: AlbumWithStats;
}

// The spotlight reads from real fields on the album record (isAlbumOfTheMonth,
// editorialNote — see packages/shared/src/album.ts), not a hardcoded pick, so
// swapping which album is featured is a data change, not a code change.
export function AlbumOfTheMonth({ album }: AlbumOfTheMonthProps): JSX.Element {
  return (
    <section
      aria-label="Álbum del mes"
      className="flex flex-col gap-5 rounded-lg border border-border bg-bg-surface p-4 sm:flex-row sm:p-6"
    >
      <Link
        to={`/albums/${album.id}`}
        aria-label={`Ver ${album.title}`}
        className={`relative mx-auto h-48 w-48 shrink-0 overflow-hidden rounded border border-border/60 bg-bg-hover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_12px_28px_-12px_rgba(0,0,0,0.7)] sm:mx-0 sm:h-56 sm:w-56 ${focusRing}`}
      >
        {album.coverUrl ? (
          <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-label text-text-muted">
            Sin portada
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-strong px-2.5 py-0.5 text-label uppercase text-text-primary">
            Álbum del mes
          </span>
          <span className="text-label text-text-muted">{album.year}</span>
          {album.genres.map((genre) => (
            <span key={genre} className="text-label uppercase text-text-muted">
              {genre}
            </span>
          ))}
        </div>

        <h2 className="text-page-title text-text-primary">{album.title}</h2>
        <Link to={`/artists/${album.artist.slug}`} className={`w-fit text-secondary text-accent ${focusRing}`}>
          {album.artist.name}
        </Link>

        {album.editorialNote && <p className="text-body italic text-text-secondary">{album.editorialNote}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {album.averageRating !== null ? (
            <>
              <RatingStars value={album.averageRating} readOnly label="Promedio" />
              <span className="text-secondary text-text-muted">
                {album.averageRating.toFixed(1)} · {album.totalReviews} reseña
                {album.totalReviews === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <span className="text-secondary text-text-muted">Nadie lo calificó todavía.</span>
          )}
        </div>

        <Link to={`/albums/${album.id}`} className={buttonClasses("primary", "mt-1 w-fit")}>
          Registrar
        </Link>
      </div>
    </section>
  );
}
