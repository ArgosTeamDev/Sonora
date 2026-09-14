import { z } from "zod";
import { AlbumOverlaySchema } from "./album-overlay";
import { ReviewSchema } from "./review";
import { FollowSchema } from "./follow";
import { FavoriteSchema } from "./favorite";

// Users live in SQLite now (see apps/api/src/shared/db/sqlite.service.ts),
// with hashed passwords — not something that belongs in a plaintext JSON
// file. Review.userId/Follow.followerId/followingId/Favorite.userId stay
// plain string ids, same as before.
export const DbShapeSchema = z.object({
  albumOverlays: z.array(AlbumOverlaySchema),
  reviews: z.array(ReviewSchema),
  follows: z.array(FollowSchema),
  favorites: z.array(FavoriteSchema),
});
export type DbShape = z.infer<typeof DbShapeSchema>;
