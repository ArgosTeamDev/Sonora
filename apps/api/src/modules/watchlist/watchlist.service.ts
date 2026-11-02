import { Injectable } from "@nestjs/common";
import type { CreateWatchlistDto, WatchlistItem } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";

interface WatchlistRow {
  user_id: string;
  album_id: string;
  created_at: Date;
}

@Injectable()
export class WatchlistService {
  constructor(private readonly db: MysqlService) {}

  async create(dto: CreateWatchlistDto): Promise<WatchlistItem> {
    // Idempotent: adding twice returns the existing row.
    await this.db.execute(
      `INSERT IGNORE INTO watchlist (user_id, album_id, created_at) VALUES (?, ?, UTC_TIMESTAMP(3))`,
      [dto.userId, dto.albumId],
    );
    const rows = await this.db.select<WatchlistRow>(
      `SELECT user_id, album_id, created_at FROM watchlist WHERE user_id = ? AND album_id = ?`,
      [dto.userId, dto.albumId],
    );
    const row = rows[0]!;
    return { userId: row.user_id, albumId: row.album_id, createdAt: row.created_at };
  }

  async remove(userId: string, albumId: string): Promise<void> {
    await this.db.execute(`DELETE FROM watchlist WHERE user_id = ? AND album_id = ?`, [userId, albumId]);
  }
}
