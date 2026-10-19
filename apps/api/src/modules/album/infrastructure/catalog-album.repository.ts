import { Injectable, Logger } from "@nestjs/common";
import {
  AlbumRepository,
  type AlbumFilters,
  type AlbumWithArtist,
} from "@/modules/album/domain/album.repository";
import { applyFilters } from "@/modules/album/domain/apply-filters";
import { ItunesAlbumRepository } from "./itunes/itunes-album.repository";
import { DeezerClient } from "./deezer/deezer-client";
import { DEEZER_ID_PREFIX, toDeezerAlbum } from "./deezer/deezer-mapper";
import { MusicBrainzClient } from "./musicbrainz/musicbrainz-client";
import { MB_ID_PREFIX, isAlbumLike, pickRelease, toMusicBrainzAlbum } from "./musicbrainz/musicbrainz-mapper";

// /search/album has no release date, so each hit needs its own album lookup.
// Capped to keep one search well under Deezer's 50 requests / 5 s limit.
const MAX_DEEZER_DETAILS = 12;
// MusicBrainz's fuzzy matching is noisy, so it only steps in when Deezer finds
// nothing at all — mixing it into a good Deezer result set just adds clutter.

// Album ids say where an album lives: "dz-…" Deezer, "mb-…" MusicBrainz, and
// anything else is a bare iTunes collectionId — which is what every review,
// favorite and curated overlay saved before the catalog had several sources.
// Search tries Deezer, then MusicBrainz, then iTunes as a last resort; the
// browse list stays on the curated iTunes set.
@Injectable()
export class CatalogAlbumRepository extends AlbumRepository {
  private readonly logger = new Logger(CatalogAlbumRepository.name);

  constructor(
    private readonly itunes: ItunesAlbumRepository,
    private readonly deezer: DeezerClient,
    private readonly musicbrainz: MusicBrainzClient,
  ) {
    super();
  }

  findAll(filters: AlbumFilters): Promise<AlbumWithArtist[]> {
    return this.itunes.findAll(filters);
  }

  async findById(id: string): Promise<AlbumWithArtist | null> {
    if (id.startsWith(DEEZER_ID_PREFIX)) return this.deezerById(id.slice(DEEZER_ID_PREFIX.length));
    if (id.startsWith(MB_ID_PREFIX)) return this.musicbrainzById(id.slice(MB_ID_PREFIX.length));
    return this.itunes.findById(id);
  }

  async findByIds(ids: string[]): Promise<AlbumWithArtist[]> {
    const unique = [...new Set(ids)];
    const deezerIds = unique.filter((id) => id.startsWith(DEEZER_ID_PREFIX));
    const mbIds = unique.filter((id) => id.startsWith(MB_ID_PREFIX));
    const itunesIds = unique.filter((id) => !id.startsWith(DEEZER_ID_PREFIX) && !id.startsWith(MB_ID_PREFIX));

    const [itunesAlbums, deezerAlbums, mbAlbums] = await Promise.all([
      this.itunes.findByIds(itunesIds),
      this.settled(deezerIds.map((id) => this.deezerById(id.slice(DEEZER_ID_PREFIX.length)))),
      // MusicBrainz is throttled to 1 req/s inside the client, so firing these together is safe.
      this.settled(mbIds.map((id) => this.musicbrainzById(id.slice(MB_ID_PREFIX.length)))),
    ]);
    return [...itunesAlbums, ...deezerAlbums, ...mbAlbums];
  }

  async search(query: string, filters: AlbumFilters): Promise<AlbumWithArtist[]> {
    const term = query.trim();
    if (term.length === 0) return [];

    let results = await this.searchDeezer(term);
    if (results.length === 0) results = await this.searchMusicBrainz(term);

    if (results.length === 0) {
      try {
        return await this.itunes.search(term, filters);
      } catch (err) {
        this.logger.warn(`iTunes fallback search failed: ${String(err)}`);
      }
    }

    return applyFilters(results, filters);
  }

  private async searchDeezer(term: string): Promise<AlbumWithArtist[]> {
    try {
      const hits = await this.deezer.searchAlbums(term, MAX_DEEZER_DETAILS);
      const albums = await this.settled(hits.map((hit) => this.deezerById(String(hit.id))));
      return albums;
    } catch (err) {
      this.logger.warn(`Deezer search failed: ${String(err)}`);
      return [];
    }
  }

  private async searchMusicBrainz(term: string): Promise<AlbumWithArtist[]> {
    try {
      const groups = (await this.musicbrainz.searchReleaseGroups(term)).filter(isAlbumLike);
      const mapped = await Promise.all(
        groups.map(async (group) =>
          toMusicBrainzAlbum(group, {
            coverUrl: (await this.musicbrainz.hasCover(group.id)) ? this.musicbrainz.coverUrl(group.id) : null,
          }),
        ),
      );
      return mapped.filter((a): a is AlbumWithArtist => a !== null);
    } catch (err) {
      this.logger.warn(`MusicBrainz search failed: ${String(err)}`);
      return [];
    }
  }

  private async deezerById(id: string): Promise<AlbumWithArtist | null> {
    const album = await this.deezer.album(id);
    return album ? toDeezerAlbum(album) : null;
  }

  private async musicbrainzById(id: string): Promise<AlbumWithArtist | null> {
    const group = await this.musicbrainz.releaseGroup(id);
    if (!group) return null;
    const releaseId = pickRelease(group);
    const [tracks, hasCover] = await Promise.all([
      releaseId ? this.musicbrainz.tracks(releaseId).catch(() => []) : Promise.resolve([]),
      this.musicbrainz.hasCover(group.id),
    ]);
    return toMusicBrainzAlbum(group, {
      tracks,
      coverUrl: hasCover ? this.musicbrainz.coverUrl(group.id) : null,
    });
  }

  // One failed lookup shouldn't sink the whole list.
  private async settled(tasks: Array<Promise<AlbumWithArtist | null>>): Promise<AlbumWithArtist[]> {
    const outcomes = await Promise.allSettled(tasks);
    const albums: AlbumWithArtist[] = [];
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") {
        if (outcome.value) albums.push(outcome.value);
      } else {
        this.logger.warn(`Album lookup failed: ${String(outcome.reason)}`);
      }
    }
    return albums;
  }
}
