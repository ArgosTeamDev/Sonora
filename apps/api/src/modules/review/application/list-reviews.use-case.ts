import { Injectable } from "@nestjs/common";
import type { Review } from "@project/shared";
import { ReviewRepository } from "../domain/review.repository";

@Injectable()
export class ListReviewsUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  execute(): Promise<Review[]> {
    return this.reviews.findAll();
  }
}
