import type { Album, Artist } from "@project/shared";

export interface AlbumWithArtist extends Album {
  artist: Artist;
}

export interface AlbumFilters {
  genre?: string;
  year?: number;
  artistId?: string;
}

export abstract class AlbumRepository {
  abstract findAll(filters: AlbumFilters): Promise<AlbumWithArtist[]>;
  abstract findById(id: string): Promise<AlbumWithArtist | null>;
  // Live search across all of iTunes, not just the curated catalog (there's
  // no "list everything" on iTunes, so browsing without a query still falls
  // back to findAll's overlay-backed list).
  abstract search(query: string, filters: AlbumFilters): Promise<AlbumWithArtist[]>;
  // Resolves a specific, known set of ids regardless of whether they're in
  // the curated/chart browse set — used to look up the albums behind a list
  // of reviews, since a review can reference any album found via search.
  abstract findByIds(ids: string[]): Promise<AlbumWithArtist[]>;
}
