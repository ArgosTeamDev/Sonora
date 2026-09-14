import { Injectable } from "@nestjs/common";
import type { Review } from "@project/shared";
import { ReviewRepository } from "../domain/review.repository";
import { ReviewNotFoundError } from "../domain/errors";

@Injectable()
export class GetReviewUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(id: string): Promise<Review> {
    const review = await this.reviews.findById(id);
    if (!review) throw new ReviewNotFoundError(id);
    return review;
  }
}
