import type { Review } from "@project/shared";

export abstract class ReviewRepository {
  abstract findAll(): Promise<Review[]>;
  abstract findById(id: string): Promise<Review | null>;
  abstract findByUserAndAlbum(userId: string, albumId: string): Promise<Review | null>;
  abstract save(review: Review): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
