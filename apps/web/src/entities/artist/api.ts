import { useQuery } from "@tanstack/react-query";
import type { ArtistDiscography } from "@project/shared";
import { http } from "@/shared/api/http";

export const artistKeys = {
  detail: (slug: string) => ["artists", "detail", slug] as const,
};

export function fetchArtist(slug: string): Promise<ArtistDiscography> {
  return http.get<ArtistDiscography>(`/artists/${encodeURIComponent(slug)}`);
}

export function useArtist(slug: string) {
  return useQuery({
    queryKey: artistKeys.detail(slug),
    queryFn: () => fetchArtist(slug),
    enabled: Boolean(slug),
    // A 404 is a real answer; retrying it only delays the message.
    retry: false,
  });
}
