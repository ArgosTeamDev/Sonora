import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { WatchlistItem } from "@project/shared";
import { addToWatchlist, removeFromWatchlist, watchlistKeys } from "@/entities/watchlist/api";

interface UseWatchlistAlbumParams {
  username: string;
  userId: string;
  albumId: string;
}

// Same list-patching pattern as useFavoriteAlbum: the watchlist cache is
// patched directly so the toggle and the profile section agree instantly.
export function useWatchlistAlbum({ username, userId, albumId }: UseWatchlistAlbumParams) {
  const queryClient = useQueryClient();
  const key = watchlistKeys.list(username);

  return useMutation<void, unknown, boolean, { previous?: WatchlistItem[] }>({
    mutationFn: async (nextIsSaved: boolean) => {
      if (nextIsSaved) {
        await addToWatchlist({ albumId });
      } else {
        await removeFromWatchlist(albumId);
      }
    },

    onMutate: async (nextIsSaved) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WatchlistItem[]>(key);

      queryClient.setQueryData<WatchlistItem[]>(key, (current) => {
        const without = (current ?? []).filter((item) => item.albumId !== albumId);
        return nextIsSaved ? [{ userId, albumId, createdAt: new Date() }, ...without] : without;
      });

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}
