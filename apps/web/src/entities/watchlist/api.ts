import { useQuery } from "@tanstack/react-query";
import type { CreateWatchlistDto, WatchlistItem } from "@project/shared";
import { http } from "@/shared/api/http";

export const watchlistKeys = {
  list: (username: string) => ["users", "detail", username, "watchlist"] as const,
};

export function fetchWatchlist(username: string): Promise<WatchlistItem[]> {
  return http.get<WatchlistItem[]>(`/users/${username}/watchlist`);
}

// The API takes the user from the session cookie, so only the album goes up.
export function addToWatchlist(dto: Pick<CreateWatchlistDto, "albumId">): Promise<WatchlistItem> {
  return http.post<WatchlistItem>("/watchlist", dto);
}

export function removeFromWatchlist(albumId: string): Promise<void> {
  return http.del<void>(`/watchlist/${encodeURIComponent(albumId)}`);
}

export function useWatchlist(username: string) {
  return useQuery({
    queryKey: watchlistKeys.list(username),
    queryFn: () => fetchWatchlist(username),
    enabled: Boolean(username),
  });
}
