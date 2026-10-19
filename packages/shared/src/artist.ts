import { z } from "zod";

export const ArtistSchema = z.object({
  id: z.string().min(1), // provider artist id ("dz-…", "mb-…" or iTunes artistId)
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
});
export type Artist = z.infer<typeof ArtistSchema>;
