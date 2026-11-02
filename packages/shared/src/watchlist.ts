import { z } from "zod";

// An album the user wants to listen to later.
export const WatchlistItemSchema = z.object({
  userId: z.string().uuid(),
  albumId: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

export const CreateWatchlistDtoSchema = WatchlistItemSchema.omit({ createdAt: true });
export type CreateWatchlistDto = z.infer<typeof CreateWatchlistDtoSchema>;
