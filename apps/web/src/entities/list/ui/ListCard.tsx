import type { JSX } from "react";
import type { AlbumWithStats, List } from "@project/shared";

const MOSAIC_SIZE = 4;

interface ListCardProps {
  list: List;
  // Albums already resolved by id; anything missing is just left blank.
  albumsById: Map<string, AlbumWithStats>;
  ownerUsername: string | null;
}

// A list as a 2×2 mosaic of its first covers, with its name and owner. There
// is no list detail page yet, so the card is informational, not a link.
export function ListCard({ list, albumsById, ownerUsername }: ListCardProps): JSX.Element {
  const covers = list.albumIds.slice(0, MOSAIC_SIZE).map((id) => albumsById.get(id));
  const slots = Array.from({ length: MOSAIC_SIZE }, (_, i) => covers[i]);

  return (
    <article className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-bg-surface p-3 lg:w-auto">
      <div className="relative grid grid-cols-2 gap-1.5 overflow-hidden rounded">
        {slots.map((album, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-sm bg-bg-hover">
            {album?.coverUrl && (
              <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
        ))}
        <span className="absolute bottom-2 left-2 rounded-xl bg-bg-deep/85 px-2 py-0.5 text-label text-text-primary backdrop-blur-sm">
          {list.albumIds.length} álbum{list.albumIds.length === 1 ? "" : "es"}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-1">
        <h3 className="text-section-title-lg leading-6 text-text-primary">{list.name}</h3>
        {list.description && <p className="line-clamp-2 text-secondary text-text-secondary">{list.description}</p>}
      </div>
      {ownerUsername && <p className="px-1 text-label text-text-secondary">Por @{ownerUsername}</p>}
    </article>
  );
}
