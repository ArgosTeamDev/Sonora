import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CreateReviewLikeDtoSchema, type CreateReviewLikeDto, type ReviewLike } from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { ReviewLikeService } from "./review-like.service";

@Controller("review-likes")
export class ReviewLikeController {
  constructor(private readonly likes: ReviewLikeService) {}

  @Get()
  list(@Query("albumId") albumId?: string): Promise<ReviewLike[]> {
    if (!albumId) {
      throw new BadRequestException({ code: "VALIDATION_ERROR", message: "albumId es obligatorio." });
    }
    return this.likes.findByAlbum(albumId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateReviewLikeDtoSchema)) dto: CreateReviewLikeDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReviewLike> {
    return this.likes.create(dto.reviewId, req.authUser!.id);
  }

  @Delete(":reviewId")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("reviewId") reviewId: string, @Req() req: AuthenticatedRequest): Promise<void> {
    return this.likes.remove(reviewId, req.authUser!.id);
  }
}
