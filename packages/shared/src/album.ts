import { z } from "zod";
import { ArtistSchema } from "./artist";
import { TrackSchema } from "./track";

export const AlbumSchema = z.object({
  id: z.string().min(1), // iTunes collectionId, not a locally-generated id
  title: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  releaseDate: z.coerce.date(),
  // Absolute iTunes CDN URL — no longer self-hosted now that the catalog
  // is fetched live instead of seeded once (see ItunesAlbumRepository).
  coverUrl: z.string().min(1).nullable(),
  genres: z.array(z.string().min(1)).max(5),
  tracks: z.array(TrackSchema).default([]),
  // iTunes doesn't have a distinct "is this a single" flag — derived from
  // its own naming convention and track count (see itunes-mapper.ts).
  isSingle: z.boolean().default(false),
  // Merged in from AlbumOverlay by the repository — the only two facts
  // about an album actually stored locally.
  isAlbumOfTheMonth: z.boolean().default(false),
  editorialNote: z.string().nullable().default(null),
});
export type Album = z.infer<typeof AlbumSchema>;

const MyReviewSummarySchema = z.object({
  id: z.string().uuid(),
  rating: z.number().min(0.5).max(5),
  version: z.number().int().positive(),
});
export type MyReviewSummary = z.infer<typeof MyReviewSummarySchema>;

export const AlbumWithStatsSchema = AlbumSchema.extend({
  artist: ArtistSchema,
  averageRating: z.number().min(0.5).max(5).nullable(),
  totalReviews: z.number().int().nonnegative(),
  myReview: MyReviewSummarySchema.nullable(),
});
export type AlbumWithStats = z.infer<typeof AlbumWithStatsSchema>;
