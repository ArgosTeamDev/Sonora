import { Injectable } from "@nestjs/common";
import type { ArtistDiscography } from "@project/shared";
import { ReviewRepository } from "@/modules/review/domain/review.repository";
import { ArtistCatalog } from "../infrastructure/artist-catalog";
import { ArtistNotFoundError } from "../domain/errors";
import { withStats } from "./with-stats";

@Injectable()
export class GetArtistUseCase {
  constructor(
    private readonly catalog: ArtistCatalog,
    private readonly reviews: ReviewRepository,
  ) {}

  async execute(slug: string): Promise<ArtistDiscography> {
    const [discography, allReviews] = await Promise.all([this.catalog.discography(slug), this.reviews.findAll()]);
    if (!discography) throw new ArtistNotFoundError(slug);
    return {
      artist: discography.artist,
      albums: discography.albums.map((album) => withStats(album, allReviews)),
    };
  }
}
