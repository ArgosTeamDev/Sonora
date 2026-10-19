import type { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats } from "@project/shared";
import { RatingStars } from "@/entities/review/ui/RatingStars";
import { buttonClasses } from "@/shared/ui/Button";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

interface AlbumOfTheMonthProps {
  album: AlbumWithStats;
  label?: string;
  // Extra action next to the primary one (e.g. "add to list"); the entity
  // can't depend on features, so the caller supplies it.
  secondaryAction?: ReactNode;
}

// The spotlight is whichever album is best rated (see topRatedAlbum), not a
// hardcoded pick; the editorial quote still comes from the album's
// editorialNote when it has one.
export function AlbumOfTheMonth({
  album,
  label = "Álbum del año",
  secondaryAction,
}: AlbumOfTheMonthProps): JSX.Element {
  const href = `/albums/${album.id}`;
  const rating = album.averageRating;

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-lg bg-bg-surface p-4 lg:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-accent-cta/25 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* Phone: label and rating share the top row. */}
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <span className="rounded-xl bg-accent/90 px-2.5 py-0.5 text-label uppercase text-on-accent">{label}</span>
          {rating !== null && (
            <span className="flex items-center gap-1 rounded-xl bg-bg-hover/90 px-2.5 py-1 text-secondary font-semibold text-text-primary">
              <span className="text-accent" aria-hidden="true">
                ★
              </span>
              {rating.toFixed(1)} <span className="text-text-muted">/ 5.0</span>
            </span>
          )}
        </div>

        <div className="flex gap-4 lg:contents">
          <Link
            to={href}
            aria-label={`Ver ${album.title}`}
            className={`relative size-28 shrink-0 overflow-hidden rounded bg-bg-hover shadow-2xl lg:size-64 ${focusRing}`}
          >
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-label text-text-muted">
                Sin portada
              </div>
            )}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 lg:justify-start lg:gap-3">
            {/* Desktop: label, year and genres sit above the title. */}
            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              <span className="rounded-xl bg-bg-hover px-2.5 py-0.5 text-label uppercase text-text-secondary">
                {label}
              </span>
              <span className="rounded-xl bg-accent-cta/40 px-2.5 py-0.5 text-label text-accent">{album.year}</span>
              {album.genres.map((genre) => (
                <span key={genre} className="text-label uppercase text-text-muted">
                  {genre}
                </span>
              ))}
            </div>

            <h2 className="text-[26px] font-extrabold leading-8 tracking-[-0.65px] text-text-primary lg:text-page-title-lg">
              <Link to={href} className={focusRing}>
                {album.title}
              </Link>
            </h2>
            <p className="text-secondary text-text-secondary lg:text-[24px] lg:leading-8">
              <Link to={`/artists/${album.artist.slug}`} className={`lg:text-accent ${focusRing}`}>
                {album.artist.name}
              </Link>
              <span className="lg:hidden"> • {album.year}</span>
            </p>

            {album.editorialNote && (
              <blockquote className="line-clamp-3 text-secondary italic text-text-secondary lg:mt-1 lg:border-l-2 lg:border-border lg:pl-4 lg:text-[18px] lg:leading-7">
                “{album.editorialNote}”
              </blockquote>
            )}

            {/* Desktop rating block. */}
            <div className="hidden items-center gap-4 pt-1 lg:flex">
              {rating !== null ? (
                <>
                  <span className="flex items-center gap-2 rounded bg-bg-hover px-3 py-2">
                    <RatingStars value={rating} readOnly label="Promedio" />
                    <span className="text-2xl font-bold text-text-primary">{rating.toFixed(1)}</span>
                    <span className="text-secondary text-text-muted">/ 5.0</span>
                  </span>
                  <span className="text-secondary text-text-secondary">
                    <span className="font-semibold text-text-primary">{album.totalReviews}</span> registro
                    {album.totalReviews === 1 ? "" : "s"} en total
                  </span>
                </>
              ) : (
                <span className="text-secondary text-text-muted">Nadie lo calificó todavía.</span>
              )}
            </div>

            <div className="hidden items-center gap-3 pt-3 lg:flex">
              <Link to={href} className={buttonClasses("primary", "bg-accent-strong text-on-accent px-5")}>
                Guardar en diario
              </Link>
              {secondaryAction}
            </div>
          </div>
        </div>

        {/* Phone actions: full-width primary + the secondary icon. */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to={href}
            className={buttonClasses("primary", "flex-1 bg-accent text-on-accent hover:bg-accent hover:brightness-110")}
          >
            Guardar en diario
          </Link>
          {secondaryAction}
        </div>
      </div>
    </section>
  );
}
