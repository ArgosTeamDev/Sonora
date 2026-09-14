import { Injectable } from "@nestjs/common";
import type { CreateFollowDto, Follow } from "@project/shared";
import { JsonDb } from "@/shared/json-db/json-db.service";

@Injectable()
export class FollowService {
  constructor(private readonly db: JsonDb) {}

  async create(dto: CreateFollowDto): Promise<Follow> {
    const existing = this.db.state.follows.find(
      (f) => f.followerId === dto.followerId && f.followingId === dto.followingId,
    );
    if (existing) return existing;

    const follow: Follow = { ...dto, createdAt: new Date() };
    await this.db.mutate((data) => {
      data.follows.push(follow);
    });
    return follow;
  }

  async remove(followerId: string, followingId: string): Promise<void> {
    await this.db.mutate((data) => {
      data.follows = data.follows.filter(
        (f) => !(f.followerId === followerId && f.followingId === followingId),
      );
    });
  }
}
