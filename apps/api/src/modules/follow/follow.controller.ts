import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CreateFollowDtoSchema, type CreateFollowDto, type Follow } from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { FollowService } from "./follow.service";

@Controller("follows")
export class FollowController {
  constructor(private readonly follows: FollowService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateFollowDtoSchema)) dto: CreateFollowDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Follow> {
    // followerId is never trusted from the body — you can only ever follow
    // as yourself.
    return this.follows.create({ ...dto, followerId: req.authUser!.id });
  }

  @Delete(":followerId/:followingId")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("followerId") followerId: string,
    @Param("followingId") followingId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    if (followerId !== req.authUser!.id) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés dejar de seguir en tu nombre." });
    }
    return this.follows.remove(followerId, followingId);
  }
}
