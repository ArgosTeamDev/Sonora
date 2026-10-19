import type { AlbumWithStats } from "@project/shared";

// "Álbum del año": simply the best-rated album, ties broken by who has the
// most reviews behind the score. Albums nobody has rated can't win.
export function topRatedAlbum(albums: AlbumWithStats[]): AlbumWithStats | null {
  let best: AlbumWithStats | null = null;
  for (const album of albums) {
    if (album.averageRating === null) continue;
    if (
      best === null ||
      album.averageRating > (best.averageRating ?? 0) ||
      (album.averageRating === best.averageRating && album.totalReviews > best.totalReviews)
    ) {
      best = album;
    }
  }
  return best;
}
