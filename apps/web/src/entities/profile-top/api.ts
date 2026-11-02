import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export const profileTopKeys = {
  byUser: (username: string) => ["users", "detail", username, "top"] as const,
};

// Ordered album ids, first = position 1.
export function fetchProfileTop(username: string): Promise<string[]> {
  return http.get<string[]>(`/users/${username}/top`);
}

export function saveProfileTop(username: string, albumIds: string[]): Promise<string[]> {
  return http.put<string[]>(`/users/${username}/top`, { albumIds });
}

export function useProfileTop(username: string) {
  return useQuery({
    queryKey: profileTopKeys.byUser(username),
    queryFn: () => fetchProfileTop(username),
    enabled: Boolean(username),
  });
}

export function useSaveProfileTop(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (albumIds: string[]) => saveProfileTop(username, albumIds),
    onSuccess: (albumIds) => {
      queryClient.setQueryData(profileTopKeys.byUser(username), albumIds);
    },
  });
}
