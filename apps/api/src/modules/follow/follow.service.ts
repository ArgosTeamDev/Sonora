import { Injectable } from "@nestjs/common";
import type { CreateFollowDto, Follow } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";

interface FollowRow {
  follower_id: string;
  following_id: string;
  created_at: Date;
}

@Injectable()
export class FollowService {
  constructor(private readonly db: MysqlService) {}

  async create(dto: CreateFollowDto): Promise<Follow> {
    // Idempotent: following someone twice returns the existing row.
    await this.db.execute(
      `INSERT IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, UTC_TIMESTAMP(3))`,
      [dto.followerId, dto.followingId],
    );
    const rows = await this.db.select<FollowRow>(
      `SELECT follower_id, following_id, created_at FROM follows WHERE follower_id = ? AND following_id = ?`,
      [dto.followerId, dto.followingId],
    );
    const row = rows[0]!;
    return { followerId: row.follower_id, followingId: row.following_id, createdAt: row.created_at };
  }

  async remove(followerId: string, followingId: string): Promise<void> {
    await this.db.execute(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?`, [
      followerId,
      followingId,
    ]);
  }
}
