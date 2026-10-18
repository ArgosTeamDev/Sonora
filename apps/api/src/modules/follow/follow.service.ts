import { Injectable } from "@nestjs/common";
import type { CreateFollowDto, Follow } from "@project/shared";
import { PgService } from "@/shared/db/pg.service";

@Injectable()
export class FollowService {
  constructor(private readonly pg: PgService) {}

  async create(dto: CreateFollowDto): Promise<Follow> {
    // Idempotent: following someone twice returns the existing row.
    await this.pg.query(
      `INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, now())
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [dto.followerId, dto.followingId],
    );
    const { rows } = await this.pg.query<{ follower_id: string; following_id: string; created_at: Date }>(
      `SELECT follower_id, following_id, created_at FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [dto.followerId, dto.followingId],
    );
    const row = rows[0]!;
    return { followerId: row.follower_id, followingId: row.following_id, createdAt: row.created_at };
  }

  async remove(followerId: string, followingId: string): Promise<void> {
    await this.pg.query(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, [
      followerId,
      followingId,
    ]);
  }
}
