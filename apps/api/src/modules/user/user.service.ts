import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Favorite, ProfileTopDto, Review, UpdateUserDto, User, WatchlistItem } from "@project/shared";
import { ReviewRepository } from "@/modules/review/domain/review.repository";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  listAll(query?: string): Promise<User[]> {
    return this.users.findAll(query);
  }

  async getByUsername(username: string): Promise<User> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundException({ code: "NOT_FOUND", message: `User ${username} not found` });
    }
    return user;
  }

  async getReviews(username: string): Promise<Review[]> {
    const user = await this.getByUsername(username);
    return this.reviews.findByUser(user.id);
  }

  async getFollowing(username: string): Promise<User[]> {
    const user = await this.getByUsername(username);
    return this.users.findFollowing(user.id);
  }

  async getFollowers(username: string): Promise<User[]> {
    const user = await this.getByUsername(username);
    return this.users.findFollowers(user.id);
  }

  async getFavorites(username: string): Promise<Favorite[]> {
    const user = await this.getByUsername(username);
    return this.users.findFavorites(user.id);
  }

  async getWatchlist(username: string): Promise<WatchlistItem[]> {
    const user = await this.getByUsername(username);
    return this.users.findWatchlist(user.id);
  }

  async getTop(username: string): Promise<string[]> {
    const user = await this.getByUsername(username);
    return this.users.findTop(user.id);
  }

  async setTop(username: string, dto: ProfileTopDto): Promise<string[]> {
    const user = await this.getByUsername(username);
    await this.users.setTop(user.id, dto.albumIds);
    return dto.albumIds;
  }

  async update(username: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getByUsername(username);
    if (user.version !== dto.version) {
      throw new ConflictException({
        code: "STALE_VERSION",
        message: `User ${username} is at version ${user.version}; update targeted version ${dto.version}`,
      });
    }

    return this.users.update(
      user.id,
      {
        name: dto.name,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        location: dto.location,
        badge: dto.badge,
      },
      user.version + 1,
    );
  }
}
