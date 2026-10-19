import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats } from "@project/shared";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

// Compact cover + title + artist, sized for a 4-up shelf on a phone. Unlike
// AlbumCard there's no "Registrar" button or favorite toggle: a shelf is for
// showing a person's picks, not for acting on them.
interface AlbumShelfItemProps {
  album: AlbumWithStats;
  // "md" adds a year · genre line and larger text — for shelves with room.
  size?: "sm" | "md";
}

export function AlbumShelfItem({ album, size = "sm" }: AlbumShelfItemProps): JSX.Element {
  const isMd = size === "md";
  return (
    <Link to={`/albums/${album.id}`} className={`flex min-w-0 flex-col gap-1.5 ${focusRing}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded bg-bg-hover shadow-md">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-label text-text-muted">
            Sin portada
          </div>
        )}
        {album.averageRating !== null && (
          <span className="absolute bottom-1 right-1 rounded-sm bg-bg-deep/80 px-1.5 py-0.5 text-[10px] font-bold text-accent backdrop-blur-sm">
            {album.averageRating.toFixed(1)}★
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span
          className={`truncate font-bold text-text-primary ${isMd ? "text-[14px] leading-[18px]" : "text-[11px] leading-[14px]"}`}
        >
          {album.title}
        </span>
        <span className={`truncate text-text-secondary ${isMd ? "text-secondary" : "text-[11px] leading-[16px]"}`}>
          {album.artist.name}
        </span>
        {isMd && (
          <span className="truncate pt-0.5 text-label font-normal uppercase tracking-[0.5px] text-text-muted">
            {album.year}
            {album.genres[0] ? ` · ${album.genres[0]}` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
