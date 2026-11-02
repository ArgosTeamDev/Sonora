import { Injectable } from "@nestjs/common";
import type { FeedEvent } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";
import { ReviewRepository } from "@/modules/review/domain/review.repository";
import { ListService } from "@/modules/list/list.service";

interface FavoriteRow {
  user_id: string;
  album_id: string;
  created_at: Date;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly db: MysqlService,
    private readonly reviews: ReviewRepository,
    private readonly lists: ListService,
  ) {}

  // Each source is asked for `limit` rows, so the merged top `limit` is exact
  // whichever kind of event dominates.
  async forUser(userId: string, limit: number): Promise<FeedEvent[]> {
    const [reviews, lists, favorites] = await Promise.all([
      this.reviews.findByFollowedBy(userId, limit),
      this.lists.findByFollowedBy(userId, limit),
      this.db.select<FavoriteRow>(
        `SELECT user_id, album_id, created_at FROM favorites
         WHERE user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
         ORDER BY created_at DESC LIMIT ?`,
        [userId, limit],
      ),
    ]);

    const events: FeedEvent[] = [
      ...reviews.map((review): FeedEvent => ({ type: "review", at: review.createdAt, userId: review.userId, review })),
      ...lists.map((list): FeedEvent => ({ type: "list", at: list.createdAt, userId: list.userId, list })),
      ...favorites.map(
        (f): FeedEvent => ({ type: "favorite", at: f.created_at, userId: f.user_id, albumId: f.album_id }),
      ),
    ];
    return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
  }
}
