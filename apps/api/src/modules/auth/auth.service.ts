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

  async register(dto: RegisterDto): Promise<AuthResult> {
    if (await this.users.existsByUsername(dto.username)) {
      throw new ConflictException({
        code: "DUPLICATE_USERNAME",
        message: `El usuario "${dto.username}" ya existe.`,
      });
    }

    if (await this.users.existsByEmail(dto.email)) {
      throw new ConflictException({
        code: "DUPLICATE_EMAIL",
        message: "Ya existe una cuenta con ese correo.",
      });
    }

    const user = await this.users.insert({
      id: randomUUID(),
      username: dto.username,
      name: dto.name,
      email: dto.email,
      location: dto.location || null,
      passwordHash: hashPassword(dto.password),
      createdAt: new Date(),
    });

    return { user, token: signToken({ sub: user.id, username: user.username }) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByIdentifierWithPassword(dto.identifier);
    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Usuario, correo o contraseña incorrectos.",
      });
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { user: publicUser, token: signToken({ sub: user.id, username: user.username }, dto.remember) };
  }

  me(userId: string): Promise<User | null> {
    return this.users.findById(userId);
  }
}
