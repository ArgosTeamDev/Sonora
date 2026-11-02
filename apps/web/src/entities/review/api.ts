import { useQuery } from "@tanstack/react-query";
import type { CreateReviewDto, Review, UpdateReviewDto } from "@project/shared";
import { http } from "@/shared/api/http";

export const reviewKeys = {
  list: () => ["reviews", "list"] as const,
  detail: (id: string) => ["reviews", "detail", id] as const,
  // Prefix shared by every per-user list, so mutations can patch or
  // invalidate all of them at once.
  usersPrefix: () => ["reviews", "user"] as const,
  byUser: (username: string) => ["reviews", "user", username] as const,
};

export function fetchReviews(): Promise<Review[]> {
  return http.get<Review[]>("/reviews");
}

export function fetchUserReviews(username: string): Promise<Review[]> {
  return http.get<Review[]>(`/users/${encodeURIComponent(username)}/reviews`);
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

// One user's reviews only. Profiles use this instead of downloading every
// review in the app and filtering in the browser.
export function useUserReviews(username: string) {
  return useQuery({
    queryKey: reviewKeys.byUser(username),
    queryFn: () => fetchUserReviews(username),
    enabled: Boolean(username),
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: () => fetchReview(id),
    enabled: Boolean(id),
  });
}
