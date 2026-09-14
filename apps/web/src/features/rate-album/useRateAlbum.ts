import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Review } from "@project/shared";
import { createReview, reviewKeys, updateReview } from "@/entities/review/api";

interface RateAlbumInput {
  rating: number;
  text?: string | null;
  isRelisten?: boolean;
}

interface UseRateAlbumParams {
  userId: string;
  albumId: string;
  existingReview: Review | null;
}

const OPTIMISTIC_PREFIX = "optimistic-";

// Single source of truth: the reviews LIST cache. The mutation patches the
// matching entry in place (or appends an optimistic one on first rating), so
// both this album's "your rating" widget and its reviews list — which both
// read from useReviews() — update from the exact same state, instantly.
export function useRateAlbum({ userId, albumId, existingReview }: UseRateAlbumParams) {
  const queryClient = useQueryClient();
  const listKey = reviewKeys.list();

  return useMutation({
    mutationFn: (input: RateAlbumInput): Promise<Review> => {
      if (existingReview) {
        return updateReview(existingReview.id, {
          version: existingReview.version,
          rating: input.rating,
          text: input.text ?? existingReview.text,
          isRelisten: input.isRelisten ?? existingReview.isRelisten,
        });
      }

      return createReview({
        userId,
        albumId,
        rating: input.rating,
        text: input.text ?? null,
        isRelisten: input.isRelisten ?? false,
        listenedAt: new Date(),
      });
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousList = queryClient.getQueryData<Review[]>(listKey);

      queryClient.setQueryData<Review[]>(listKey, (current) => {
        if (!current) return current;

        if (existingReview) {
          return current.map((r) =>
            r.id === existingReview.id
              ? {
                  ...r,
                  rating: input.rating,
                  text: input.text ?? r.text,
                  isRelisten: input.isRelisten ?? r.isRelisten,
                }
              : r,
          );
        }

        const now = new Date();
        const optimisticReview: Review = {
          id: `${OPTIMISTIC_PREFIX}${now.getTime()}`,
          userId,
          albumId,
          rating: input.rating,
          text: input.text ?? null,
          isRelisten: input.isRelisten ?? false,
          listenedAt: now,
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
        return [...current, optimisticReview];
      });

      return { previousList };
    },

    onError: (_error, _input, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(listKey, context.previousList);
      }
    },

    onSuccess: (review) => {
      queryClient.setQueryData<Review[]>(listKey, (current) => {
        if (!current) return current;
        const withoutOptimistic = current.filter((r) => !r.id.startsWith(OPTIMISTIC_PREFIX));
        const alreadyPresent = withoutOptimistic.some((r) => r.id === review.id);
        return alreadyPresent
          ? withoutOptimistic.map((r) => (r.id === review.id ? review : r))
          : [...withoutOptimistic, review];
      });
    },
  });
}
