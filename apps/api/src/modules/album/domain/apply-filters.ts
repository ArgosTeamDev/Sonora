import type { AlbumFilters, AlbumWithArtist } from "./album.repository";

export function applyFilters(albums: AlbumWithArtist[], filters: AlbumFilters): AlbumWithArtist[] {
  let result = albums;
  if (filters.genre) {
    result = result.filter((a) => a.genres.includes(filters.genre as string));
  }
  if (filters.year !== undefined) {
    result = result.filter((a) => a.year === filters.year);
  }
  if (filters.artistId) {
    result = result.filter((a) => a.artist.id === filters.artistId);
  }
  return result;
}
