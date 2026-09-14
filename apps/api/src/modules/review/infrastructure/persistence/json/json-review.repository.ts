import { Injectable } from "@nestjs/common";
import type { Review } from "@project/shared";
import { JsonDb } from "@/shared/json-db/json-db.service";
import { ReviewRepository } from "@/modules/review/domain/review.repository";

@Injectable()
export class JsonReviewRepository extends ReviewRepository {
  constructor(private readonly db: JsonDb) {
    super();
  }

  async findAll(): Promise<Review[]> {
    return this.db.state.reviews;
  }

  async findById(id: string): Promise<Review | null> {
    return this.db.state.reviews.find((r) => r.id === id) ?? null;
  }

  async findByUserAndAlbum(userId: string, albumId: string): Promise<Review | null> {
    return (
      this.db.state.reviews.find((r) => r.userId === userId && r.albumId === albumId) ?? null
    );
  }

  async save(review: Review): Promise<void> {
    await this.db.mutate((data) => {
      const index = data.reviews.findIndex((r) => r.id === review.id);
      if (index === -1) {
        data.reviews.push(review);
      } else {
        data.reviews[index] = review;
      }
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.mutate((data) => {
      data.reviews = data.reviews.filter((r) => r.id !== id);
    });
  }
}
