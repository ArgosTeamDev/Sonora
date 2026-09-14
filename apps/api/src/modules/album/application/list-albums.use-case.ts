import { Injectable } from "@nestjs/common";
import type { AlbumWithStats } from "@project/shared";
import { ReviewRepository } from "@/modules/review/domain/review.repository";
import { AlbumRepository, type AlbumFilters } from "../domain/album.repository";
import { withStats } from "./with-stats";

export type AlbumSort = "rating" | "year" | "title";

interface ListAlbumsInput extends AlbumFilters {
  sort?: AlbumSort;
  // When present, searches all of iTunes instead of just the curated
  // catalog — see AlbumRepository.search.
  q?: string;
  // When present, resolves exactly these ids (any valid iTunes id, not just
  // the curated/chart set) instead of browsing or searching — see
  // AlbumRepository.findByIds.
  ids?: string[];
}

@Injectable()
export class ListAlbumsUseCase {
  constructor(
    private readonly albums: AlbumRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  async execute({ sort, q, ids, ...filters }: ListAlbumsInput): Promise<AlbumWithStats[]> {
    const [albums, allReviews] = await Promise.all([
      ids && ids.length > 0
        ? this.albums.findByIds(ids)
        : q && q.trim().length > 0
          ? this.albums.search(q, filters)
          : this.albums.findAll(filters),
      this.reviews.findAll(),
    ]);
    const albumsWithStats = albums.map((album) => withStats(album, allReviews));

    // Sorting needs the computed averageRating, so it happens here rather
    // than inside the repository.
    const sortBy = sort ?? "title";
    return [...albumsWithStats].sort((a, b) => {
      if (sortBy === "rating") return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (sortBy === "year") return b.year - a.year;
      return a.title.localeCompare(b.title);
    });
  }
}
