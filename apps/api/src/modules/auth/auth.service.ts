import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { LoginDto, RegisterDto, User } from "@project/shared";
import { UserRepository } from "@/modules/user/user.repository";
import { hashPassword, verifyPassword } from "@/shared/auth/password";
import { signToken } from "@/shared/auth/jwt";

export interface AuthResult {
  user: User;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly users: UserRepository) {}

  register(dto: RegisterDto): AuthResult {
    if (this.users.existsByUsername(dto.username)) {
      throw new ConflictException({
        code: "DUPLICATE_USERNAME",
        message: `El usuario "${dto.username}" ya existe.`,
      });
    }

    const user = this.users.insert({
      id: randomUUID(),
      username: dto.username,
      name: dto.name,
      passwordHash: hashPassword(dto.password),
      createdAt: new Date(),
    });

    return { user, token: signToken({ sub: user.id, username: user.username }) };
  }

  login(dto: LoginDto): AuthResult {
    const user = this.users.findByUsernameWithPassword(dto.username);
    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { user: publicUser, token: signToken({ sub: user.id, username: user.username }) };
  }

  me(userId: string): User | null {
    return this.users.findById(userId);
  }
}
