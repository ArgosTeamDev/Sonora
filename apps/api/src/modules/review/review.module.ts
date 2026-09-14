import { Module } from "@nestjs/common";
import { ReviewController } from "./infrastructure/http/review.controller";
import { JsonReviewRepository } from "./infrastructure/persistence/json/json-review.repository";
import { ReviewRepository } from "./domain/review.repository";
import { ListReviewsUseCase } from "./application/list-reviews.use-case";
import { GetReviewUseCase } from "./application/get-review.use-case";
import { CreateReviewUseCase } from "./application/create-review.use-case";
import { UpdateReviewUseCase } from "./application/update-review.use-case";
import { DeleteReviewUseCase } from "./application/delete-review.use-case";

@Module({
  controllers: [ReviewController],
  providers: [
    { provide: ReviewRepository, useClass: JsonReviewRepository },
    ListReviewsUseCase,
    GetReviewUseCase,
    CreateReviewUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
  ],
  // AlbumModule reuses ReviewRepository to compute averageRating/totalReviews
  // (see album/application/with-stats.ts) instead of reading reviews itself.
  exports: [ReviewRepository],
})
export class ReviewModule {}
