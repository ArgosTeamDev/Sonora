import { z } from "zod";

export const ReviewLikeSchema = z.object({
  reviewId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
});
export type ReviewLike = z.infer<typeof ReviewLikeSchema>;

export const CreateReviewLikeDtoSchema = z.object({ reviewId: z.string().uuid() });
export type CreateReviewLikeDto = z.infer<typeof CreateReviewLikeDtoSchema>;
