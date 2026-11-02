import { useQuery } from "@tanstack/react-query";
import type { FeedEvent } from "@project/shared";
import { http } from "@/shared/api/http";

export const feedKeys = {
  mine: (limit: number) => ["feed", limit] as const,
};

export function fetchFeed(limit: number): Promise<FeedEvent[]> {
  return http.get<FeedEvent[]>(`/feed?limit=${limit}`);
}

// Only meaningful signed in: the API answers 401 otherwise.
export function useFeed(limit: number, enabled: boolean) {
  return useQuery({ queryKey: feedKeys.mine(limit), queryFn: () => fetchFeed(limit), enabled });
}
