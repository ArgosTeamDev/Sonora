import { Body, Controller, ForbiddenException, Get, Param, Patch, Put, Query, Req, UseGuards } from "@nestjs/common";
import {
  ProfileTopDtoSchema,
  UpdateUserDtoSchema,
  type Favorite,
  type ProfileTopDto,
  type Review,
  type UpdateUserDto,
  type User,
  type WatchlistItem,
} from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  list(@Query("q") q?: string): Promise<User[]> {
    return this.users.listAll(q);
  }

  @Get(":username")
  getProfile(@Param("username") username: string): Promise<User> {
    return this.users.getByUsername(username);
  }

  @Get(":username/reviews")
  getReviews(@Param("username") username: string): Promise<Review[]> {
    return this.users.getReviews(username);
  }

  @Get(":username/following")
  getFollowing(@Param("username") username: string): Promise<User[]> {
    return this.users.getFollowing(username);
  }

  @Get(":username/followers")
  getFollowers(@Param("username") username: string): Promise<User[]> {
    return this.users.getFollowers(username);
  }

  @Get(":username/favorites")
  getFavorites(@Param("username") username: string): Promise<Favorite[]> {
    return this.users.getFavorites(username);
  }

  @Get(":username/watchlist")
  getWatchlist(@Param("username") username: string): Promise<WatchlistItem[]> {
    return this.users.getWatchlist(username);
  }

  @Get(":username/top")
  getTop(@Param("username") username: string): Promise<string[]> {
    return this.users.getTop(username);
  }

  @Put(":username/top")
  @UseGuards(AuthGuard)
  setTop(
    @Param("username") username: string,
    @Body(new ZodValidationPipe(ProfileTopDtoSchema)) dto: ProfileTopDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<string[]> {
    if (req.authUser?.username !== username) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés editar tu propio perfil." });
    }
    return this.users.setTop(username, dto);
  }

  @Patch(":username")
  @UseGuards(AuthGuard)
  update(
    @Param("username") username: string,
    @Body(new ZodValidationPipe(UpdateUserDtoSchema)) dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<User> {
    if (req.authUser?.username !== username) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés editar tu propio perfil." });
    }
    return this.users.update(username, dto);
  }
}
