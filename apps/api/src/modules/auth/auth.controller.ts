import { Body, Controller, Get, NotFoundException, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { LoginDtoSchema, RegisterDtoSchema, type LoginDto, type RegisterDto, type User } from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { clearAuthCookie, setAuthCookie } from "@/shared/auth/cookie";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(
    @Body(new ZodValidationPipe(RegisterDtoSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const { user, token } = await this.auth.register(dto);
    setAuthCookie(res, token);
    return user;
  }

  @Post("login")
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const { user, token } = await this.auth.login(dto);
    setAuthCookie(res, token, dto.remember);
    return user;
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    clearAuthCookie(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@Req() req: AuthenticatedRequest): Promise<User> {
    const user = req.authUser ? await this.auth.me(req.authUser.id) : null;
    if (!user) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Sesión inválida." });
    }
    return user;
  }
}
