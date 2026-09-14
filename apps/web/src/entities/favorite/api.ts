import { useQuery } from "@tanstack/react-query";
import type { CreateFavoriteDto, Favorite } from "@project/shared";
import { http } from "@/shared/api/http";

export const favoriteKeys = {
  list: (username: string) => ["users", "detail", username, "favorites"] as const,
};

export function fetchFavorites(username: string): Promise<Favorite[]> {
  return http.get<Favorite[]>(`/users/${username}/favorites`);
}

export function createFavorite(dto: CreateFavoriteDto): Promise<Favorite> {
  return http.post<Favorite>("/favorites", dto);
}

export function removeFavorite(userId: string, albumId: string): Promise<void> {
  return http.del<void>(`/favorites/${userId}/${albumId}`);
}

export function useFavorites(username: string) {
  return useQuery({
    queryKey: favoriteKeys.list(username),
    queryFn: () => fetchFavorites(username),
    enabled: Boolean(username),
  });
}
