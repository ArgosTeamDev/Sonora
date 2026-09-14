import { z } from "zod";

export const TrackSchema = z.object({
  trackNumber: z.number().int().positive(),
  title: z.string().min(1),
  durationMs: z.number().int().positive().nullable(),
  // 30-second clip streamed directly from Apple's iTunes CDN, not
  // self-hosted — unlike covers, redistributing licensed preview audio
  // ourselves isn't something we want to do, and it's meant to be embedded.
  previewUrl: z.string().url().nullable(),
});
export type Track = z.infer<typeof TrackSchema>;
