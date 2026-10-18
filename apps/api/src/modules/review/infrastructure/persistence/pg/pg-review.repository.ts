import { Injectable } from "@nestjs/common";
import type { Review } from "@project/shared";
import { PgService } from "@/shared/db/pg.service";
import { ReviewRepository } from "@/modules/review/domain/review.repository";

interface ReviewRow {
  id: string;
  user_id: string;
  album_id: string;
  rating: string; // numeric comes back as a string
  text: string | null;
  is_relisten: boolean;
  listened_at: Date;
  version: number;
  created_at: Date;
  updated_at: Date;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id,
    rating: Number(row.rating),
    text: row.text,
    isRelisten: row.is_relisten,
    listenedAt: row.listened_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PgReviewRepository extends ReviewRepository {
  constructor(private readonly pg: PgService) {
    super();
  }

  async findAll(): Promise<Review[]> {
    const { rows } = await this.pg.query<ReviewRow>(`SELECT * FROM reviews ORDER BY created_at DESC`);
    return rows.map(toReview);
  }

  async findById(id: string): Promise<Review | null> {
    // A malformed id can't exist; without this Postgres rejects the uuid cast with a 500.
    if (!UUID_RE.test(id)) return null;
    const { rows } = await this.pg.query<ReviewRow>(`SELECT * FROM reviews WHERE id = $1`, [id]);
    return rows[0] ? toReview(rows[0]) : null;
  }

  async findByUser(userId: string): Promise<Review[]> {
    const { rows } = await this.pg.query<ReviewRow>(
      `SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(toReview);
  }

  async findByUserAndAlbum(userId: string, albumId: string): Promise<Review | null> {
    const { rows } = await this.pg.query<ReviewRow>(
      `SELECT * FROM reviews WHERE user_id = $1 AND album_id = $2`,
      [userId, albumId],
    );
    return rows[0] ? toReview(rows[0]) : null;
  }

  async save(review: Review): Promise<void> {
    await this.pg.query(
      `INSERT INTO reviews (id, user_id, album_id, rating, text, is_relisten, listened_at, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         rating = EXCLUDED.rating,
         text = EXCLUDED.text,
         is_relisten = EXCLUDED.is_relisten,
         listened_at = EXCLUDED.listened_at,
         version = EXCLUDED.version,
         updated_at = EXCLUDED.updated_at`,
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
    await this.pg.query(`DELETE FROM reviews WHERE id = $1`, [id]);
  }
}
