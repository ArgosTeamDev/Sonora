import type { AlbumWithStats, Review } from "@project/shared";
import type { AlbumWithArtist } from "../domain/album.repository";

// Shared by list/get so both use-cases compute averageRating/totalReviews
// the same way, regardless of which AlbumRepository supplied the catalog
// data (JSON today, an external API later).
export function withStats(album: AlbumWithArtist, allReviews: Review[]): AlbumWithStats {
  const reviews = allReviews.filter((r) => r.albumId === album.id);
  const averageRating =
    reviews.length === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    ...album,
    averageRating,
    totalReviews: reviews.length,
    // No auth yet (see docs/domain.md — out of scope): the API has no notion
    // of a "current user", so this is resolved client-side for now.
    myReview: null,
  };
}
