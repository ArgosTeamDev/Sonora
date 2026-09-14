import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats } from "@project/shared";
import { buttonClasses } from "@/shared/ui/Button";

interface AlbumCardProps {
  album: AlbumWithStats;
  variant?: "grid" | "row";
  // Purely presentational — the mutation itself lives in whichever
  // page/feature renders this card (entities can't depend on features, see
  // CLAUDE.md rule 6), so it's just a callback + current state passed down.
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function RatingChip({ rating }: { rating: number }): JSX.Element {
  return (
    <span className="absolute bottom-2 right-2 rounded-sm bg-bg-deep/90 px-2 py-0.5 text-label text-text-primary backdrop-blur-sm">
      {rating.toFixed(1)}★
    </span>
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

function FavoriteButton({
  albumTitle,
  isFavorite,
  onToggleFavorite,
  className = "",
}: {
  albumTitle: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  className?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // the cover/title are links — don't navigate
        onToggleFavorite();
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Quitar ${albumTitle} de favoritos` : `Agregar ${albumTitle} a favoritos`}
      className={`flex size-9 items-center justify-center rounded-full ${focusRing} ${
        isFavorite ? "text-danger" : "text-text-primary"
      } ${className}`}
    >
      <HeartIcon filled={isFavorite} />
    </button>
  );
}

function Cover({
  album,
  className,
  isFavorite,
  onToggleFavorite,
}: {
  album: AlbumWithStats;
  className: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}): JSX.Element {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded border border-border/60 bg-bg-hover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_16px_-8px_rgba(0,0,0,0.6)] ${className}`}
    >
      {album.coverUrl ? (
        <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-secondary text-text-muted">
          Sin portada
        </div>
      )}
      {album.averageRating !== null && <RatingChip rating={album.averageRating} />}
      {onToggleFavorite && (
        <FavoriteButton
          albumTitle={album.title}
          isFavorite={Boolean(isFavorite)}
          onToggleFavorite={onToggleFavorite}
          className="absolute right-1 top-1 bg-bg-deep/90 backdrop-blur-sm hover:bg-bg-deep"
        />
      )}
    </div>
  );
}

function GenreLabel({ genre }: { genre?: string }): JSX.Element | null {
  if (!genre) return null;
  return <span className="pt-0.5 text-label uppercase text-text-muted">{genre}</span>;
}

export function AlbumCard({
  album,
  variant = "grid",
  isFavorite,
  onToggleFavorite,
}: AlbumCardProps): JSX.Element {
  const href = `/albums/${album.id}`;

  if (variant === "row") {
    return (
      <article className="flex w-full items-center gap-3">
        <Cover album={album} className="h-[72px] w-[72px]" />
        <Link to={href} className={`flex min-w-0 flex-1 flex-col ${focusRing}`}>
          <h3 className="truncate text-section-title text-text-primary">{album.title}</h3>
          <p className="truncate text-secondary text-text-secondary">
            {album.artist.name}
            <span className="text-text-muted"> · {album.year}</span>
          </p>
          <GenreLabel genre={album.genres[0]} />
        </Link>
        {onToggleFavorite && (
          <FavoriteButton
            albumTitle={album.title}
            isFavorite={Boolean(isFavorite)}
            onToggleFavorite={onToggleFavorite}
            className="text-text-muted hover:text-text-primary"
          />
        )}
        <Link to={href} className={buttonClasses("primary", "shrink-0 px-3")}>
          Registrar
        </Link>
      </article>
    );
  }

  return (
    <article className="flex w-full flex-col gap-2">
      <Link to={href} className={`flex flex-col gap-2 ${focusRing}`}>
        <Cover
          album={album}
          className="aspect-square w-full"
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
        <div className="flex flex-col">
          <h3 className="truncate text-section-title text-text-primary sm:text-section-title-lg">
            {album.title}
          </h3>
          <p className="truncate text-secondary text-text-secondary">
            {album.artist.name}
            <span className="text-text-muted"> · {album.year}</span>
          </p>
          <GenreLabel genre={album.genres[0]} />
        </div>
      </Link>
      <Link to={href} className={buttonClasses("primary", "w-full")}>
        Registrar
      </Link>
    </article>
  );
}
