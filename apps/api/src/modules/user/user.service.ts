import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Favorite, Review, UpdateUserDto, User } from "@project/shared";
import { JsonDb } from "@/shared/json-db/json-db.service";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly db: JsonDb,
  ) {}

  listAll(query?: string): User[] {
    return this.users.findAll(query);
  }

  getByUsername(username: string): User {
    const user = this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundException({ code: "NOT_FOUND", message: `User ${username} not found` });
    }
    return user;
  }

  getReviews(username: string): Review[] {
    const user = this.getByUsername(username);
    return this.db.state.reviews.filter((r) => r.userId === user.id);
  }

  getFollowing(username: string): User[] {
    const user = this.getByUsername(username);
    const followingIds = [
      ...new Set(this.db.state.follows.filter((f) => f.followerId === user.id).map((f) => f.followingId)),
    ];
    return followingIds
      .map((id) => this.users.findById(id))
      .filter((u): u is User => u !== null);
  }

  getFollowers(username: string): User[] {
    const user = this.getByUsername(username);
    const followerIds = [
      ...new Set(this.db.state.follows.filter((f) => f.followingId === user.id).map((f) => f.followerId)),
    ];
    return followerIds
      .map((id) => this.users.findById(id))
      .filter((u): u is User => u !== null);
  }

  getFavorites(username: string): Favorite[] {
    const user = this.getByUsername(username);
    return this.db.state.favorites.filter((f) => f.userId === user.id);
  }

  update(username: string, dto: UpdateUserDto): User {
    const user = this.getByUsername(username);
    if (user.version !== dto.version) {
      throw new ConflictException({
        code: "STALE_VERSION",
        message: `User ${username} is at version ${user.version}; update targeted version ${dto.version}`,
      });
    }

    return this.users.update(
      user.id,
      { name: dto.name, bio: dto.bio, avatarUrl: dto.avatarUrl },
      user.version + 1,
    );
  }
}
