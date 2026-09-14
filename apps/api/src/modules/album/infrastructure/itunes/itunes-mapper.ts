import type { AlbumOverlay, Track } from "@project/shared";
import { slugify } from "@/shared/text/slugify";
import type { AlbumWithArtist } from "@/modules/album/domain/album.repository";
import type { ItunesCollection, ItunesTrack } from "./itunes-client";

// iTunes tags every non-album release with this suffix in its own title
// ("... - Single", "... - EP") — more reliable than trackCount alone, which
// would also misclassify short but real albums (Kind of Blue has 5 tracks).
const SINGLE_OR_EP_SUFFIX = /\s-\s(single|ep)$/i;

function isSingleRelease(collection: ItunesCollection): boolean {
  if (SINGLE_OR_EP_SUFFIX.test(collection.collectionName)) return true;
  return collection.trackCount === 1;
}

export function toAlbumWithArtist(
  collection: ItunesCollection,
  itunesTracks: ItunesTrack[],
  overlay: AlbumOverlay | null,
): AlbumWithArtist {
  const tracks: Track[] = [...itunesTracks]
    .sort((a, b) => a.trackNumber - b.trackNumber)
    .map((t) => ({
      trackNumber: t.trackNumber,
      title: t.trackName,
      durationMs: t.trackTimeMillis ?? null,
      previewUrl: t.previewUrl ?? null,
    }));

  return {
    id: String(collection.collectionId),
    title: collection.collectionName,
    year: new Date(collection.releaseDate).getFullYear(),
    releaseDate: new Date(collection.releaseDate),
    coverUrl: collection.artworkUrl100 ? collection.artworkUrl100.replace("100x100bb", "600x600bb") : null,
    genres: collection.primaryGenreName ? [collection.primaryGenreName.toLowerCase()] : [],
    tracks,
    isSingle: isSingleRelease(collection),
    isAlbumOfTheMonth: overlay?.isAlbumOfTheMonth ?? false,
    editorialNote: overlay?.editorialNote ?? null,
    artist: {
      id: String(collection.artistId),
      name: collection.artistName,
      slug: slugify(collection.artistName),
    },
  };
}
