import { Injectable, Logger } from "@nestjs/common";
import type { Artist } from "@project/shared";
import { slugify } from "@/shared/text/slugify";
import type { AlbumWithArtist } from "@/modules/album/domain/album.repository";
import { ItunesAlbumRepository } from "./itunes/itunes-album.repository";
import { DeezerClient, type DeezerArtist, type DeezerArtistAlbum } from "./deezer/deezer-client";
import { DEEZER_ID_PREFIX, toDeezerAlbum } from "./deezer/deezer-mapper";
import { MusicBrainzClient } from "./musicbrainz/musicbrainz-client";
import { MB_ID_PREFIX, toMusicBrainzAlbum } from "./musicbrainz/musicbrainz-mapper";

export interface Discography {
  artist: Artist;
  albums: AlbumWithArtist[];
}

const DEEZER_RECORD_TYPES = new Set(["album", "ep", "single"]);
// Each MusicBrainz cover is a separate Cover Art Archive lookup, so the
// fallback source stays small.
const MAX_MUSICBRAINZ_ALBUMS = 40;
// "artist-123" is the slug the mappers fall back to when a name has no latin characters.
const DEEZER_FALLBACK_SLUG = /^artist-(\d+)$/;

// "Album (Deluxe)" and "Album" are one release for a discography.
function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// An artist page is addressed by slug alone (the only handle the album pages
// link with), so the artist is resolved by name: the curated iTunes set first,
// then Deezer, then MusicBrainz. Deezer and MusicBrainz list the whole
// discography, which is what the search-only albums need to show up.
@Injectable()
export class ArtistCatalog {
  private readonly logger = new Logger(ArtistCatalog.name);

  constructor(
    private readonly itunes: ItunesAlbumRepository,
    private readonly deezer: DeezerClient,
    private readonly musicbrainz: MusicBrainzClient,
  ) {}

  async discography(slug: string): Promise<Discography | null> {
    const [curated, external] = await Promise.all([this.curated(slug), this.external(slug)]);

    const artist = curated[0]?.artist ?? external?.artist;
    if (!artist) return null;

    // Curated albums carry our reviews and editorial data, so they win over
    // the same title coming from the external catalog.
    const known = new Set(curated.map((a) => titleKey(a.title)));
    const extra = (external?.albums ?? []).filter((a) => !known.has(titleKey(a.title)));
    return { artist, albums: [...curated, ...extra] };
  }

  private async curated(slug: string): Promise<AlbumWithArtist[]> {
    try {
      const albums = await this.itunes.findAll({});
      return albums.filter((a) => a.artist.slug === slug);
    } catch (err) {
      this.logger.warn(`Curated catalog lookup failed: ${String(err)}`);
      return [];
    }
  }

  private async external(slug: string): Promise<Discography | null> {
    try {
      const fromDeezer = await this.fromDeezer(slug);
      if (fromDeezer) return fromDeezer;
    } catch (err) {
      this.logger.warn(`Deezer discography failed: ${String(err)}`);
    }
    try {
      return await this.fromMusicBrainz(slug);
    } catch (err) {
      this.logger.warn(`MusicBrainz discography failed: ${String(err)}`);
      return null;
    }
  }

  private async fromDeezer(slug: string): Promise<Discography | null> {
    const fallbackId = DEEZER_FALLBACK_SLUG.exec(slug)?.[1];
    let found: DeezerArtist | null | undefined;
    if (fallbackId) {
      found = await this.deezer.artist(fallbackId);
    } else {
      const hits = await this.deezer.searchArtists(slug.replace(/-/g, " "));
      found = hits.find((h) => slugify(h.name) === slug);
    }
    if (!found) return null;

    const artist: Artist = {
      id: `${DEEZER_ID_PREFIX}${found.id}`,
      name: found.name,
      slug: slugify(found.name) || `artist-${found.id}`,
    };
    const albums = this.dedupe(await this.deezer.artistAlbums(String(found.id)))
      .map((a) => toDeezerAlbum({ ...a, artist: found }))
      .filter((a): a is AlbumWithArtist => a !== null);
    return { artist, albums };
  }

  // Deezer lists explicit and clean editions, and deluxe re-releases, as
  // separate albums; keep one per title, preferring the explicit edition.
  private dedupe(albums: DeezerArtistAlbum[]): DeezerArtistAlbum[] {
    const byTitle = new Map<string, DeezerArtistAlbum>();
    for (const album of albums) {
      if (album.record_type && !DEEZER_RECORD_TYPES.has(album.record_type.toLowerCase())) continue;
      const key = titleKey(album.title);
      const existing = byTitle.get(key);
      if (!existing || (!existing.explicit_lyrics && album.explicit_lyrics)) byTitle.set(key, album);
    }
    return [...byTitle.values()];
  }

  private async fromMusicBrainz(slug: string): Promise<Discography | null> {
    const candidates = await this.musicbrainz.searchArtists(slug.replace(/-/g, " "));
    const found = candidates.find((c) => slugify(c.name) === slug);
    if (!found) return null;

    const artist: Artist = { id: `${MB_ID_PREFIX}${found.id}`, name: found.name, slug };
    const groups = (await this.musicbrainz.artistReleaseGroups(found.id)).slice(0, MAX_MUSICBRAINZ_ALBUMS);
    const mapped = await Promise.all(
      groups.map(async (group) =>
        toMusicBrainzAlbum(
          { ...group, "artist-credit": [{ name: found.name, artist: { id: found.id, name: found.name } }] },
          { coverUrl: (await this.musicbrainz.hasCover(group.id)) ? this.musicbrainz.coverUrl(group.id) : null },
        ),
      ),
    );
    return { artist, albums: mapped.filter((a): a is AlbumWithArtist => a !== null) };
  }
}
