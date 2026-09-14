import { Body, Controller, ForbiddenException, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { UpdateUserDtoSchema, type Favorite, type Review, type UpdateUserDto, type User } from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  list(@Query("q") q?: string): User[] {
    return this.users.listAll(q);
  }

  @Get(":username")
  getProfile(@Param("username") username: string): User {
    return this.users.getByUsername(username);
  }

  @Get(":username/reviews")
  getReviews(@Param("username") username: string): Review[] {
    return this.users.getReviews(username);
  }

  @Get(":username/following")
  getFollowing(@Param("username") username: string): User[] {
    return this.users.getFollowing(username);
  }

  @Get(":username/followers")
  getFollowers(@Param("username") username: string): User[] {
    return this.users.getFollowers(username);
  }

  @Get(":username/favorites")
  getFavorites(@Param("username") username: string): Favorite[] {
    return this.users.getFavorites(username);
  }

  @Patch(":username")
  @UseGuards(AuthGuard)
  update(
    @Param("username") username: string,
    @Body(new ZodValidationPipe(UpdateUserDtoSchema)) dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): User {
    if (req.authUser?.username !== username) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés editar tu propio perfil." });
    }
    return this.users.update(username, dto);
  }
}
