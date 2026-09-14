import { z } from "zod";

export const FavoriteSchema = z.object({
  userId: z.string().uuid(),
  albumId: z.string().min(1), // iTunes collectionId
  createdAt: z.coerce.date(),
});
export type Favorite = z.infer<typeof FavoriteSchema>;

export const CreateFavoriteDtoSchema = FavoriteSchema.omit({ createdAt: true });
export type CreateFavoriteDto = z.infer<typeof CreateFavoriteDtoSchema>;
