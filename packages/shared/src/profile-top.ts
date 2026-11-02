import { z } from "zod";

export const PROFILE_TOP_SIZE = 4;

// Ordered album ids pinned on a profile (first = position 1).
export const ProfileTopDtoSchema = z
  .object({
    albumIds: z.array(z.string().min(1)).max(PROFILE_TOP_SIZE),
  })
  .refine((dto) => new Set(dto.albumIds).size === dto.albumIds.length, "Un álbum no puede repetirse.");
export type ProfileTopDto = z.infer<typeof ProfileTopDtoSchema>;
