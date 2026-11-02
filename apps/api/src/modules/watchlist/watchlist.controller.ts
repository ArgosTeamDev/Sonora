import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from "@nestjs/common";
import { CreateWatchlistDtoSchema, type CreateWatchlistDto, type WatchlistItem } from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { WatchlistService } from "./watchlist.service";

const AddToWatchlistSchema = CreateWatchlistDtoSchema.pick({ albumId: true });

// Both routes act on the authenticated user, never on an id taken from the
// request.
@Controller("watchlist")
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(AddToWatchlistSchema)) dto: Pick<CreateWatchlistDto, "albumId">,
    @Req() req: AuthenticatedRequest,
  ): Promise<WatchlistItem> {
    return this.watchlist.create({ albumId: dto.albumId, userId: req.authUser!.id });
  }

  @Delete(":albumId")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("albumId") albumId: string, @Req() req: AuthenticatedRequest): Promise<void> {
    return this.watchlist.remove(req.authUser!.id, albumId);
  }
}
