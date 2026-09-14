import { useQuery } from "@tanstack/react-query";
import type { AlbumWithStats } from "@project/shared";
import { http } from "@/shared/api/http";

export interface AlbumListFilters {
  genre?: string;
  year?: number;
  artistId?: string;
  sort?: "rating" | "year" | "title";
  // A non-empty q searches live across all of iTunes instead of just the
  // curated catalog (see AlbumRepository.search on the backend).
  q?: string;
}

export const albumKeys = {
  list: (filters: AlbumListFilters) => ["albums", "list", filters] as const,
  detail: (id: string) => ["albums", "detail", id] as const,
  byIds: (ids: string[]) => ["albums", "byIds", [...ids].sort()] as const,
};

function buildQuery(filters: AlbumListFilters): string {
  const params = new URLSearchParams();
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.year !== undefined) params.set("year", String(filters.year));
  if (filters.artistId) params.set("artistId", filters.artistId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchAlbums(filters: AlbumListFilters): Promise<AlbumWithStats[]> {
  return http.get<AlbumWithStats[]>(`/albums${buildQuery(filters)}`);
}

export function fetchAlbum(id: string): Promise<AlbumWithStats> {
  return http.get<AlbumWithStats>(`/albums/${id}`);
}

export function useAlbums(filters: AlbumListFilters) {
  return useQuery({
    queryKey: albumKeys.list(filters),
    queryFn: () => fetchAlbums(filters),
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: albumKeys.detail(id),
    queryFn: () => fetchAlbum(id),
    enabled: Boolean(id),
  });
}

export function fetchAlbumsByIds(ids: string[]): Promise<AlbumWithStats[]> {
  return http.get<AlbumWithStats[]>(`/albums?ids=${ids.join(",")}`);
}

// Resolves a specific, known set of album ids regardless of whether they're
// in the curated/chart browse list — for turning a list of reviews into
// the albums they reference, since a review can point at any album found
// via search (see AlbumRepository.findByIds on the backend).
export function useAlbumsByIds(ids: string[]) {
  return useQuery({
    queryKey: albumKeys.byIds(ids),
    queryFn: () => fetchAlbumsByIds(ids),
    enabled: ids.length > 0,
  });
}
