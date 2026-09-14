import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Favorite } from "@project/shared";
import { createFavorite, favoriteKeys, removeFavorite } from "@/entities/favorite/api";

interface UseFavoriteAlbumParams {
  username: string;
  userId: string;
  albumId: string;
}

// Same list-patching pattern as useFollowUser: patches the favorites list
// cache directly so the profile's "Favoritos" section and this toggle agree
// instantly, without a refetch (CLAUDE.md rule 7).
export function useFavoriteAlbum({ username, userId, albumId }: UseFavoriteAlbumParams) {
  const queryClient = useQueryClient();
  const key = favoriteKeys.list(username);

  return useMutation<void, unknown, boolean, { previous?: Favorite[] }>({
    mutationFn: async (nextIsFavorite: boolean) => {
      if (nextIsFavorite) {
        await createFavorite({ userId, albumId });
      } else {
        await removeFavorite(userId, albumId);
      }
    },

    onMutate: async (nextIsFavorite) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Favorite[]>(key);

      queryClient.setQueryData<Favorite[]>(key, (current) => {
        const without = (current ?? []).filter((f) => f.albumId !== albumId);
        return nextIsFavorite ? [...without, { userId, albumId, createdAt: new Date() }] : without;
      });

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}
