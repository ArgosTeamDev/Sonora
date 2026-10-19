import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats } from "@project/shared";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

// Cover + title + artist, with no "Registrar" button or favorite toggle: a
// shelf is for browsing, not for acting. Three sizes share one shape:
//  - "sm": compact, for a 4-up row on a phone (profile favorites)
//  - "md": a year · genre line and larger text (home shelves)
//  - "lg": the catalog tile — big title, "artist · year", genre underneath
type ShelfSize = "sm" | "md" | "lg";

interface AlbumShelfItemProps {
  album: AlbumWithStats;
  size?: ShelfSize;
}

const TITLE_CLASS: Record<ShelfSize, string> = {
  sm: "text-[11px] font-bold leading-[14px]",
  md: "text-[14px] font-bold leading-[18px]",
  lg: "text-[15px] font-semibold leading-5 sm:text-section-title-lg sm:leading-6",
};

export function AlbumShelfItem({ album, size = "sm" }: AlbumShelfItemProps): JSX.Element {
  const genre = album.genres[0];
  return (
    <Link to={`/albums/${album.id}`} className={`group flex min-w-0 flex-col gap-2 ${focusRing}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded bg-bg-hover shadow-md ring-1 ring-border/40 motion-safe:transition-transform group-hover:-translate-y-0.5">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-label text-text-muted">
            Sin portada
          </div>
        )}
        {album.averageRating !== null && (
          <span
            className={`absolute bottom-1.5 right-1.5 rounded-sm bg-bg-deep/85 px-1.5 py-0.5 font-bold text-accent backdrop-blur-sm ${
              size === "lg" ? "text-secondary" : "text-[10px]"
            }`}
          >
            ★ {album.averageRating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className={`line-clamp-2 text-text-primary ${TITLE_CLASS[size]}`}>{album.title}</span>
        {size === "lg" ? (
          <span className="line-clamp-2 text-secondary text-text-secondary">
            {album.artist.name} <span className="text-text-muted">· {album.year}</span>
          </span>
        ) : (
          <span className={`truncate text-text-secondary ${size === "md" ? "text-secondary" : "text-[11px] leading-[16px]"}`}>
            {album.artist.name}
          </span>
        )}
        {size === "md" && (
          <span className="truncate pt-0.5 text-label font-normal uppercase tracking-[0.5px] text-text-muted">
            {album.year}
            {genre ? ` · ${genre}` : ""}
          </span>
        )}
        {size === "lg" && genre && (
          <span className="truncate pt-1 text-label uppercase text-text-muted">{genre}</span>
        )}
      </div>
    </Link>
  );
}
