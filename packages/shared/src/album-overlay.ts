import { z } from "zod";

// The only thing about an album actually stored locally now: catalog
// metadata (title/year/cover/tracks/artist) comes live from the iTunes
// Search API on every request (see ItunesAlbumRepository). This overlay is
// what makes an iTunes id "part of our catalog" and carries the one thing
// iTunes can't: our own editorial pick.
export const AlbumOverlaySchema = z.object({
  id: z.string().min(1), // iTunes collectionId
  isAlbumOfTheMonth: z.boolean().default(false),
  editorialNote: z.string().nullable().default(null),
  // When this album was added to Sonora's catalog — distinct from the
  // album's real release date, which comes from iTunes.
  createdAt: z.coerce.date(),
});
export type AlbumOverlay = z.infer<typeof AlbumOverlaySchema>;
