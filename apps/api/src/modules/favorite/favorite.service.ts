import { Injectable } from "@nestjs/common";
import type { CreateFavoriteDto, Favorite } from "@project/shared";
import { PgService } from "@/shared/db/pg.service";

@Injectable()
export class FavoriteService {
  constructor(private readonly pg: PgService) {}

  async create(dto: CreateFavoriteDto): Promise<Favorite> {
    // Idempotent: favoriting twice returns the existing row.
    await this.pg.query(
      `INSERT INTO favorites (user_id, album_id, created_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id, album_id) DO NOTHING`,
      [dto.userId, dto.albumId],
    );
    const { rows } = await this.pg.query<{ user_id: string; album_id: string; created_at: Date }>(
      `SELECT user_id, album_id, created_at FROM favorites WHERE user_id = $1 AND album_id = $2`,
      [dto.userId, dto.albumId],
    );
    const row = rows[0]!;
    return { userId: row.user_id, albumId: row.album_id, createdAt: row.created_at };
  }

  async remove(userId: string, albumId: string): Promise<void> {
    await this.pg.query(`DELETE FROM favorites WHERE user_id = $1 AND album_id = $2`, [userId, albumId]);
  }
}
