import { Body, Controller, Get, NotFoundException, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import {
  ChangePasswordDtoSchema,
  DeleteAccountDtoSchema,
  LoginDtoSchema,
  RegisterDtoSchema,
  type ChangePasswordDto,
  type DeleteAccountDto,
  type LoginDto,
  type RegisterDto,
  type User,
} from "@project/shared";
import { ZodValidationPipe } from "@/shared/http/zod-validation.pipe";
import { AuthGuard, type AuthenticatedRequest } from "@/shared/auth/auth.guard";
import { clearAuthCookie, setAuthCookie } from "@/shared/auth/cookie";
import { LoginRateLimit, PasswordRateLimit, RegisterRateLimit } from "@/shared/http/rate-limit.guard";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @UseGuards(RegisterRateLimit)
  async register(
    @Body(new ZodValidationPipe(RegisterDtoSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const { user, token } = await this.auth.register(dto);
    setAuthCookie(res, token);
    return user;
  }

  @Post("login")
  @UseGuards(LoginRateLimit)
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

  @Post("password")
  @UseGuards(AuthGuard, PasswordRateLimit)
  async changePassword(
    @Body(new ZodValidationPipe(ChangePasswordDtoSchema)) dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ ok: true }> {
    await this.auth.changePassword(req.authUser!.id, dto);
    return { ok: true };
  }

  // POST (not DELETE) so the password can travel in the body.
  @Post("delete-account")
  @UseGuards(AuthGuard, PasswordRateLimit)
  async deleteAccount(
    @Body(new ZodValidationPipe(DeleteAccountDtoSchema)) dto: DeleteAccountDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await this.auth.deleteAccount(req.authUser!.id, dto);
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
