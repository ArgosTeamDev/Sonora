import { Injectable } from "@nestjs/common";
import { CachedFetcher } from "@/shared/http/cached-fetch";

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";
const CACHE_TTL_MS = 60 * 60 * 1000;
// MusicBrainz allows 1 request/second per client and requires an identifying
// User-Agent; a little headroom avoids bursts being throttled.
const MIN_GAP_MS = 1100;
const USER_AGENT = process.env.MUSICBRAINZ_USER_AGENT ?? "Sonora/0.1 (https://sonora.cetiprojects.tech)";

export interface MbRelease {
  id: string;
  status?: string;
}

export interface MbReleaseGroup {
  id: string;
  title: string;
  "first-release-date"?: string;
  "primary-type"?: string;
  "artist-credit"?: Array<{ name: string; artist: { id: string; name: string } }>;
  tags?: Array<{ name: string; count: number }>;
  releases?: MbRelease[];
}

export interface MbTrack {
  title: string;
  length?: number | null; // ms
}

interface MbSearchResponse {
  "release-groups"?: MbReleaseGroup[];
}

interface MbReleaseResponse {
  media?: Array<{ tracks?: MbTrack[] }>;
}

// Fallback catalog for what Deezer doesn't have. Slow by design (1 req/s), so
// callers should only reach for it when the primary source comes up short.
@Injectable()
export class MusicBrainzClient {
  private readonly http = new CachedFetcher(
    CACHE_TTL_MS,
    { "User-Agent": USER_AGENT, Accept: "application/json" },
    8000,
    () => this.waitForTurn(),
  );
  private readonly coverChecks = new Map<string, Promise<boolean>>();
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  async searchReleaseGroups(term: string, limit = 10): Promise<MbReleaseGroup[]> {
    const url = `${MB_BASE}/release-group/?query=${encodeURIComponent(term)}&fmt=json&limit=${limit}`;
    const data = await this.http.json<MbSearchResponse>(url);
    return data["release-groups"] ?? [];
  }

  async releaseGroup(id: string): Promise<MbReleaseGroup | null> {
    const url = `${MB_BASE}/release-group/${encodeURIComponent(id)}?inc=artist-credits+releases+tags&fmt=json`;
    try {
      return await this.http.json<MbReleaseGroup>(url);
    } catch (err) {
      // 404 (unknown id) and 400 (malformed id) both mean "not an album we can resolve".
      if (err instanceof Error && /status (400|404)/.test(err.message)) return null;
      throw err;
    }
  }

  async tracks(releaseId: string): Promise<MbTrack[]> {
    const url = `${MB_BASE}/release/${encodeURIComponent(releaseId)}?inc=recordings&fmt=json`;
    const data = await this.http.json<MbReleaseResponse>(url);
    return (data.media ?? []).flatMap((m) => m.tracks ?? []);
  }

  coverUrl(releaseGroupId: string): string {
    return `${CAA_BASE}/release-group/${releaseGroupId}/front-500`;
  }

  // Cover Art Archive has no art for many releases; check so the UI gets
  // null (and its own placeholder) instead of a broken image.
  hasCover(releaseGroupId: string): Promise<boolean> {
    let check = this.coverChecks.get(releaseGroupId);
    if (!check) {
      check = fetch(this.coverUrl(releaseGroupId), { method: "HEAD", signal: AbortSignal.timeout(4000) })
        .then((res) => res.ok)
        .catch(() => false);
      this.coverChecks.set(releaseGroupId, check);
    }
    return check;
  }

  // Serializes real requests with MIN_GAP_MS between them; cache hits never get here.
  private waitForTurn(): Promise<void> {
    const turn = this.queue.then(async () => {
      const wait = this.lastRequestAt + MIN_GAP_MS - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.lastRequestAt = Date.now();
    });
    this.queue = turn.catch(() => undefined);
    return turn;
  }
}
