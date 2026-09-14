import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  CreateReviewDtoSchema,
  UpdateReviewDtoSchema,
  type CreateReviewDto,
  type Review,
  type UpdateReviewDto,
} from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { ListReviewsUseCase } from "@/modules/review/application/list-reviews.use-case";
import { GetReviewUseCase } from "@/modules/review/application/get-review.use-case";
import { CreateReviewUseCase } from "@/modules/review/application/create-review.use-case";
import { UpdateReviewUseCase } from "@/modules/review/application/update-review.use-case";
import { DeleteReviewUseCase } from "@/modules/review/application/delete-review.use-case";

@Controller("reviews")
export class ReviewController {
  constructor(
    private readonly listReviews: ListReviewsUseCase,
    private readonly getReview: GetReviewUseCase,
    private readonly createReview: CreateReviewUseCase,
    private readonly updateReview: UpdateReviewUseCase,
    private readonly deleteReview: DeleteReviewUseCase,
  ) {}

  @Get()
  list(): Promise<Review[]> {
    return this.listReviews.execute();
  }

  @Get(":id")
  getOne(@Param("id") id: string): Promise<Review> {
    return this.getReview.execute(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateReviewDtoSchema)) dto: CreateReviewDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Review> {
    // The body's userId is never trusted — a review is always created as
    // whoever the auth cookie says you are.
    return this.createReview.execute({ ...dto, userId: req.authUser!.id });
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateReviewDtoSchema)) dto: UpdateReviewDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Review> {
    const existing = await this.getReview.execute(id);
    if (existing.userId !== req.authUser!.id) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés editar tus propias reseñas." });
    }
    return this.updateReview.execute(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    const existing = await this.getReview.execute(id);
    if (existing.userId !== req.authUser!.id) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés eliminar tus propias reseñas." });
    }
    return this.deleteReview.execute(id);
  }
}
