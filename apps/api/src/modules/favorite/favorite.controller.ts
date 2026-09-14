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
import { CreateFavoriteDtoSchema, type CreateFavoriteDto, type Favorite } from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { FavoriteService } from "./favorite.service";

@Controller("favorites")
export class FavoriteController {
  constructor(private readonly favorites: FavoriteService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateFavoriteDtoSchema)) dto: CreateFavoriteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Favorite> {
    // userId is never trusted from the body — you can only ever favorite an
    // album for yourself.
    return this.favorites.create({ ...dto, userId: req.authUser!.id });
  }

  @Delete(":userId/:albumId")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("userId") userId: string,
    @Param("albumId") albumId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    if (userId !== req.authUser!.id) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés editar tus propios favoritos." });
    }
    return this.favorites.remove(userId, albumId);
  }
}
