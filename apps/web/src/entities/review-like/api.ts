import { useQuery } from "@tanstack/react-query";
import type { ReviewLike } from "@project/shared";
import { http } from "@/shared/api/http";

export const reviewLikeKeys = {
  byAlbum: (albumId: string) => ["review-likes", "album", albumId] as const,
};

export function fetchReviewLikes(albumId: string): Promise<ReviewLike[]> {
  return http.get<ReviewLike[]>(`/review-likes?albumId=${encodeURIComponent(albumId)}`);
}

export function likeReview(reviewId: string): Promise<ReviewLike> {
  return http.post<ReviewLike>("/review-likes", { reviewId });
}

export function unlikeReview(reviewId: string): Promise<void> {
  return http.del<void>(`/review-likes/${reviewId}`);
}

export function useReviewLikes(albumId: string) {
  return useQuery({
    queryKey: reviewLikeKeys.byAlbum(albumId),
    queryFn: () => fetchReviewLikes(albumId),
    enabled: Boolean(albumId),
  });
}
