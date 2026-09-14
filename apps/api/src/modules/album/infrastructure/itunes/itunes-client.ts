import { Injectable } from "@nestjs/common";

const ITUNES_BASE = "https://itunes.apple.com";
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface ItunesCollection {
  collectionId: number;
  collectionName: string;
  artistId: number;
  artistName: string;
  artworkUrl100?: string;
  releaseDate: string;
  primaryGenreName?: string;
  trackCount?: number;
}

export interface ItunesTrack {
  trackNumber: number;
  trackName: string;
  trackTimeMillis?: number;
  previewUrl?: string;
}

interface ItunesLookupResponse {
  results: Array<Record<string, unknown>>;
}

interface TopAlbumsFeedResponse {
  feed: {
    entry?: Array<{ id: { attributes: { "im:id": string } } }>;
  };
}

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

// One HTTP client for the whole album module, so its in-memory cache is
// shared across every request instead of being rebuilt per-call — this is
// what keeps "fetch the catalog live" from hammering iTunes' unauthenticated,
// rate-limited API on every page load.
@Injectable()
export class ItunesClient {
  private readonly cache = new Map<string, CacheEntry>();

  async searchAlbums(term: string, limit = 25): Promise<ItunesCollection[]> {
    const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(term)}&media=music&entity=album&limit=${limit}`;
    const data = await this.fetchCached<ItunesLookupResponse>(url);
    return data.results as unknown as ItunesCollection[];
  }

  async lookupAlbums(ids: string[]): Promise<ItunesCollection[]> {
    if (ids.length === 0) return [];
    const url = `${ITUNES_BASE}/lookup?id=${ids.join(",")}&entity=album`;
    const data = await this.fetchCached<ItunesLookupResponse>(url);
    return data.results.filter(
      (r) => r.wrapperType === "collection",
    ) as unknown as ItunesCollection[];
  }

  async lookupAlbumWithTracks(
    id: string,
  ): Promise<{ collection: ItunesCollection; tracks: ItunesTrack[] } | null> {
    const url = `${ITUNES_BASE}/lookup?id=${id}&entity=song`;
    const data = await this.fetchCached<ItunesLookupResponse>(url);
    const collection = data.results.find((r) => r.wrapperType === "collection");
    if (!collection) return null;

    const tracks = data.results.filter(
      (r) => r.wrapperType === "track" && r.kind === "song",
    ) as unknown as ItunesTrack[];

    return { collection: collection as unknown as ItunesCollection, tracks };
  }

  // Real, currently-popular albums — this is what keeps Explorar's default
  // (no search query) view from being limited to just our curated overlay
  // ids. No auth needed: it's the same public feed iTunes.com itself uses.
  async fetchTopAlbumIds(limit = 50): Promise<string[]> {
    const url = `${ITUNES_BASE}/us/rss/topalbums/limit=${limit}/json`;
    try {
      const data = await this.fetchCached<TopAlbumsFeedResponse>(url);
      return (data.feed.entry ?? []).map((e) => e.id.attributes["im:id"]);
    } catch {
      // Non-essential enrichment — the curated overlay ids alone are still
      // a usable catalog if the charts feed is down.
      return [];
    }
  }

  private async fetchCached<T>(url: string): Promise<T> {
    const cached = this.cache.get(url);
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.value as T;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`iTunes request failed with status ${res.status}`);
      const value = (await res.json()) as T;
      this.cache.set(url, { expiresAt: now + CACHE_TTL_MS, value });
      return value;
    } catch (err) {
      // Serve stale data rather than break the page if iTunes is briefly
      // unavailable or rate-limiting us.
      if (cached) return cached.value as T;
      throw err;
    }
  }
}
