import { Injectable } from "@nestjs/common";
import type { AlbumWithStats } from "@project/shared";
import { ReviewRepository } from "@/modules/review/domain/review.repository";
import { AlbumRepository } from "../domain/album.repository";
import { AlbumNotFoundError } from "../domain/errors";
import { withStats } from "./with-stats";

@Injectable()
export class GetAlbumUseCase {
  constructor(
    private readonly albums: AlbumRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  async execute(id: string): Promise<AlbumWithStats> {
    const album = await this.albums.findById(id);
    if (!album) throw new AlbumNotFoundError(id);
    const allReviews = await this.reviews.findAll();
    return withStats(album, allReviews);
  }
}
