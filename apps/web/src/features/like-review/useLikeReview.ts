import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewLike } from "@project/shared";
import { likeReview, reviewLikeKeys, unlikeReview } from "@/entities/review-like/api";

interface LikeReviewInput {
  reviewId: string;
  nextIsLiked: boolean;
}

// One mutation for every card on the album page: it patches the album's likes
// list, which the cards read their count and "liked by me" from.
export function useLikeReview(albumId: string, userId: string) {
  const queryClient = useQueryClient();
  const key = reviewLikeKeys.byAlbum(albumId);

  return useMutation<void, unknown, LikeReviewInput, { previous?: ReviewLike[] }>({
    mutationFn: async ({ reviewId, nextIsLiked }) => {
      if (nextIsLiked) {
        await likeReview(reviewId);
      } else {
        await unlikeReview(reviewId);
      }
    },

    onMutate: async ({ reviewId, nextIsLiked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ReviewLike[]>(key);

      queryClient.setQueryData<ReviewLike[]>(key, (current) => {
        const without = (current ?? []).filter((l) => !(l.reviewId === reviewId && l.userId === userId));
        return nextIsLiked ? [...without, { reviewId, userId, createdAt: new Date() }] : without;
      });

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}
