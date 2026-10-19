import { useQuery } from "@tanstack/react-query";
import type { AddListItemDto, CreateListDto, List } from "@project/shared";
import { http } from "@/shared/api/http";

export const listKeys = {
  recent: (limit: number) => ["lists", "recent", limit] as const,
  byUser: (username: string) => ["users", "detail", username, "lists"] as const,
};

export function fetchLists(username: string): Promise<List[]> {
  return http.get<List[]>(`/users/${username}/lists`);
}

export function fetchRecentLists(limit: number): Promise<List[]> {
  return http.get<List[]>(`/lists?limit=${limit}`);
}

export function createList(dto: CreateListDto): Promise<List> {
  return http.post<List>("/lists", dto);
}

export function addListItem(listId: string, dto: AddListItemDto): Promise<List> {
  return http.post<List>(`/lists/${listId}/items`, dto);
}

export function removeListItem(listId: string, albumId: string): Promise<List> {
  return http.del<List>(`/lists/${listId}/items/${albumId}`);
}

export function useLists(username: string) {
  return useQuery({
    queryKey: listKeys.byUser(username),
    queryFn: () => fetchLists(username),
    enabled: Boolean(username),
  });
}

export function useRecentLists(limit = 6) {
  return useQuery({
    queryKey: listKeys.recent(limit),
    queryFn: () => fetchRecentLists(limit),
  });
}
