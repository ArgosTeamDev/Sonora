interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const MAX_ENTRIES = 500;

// GET-JSON helper with an in-memory TTL cache that serves stale data when the
// upstream fails — keeps "fetch the catalog live" from hammering the public,
// rate-limited music APIs on every page load.
export class CachedFetcher {
  private readonly cache = new Map<string, CacheEntry>();
  // Identical requests in flight share one upstream call (e.g. two clients
  // searching the same term at once).
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly ttlMs: number,
    private readonly headers: Record<string, string> = {},
    private readonly timeoutMs = 8000,
    // Awaited right before every real network call (never on a cache hit) —
    // lets a caller enforce an upstream rate limit.
    private readonly beforeRequest?: () => Promise<void>,
  ) {}

  async json<T>(url: string): Promise<T> {
    const cached = this.cache.get(url);
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.value as T;

    const pending = this.inflight.get(url);
    if (pending) return pending as Promise<T>;

    const request = this.fetchJson<T>(url, now).catch((err: unknown) => {
      if (cached) return cached.value as T;
      throw err;
    });
    this.inflight.set(url, request);
    try {
      return await request;
    } finally {
      this.inflight.delete(url);
    }
  }

  private async fetchJson<T>(url: string, now: number): Promise<T> {
    await this.beforeRequest?.();
    const res = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(this.timeoutMs) });
    if (!res.ok) throw new Error(`Request to ${new URL(url).host} failed with status ${res.status}`);
    const value = (await res.json()) as T;
    this.remember(url, value, now);
    return value;
  }

  private remember(url: string, value: unknown, now: number): void {
    if (this.cache.size >= MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(url, { expiresAt: now + this.ttlMs, value });
  }
}
