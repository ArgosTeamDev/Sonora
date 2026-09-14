import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Review } from "@project/shared";
import { deleteReview, reviewKeys } from "@/entities/review/api";

// Same single-source-of-truth pattern as useRateAlbum: patch the reviews
// LIST cache directly so every reader (the rating widget, the reviews list)
// updates from the same state at once.
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const listKey = reviewKeys.list();

  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),

    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousList = queryClient.getQueryData<Review[]>(listKey);

      queryClient.setQueryData<Review[]>(listKey, (current) =>
        current ? current.filter((r) => r.id !== reviewId) : current,
      );

      return { previousList };
    },

    onError: (_error, _reviewId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(listKey, context.previousList);
      }
    },
  });
}
