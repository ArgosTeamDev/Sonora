import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CreateReviewDto, Review } from "@project/shared";
import { ReviewRepository } from "../domain/review.repository";
import { ReviewEntity } from "../domain/review.entity";
import { DuplicateReviewError } from "../domain/errors";

@Injectable()
export class CreateReviewUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(dto: CreateReviewDto): Promise<Review> {
    const existing = await this.reviews.findByUserAndAlbum(dto.userId, dto.albumId);
    if (existing) throw new DuplicateReviewError(dto.userId, dto.albumId);

    const entity = ReviewEntity.create(dto, randomUUID());
    await this.reviews.save(entity.toJSON());
    return entity.toJSON();
  }
}
