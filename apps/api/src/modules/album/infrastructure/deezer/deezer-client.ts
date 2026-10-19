import { Injectable } from "@nestjs/common";
import { CachedFetcher } from "@/shared/http/cached-fetch";

const DEEZER_BASE = "https://api.deezer.com";
const CACHE_TTL_MS = 30 * 60 * 1000;
// Deezer's "no data" error code for an id that doesn't exist.
const NO_DATA = 800;

export interface DeezerArtist {
  id: number;
  name: string;
}

export interface DeezerTrack {
  title: string;
  duration?: number; // seconds
  preview?: string; // ~30s mp3, signed URL that expires after a few hours
}

// What /search/album returns. No release date or genres here — those only
// come with the full album (see DeezerClient.album).
export interface DeezerSearchAlbum {
  id: number;
  title: string;
  cover_big?: string;
  record_type?: string;
  nb_tracks?: number;
  artist: DeezerArtist;
}

export interface DeezerAlbum extends DeezerSearchAlbum {
  release_date?: string;
  genres?: { data: Array<{ name: string }> };
  tracks?: { data: DeezerTrack[] };
}

interface DeezerError {
  error: { type: string; message: string; code: number };
}

function isError(data: unknown): data is DeezerError {
  return typeof data === "object" && data !== null && "error" in data;
}

// Public, keyless API. The preview URLs it hands out are signed and expire,
// so they must never be persisted — this client's cache (30 min) is well
// inside their lifetime.
@Injectable()
export class DeezerClient {
  private readonly http = new CachedFetcher(CACHE_TTL_MS);

  async searchAlbums(term: string, limit = 12): Promise<DeezerSearchAlbum[]> {
    const data = await this.http.json<{ data?: DeezerSearchAlbum[] } | DeezerError>(
      `${DEEZER_BASE}/search/album?q=${encodeURIComponent(term)}&limit=${limit}`,
    );
    if (isError(data)) throw new Error(`Deezer search failed: ${data.error.message}`);
    return data.data ?? [];
  }

  async album(id: string): Promise<DeezerAlbum | null> {
    const data = await this.http.json<DeezerAlbum | DeezerError>(`${DEEZER_BASE}/album/${encodeURIComponent(id)}`);
    if (isError(data)) {
      if (data.error.code === NO_DATA) return null;
      throw new Error(`Deezer album ${id} failed: ${data.error.message}`);
    }
    return data;
  }
}
