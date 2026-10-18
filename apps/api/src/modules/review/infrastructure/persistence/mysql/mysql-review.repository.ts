import { Injectable } from "@nestjs/common";
import type { Review } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";
import { ReviewRepository } from "@/modules/review/domain/review.repository";

interface ReviewRow {
  id: string;
  user_id: string;
  album_id: string;
  rating: number;
  text: string | null;
  is_relisten: number;
  listened_at: Date;
  version: number;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = "id, user_id, album_id, rating, `text`, is_relisten, listened_at, version, created_at, updated_at";

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id,
    rating: row.rating,
    text: row.text,
    isRelisten: Boolean(row.is_relisten),
    listenedAt: row.listened_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class MysqlReviewRepository extends ReviewRepository {
  constructor(private readonly db: MysqlService) {
    super();
  }

  async findAll(): Promise<Review[]> {
    const rows = await this.db.select<ReviewRow>(`SELECT ${COLUMNS} FROM reviews ORDER BY created_at DESC`);
    return rows.map(toReview);
  }

  async findById(id: string): Promise<Review | null> {
    const rows = await this.db.select<ReviewRow>(`SELECT ${COLUMNS} FROM reviews WHERE id = ?`, [id]);
    return rows[0] ? toReview(rows[0]) : null;
  }

  async findByUser(userId: string): Promise<Review[]> {
    const rows = await this.db.select<ReviewRow>(
      `SELECT ${COLUMNS} FROM reviews WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(toReview);
  }

  async findByUserAndAlbum(userId: string, albumId: string): Promise<Review | null> {
    const rows = await this.db.select<ReviewRow>(
      `SELECT ${COLUMNS} FROM reviews WHERE user_id = ? AND album_id = ?`,
      [userId, albumId],
    );
    return rows[0] ? toReview(rows[0]) : null;
  }

  async save(review: Review): Promise<void> {
    await this.db.execute(
      `INSERT INTO reviews (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         \`text\` = VALUES(\`text\`),
         is_relisten = VALUES(is_relisten),
         listened_at = VALUES(listened_at),
         version = VALUES(version),
         updated_at = VALUES(updated_at)`,
      [
        review.id,
        review.userId,
        review.albumId,
        review.rating,
        review.text,
        review.isRelisten,
        review.listenedAt,
        review.version,
        review.createdAt,
        review.updatedAt,
      ],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM reviews WHERE id = ?`, [id]);
  }
}
