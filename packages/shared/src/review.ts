import { z } from "zod";

export const LISTENING_FORMATS = ["vinyl", "cassette", "cd", "digital", "hi-res"] as const;
export const ListeningFormatSchema = z.enum(LISTENING_FORMATS);
export type ListeningFormat = z.infer<typeof ListeningFormatSchema>;

// What counts as "Colección Física" on a profile.
export const PHYSICAL_FORMATS: readonly ListeningFormat[] = ["vinyl", "cassette", "cd"];

const isHalfStarStep = (value: number) => Number.isInteger(value * 2);

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  albumId: z.string().min(1), // iTunes collectionId
  rating: z
    .number()
    .min(0.5)
    .max(5)
    .refine(isHalfStarStep, "Rating must be in steps of 0.5"),
  text: z.string().max(5000).nullable(),
  isRelisten: z.boolean(),
  // How it was listened to. Optional: reviews predating the field have none.
  format: ListeningFormatSchema.nullable().default(null),
  // Free-form qualifier for the format ("180G", "45 RPM", "96KHZ", "CHROME").
  formatDetail: z.string().max(32).nullable().default(null),
  listenedAt: z.coerce.date(),
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewDtoSchema = ReviewSchema.omit({
  id: true,
  version: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateReviewDto = z.infer<typeof CreateReviewDtoSchema>;

export const UpdateReviewDtoSchema = ReviewSchema.omit({
  id: true,
  userId: true,
  albumId: true,
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .required({ version: true });
export type UpdateReviewDto = z.infer<typeof UpdateReviewDtoSchema>;
