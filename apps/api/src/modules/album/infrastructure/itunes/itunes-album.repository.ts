import { Injectable } from "@nestjs/common";
import {
  AlbumRepository,
  type AlbumFilters,
  type AlbumWithArtist,
} from "@/modules/album/domain/album.repository";
import { AlbumOverlayRepository } from "@/modules/album/domain/album-overlay.repository";
import { ItunesClient } from "./itunes-client";
import { toAlbumWithArtist } from "./itunes-mapper";

@Injectable()
export class ItunesAlbumRepository extends AlbumRepository {
  constructor(
    private readonly itunes: ItunesClient,
    private readonly overlays: AlbumOverlayRepository,
  ) {
    super();
  }

  // No "list everything" exists on iTunes, so the default browse view is a
  // union of our curated overlay ids (guarantees the editorial pick and
  // anything we deliberately added stay visible) and iTunes' own public Top
  // Albums chart (real breadth, not just what we hand-picked). Fetched
  // without tracks: the browse grid never renders a tracklist.
  async findAll(filters: AlbumFilters): Promise<AlbumWithArtist[]> {
    const [overlayList, chartIds] = await Promise.all([
      this.overlays.findAll(),
      this.itunes.fetchTopAlbumIds(),
    ]);
    const overlaysById = new Map(overlayList.map((o) => [o.id, o]));
    const ids = [...new Set([...overlayList.map((o) => o.id), ...chartIds])];
    if (ids.length === 0) return [];

    const collections = await this.itunes.lookupAlbums(ids);
    const albums = collections.map((c) =>
      toAlbumWithArtist(c, [], overlaysById.get(String(c.collectionId)) ?? null),
    );

    return this.applyFilters(albums, filters);
  }

  async findById(id: string): Promise<AlbumWithArtist | null> {
    const result = await this.itunes.lookupAlbumWithTracks(id);
    if (!result) return null;
    const overlay = await this.overlays.findById(id);
    return toAlbumWithArtist(result.collection, result.tracks, overlay);
  }

  // Not limited to the curated catalog — any album on iTunes is a valid
  // result, enriched with our overlay data (editorial pick, if any) when
  // it happens to already be in our catalog too.
  async search(query: string, filters: AlbumFilters): Promise<AlbumWithArtist[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const [collections, overlayList] = await Promise.all([
      this.itunes.searchAlbums(trimmed),
      this.overlays.findAll(),
    ]);
    const overlaysById = new Map(overlayList.map((o) => [o.id, o]));
    const albums = collections.map((c) =>
      toAlbumWithArtist(c, [], overlaysById.get(String(c.collectionId)) ?? null),
    );

    return this.applyFilters(albums, filters);
  }

  async findByIds(ids: string[]): Promise<AlbumWithArtist[]> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];

    const [collections, overlayList] = await Promise.all([
      this.itunes.lookupAlbums(uniqueIds),
      this.overlays.findAll(),
    ]);
    const overlaysById = new Map(overlayList.map((o) => [o.id, o]));

    return collections.map((c) =>
      toAlbumWithArtist(c, [], overlaysById.get(String(c.collectionId)) ?? null),
    );
  }

  private applyFilters(albums: AlbumWithArtist[], filters: AlbumFilters): AlbumWithArtist[] {
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
}
