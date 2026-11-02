import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ReviewLike } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";

interface LikeRow {
  review_id: string;
  user_id: string;
  created_at: Date;
}

const toLike = (row: LikeRow): ReviewLike => ({
  reviewId: row.review_id,
  userId: row.user_id,
  createdAt: row.created_at,
});

@Injectable()
export class ReviewLikeService {
  constructor(private readonly db: MysqlService) {}

  // Every like on the reviews of one album — the album page counts them and
  // checks "did I like this" from the same list.
  async findByAlbum(albumId: string): Promise<ReviewLike[]> {
    const rows = await this.db.select<LikeRow>(
      `SELECT l.review_id, l.user_id, l.created_at
       FROM review_likes l JOIN reviews r ON r.id = l.review_id
       WHERE r.album_id = ? ORDER BY l.created_at`,
      [albumId],
    );
    return rows.map(toLike);
  }

  async create(reviewId: string, userId: string): Promise<ReviewLike> {
    const owners = await this.db.select<{ user_id: string }>(`SELECT user_id FROM reviews WHERE id = ?`, [reviewId]);
    if (!owners[0]) {
      throw new NotFoundException({ code: "NOT_FOUND", message: `Review ${reviewId} not found` });
    }
    if (owners[0].user_id === userId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "No podés dar like a tu propia reseña." });
    }
    // Idempotent: liking twice returns the existing row.
    await this.db.execute(
      `INSERT IGNORE INTO review_likes (review_id, user_id, created_at) VALUES (?, ?, UTC_TIMESTAMP(3))`,
      [reviewId, userId],
    );
    const rows = await this.db.select<LikeRow>(
      `SELECT review_id, user_id, created_at FROM review_likes WHERE review_id = ? AND user_id = ?`,
      [reviewId, userId],
    );
    return toLike(rows[0]!);
  }

  async remove(reviewId: string, userId: string): Promise<void> {
    await this.db.execute(`DELETE FROM review_likes WHERE review_id = ? AND user_id = ?`, [reviewId, userId]);
  }
}
