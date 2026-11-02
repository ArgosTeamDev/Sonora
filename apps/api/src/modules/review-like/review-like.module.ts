import { Module } from "@nestjs/common";
import { ReviewLikeController } from "./review-like.controller";
import { ReviewLikeService } from "./review-like.service";

@Module({
  controllers: [ReviewLikeController],
  providers: [ReviewLikeService],
})
export class ReviewLikeModule {}
