import { useQuery } from "@tanstack/react-query";
import type { CreateReviewDto, Review, UpdateReviewDto } from "@project/shared";
import { http } from "@/shared/api/http";

export const reviewKeys = {
  list: () => ["reviews", "list"] as const,
  detail: (id: string) => ["reviews", "detail", id] as const,
};

export function fetchReviews(): Promise<Review[]> {
  return http.get<Review[]>("/reviews");
}

export function fetchReview(id: string): Promise<Review> {
  return http.get<Review>(`/reviews/${id}`);
}

export function createReview(dto: CreateReviewDto): Promise<Review> {
  return http.post<Review>("/reviews", dto);
}

export function updateReview(id: string, dto: UpdateReviewDto): Promise<Review> {
  return http.patch<Review>(`/reviews/${id}`, dto);
}

export function deleteReview(id: string): Promise<void> {
  return http.del<void>(`/reviews/${id}`);
}

export function useReviews() {
  return useQuery({ queryKey: reviewKeys.list(), queryFn: fetchReviews });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: () => fetchReview(id),
    enabled: Boolean(id),
  });
}
