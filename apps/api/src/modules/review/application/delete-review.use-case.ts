import { Injectable } from "@nestjs/common";
import { ReviewRepository } from "../domain/review.repository";
import { ReviewNotFoundError } from "../domain/errors";

@Injectable()
export class DeleteReviewUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(id: string): Promise<void> {
    const review = await this.reviews.findById(id);
    if (!review) throw new ReviewNotFoundError(id);
    await this.reviews.remove(id);
  }
}
