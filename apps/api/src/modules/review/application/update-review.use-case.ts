import { Injectable } from "@nestjs/common";
import type { Review, UpdateReviewDto } from "@project/shared";
import { ReviewRepository } from "../domain/review.repository";
import { ReviewEntity } from "../domain/review.entity";
import { ReviewNotFoundError } from "../domain/errors";

@Injectable()
export class UpdateReviewUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(id: string, dto: UpdateReviewDto): Promise<Review> {
    const current = await this.reviews.findById(id);
    if (!current) throw new ReviewNotFoundError(id);

    const entity = ReviewEntity.fromState(current);
    entity.update(dto);
    await this.reviews.save(entity.toJSON());
    return entity.toJSON();
  }
}
