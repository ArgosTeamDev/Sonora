import type { Track } from "@project/shared";
import { slugify } from "@/shared/text/slugify";
import type { AlbumWithArtist } from "@/modules/album/domain/album.repository";
import type { DeezerAlbum } from "./deezer-client";

export const DEEZER_ID_PREFIX = "dz-";

// Returns null when Deezer has no usable release date: year is required by
// the Album contract and we'd rather drop the entry than invent one.
export function toDeezerAlbum(album: DeezerAlbum): AlbumWithArtist | null {
  const releaseDate = album.release_date ? new Date(album.release_date) : null;
  if (!releaseDate || Number.isNaN(releaseDate.getTime())) return null;

  const tracks: Track[] = (album.tracks?.data ?? []).map((t, index) => ({
    trackNumber: index + 1,
    title: t.title,
    durationMs: t.duration ? t.duration * 1000 : null,
    previewUrl: t.preview ? t.preview : null,
  }));

  const recordType = album.record_type?.toLowerCase();

  return {
    id: `${DEEZER_ID_PREFIX}${album.id}`,
    title: album.title,
    year: releaseDate.getFullYear(),
    releaseDate,
    coverUrl: album.cover_big ?? null,
    genres: (album.genres?.data ?? []).slice(0, 5).map((g) => g.name.toLowerCase()),
    tracks,
    isSingle: recordType === "single" || recordType === "ep" || album.nb_tracks === 1,
    isAlbumOfTheMonth: false,
    editorialNote: null,
    artist: {
      id: `${DEEZER_ID_PREFIX}${album.artist.id}`,
      name: album.artist.name,
      // slugify() empties out for non-latin names; the id keeps the slug valid.
      slug: slugify(album.artist.name) || `artist-${album.artist.id}`,
    },
  };
}
