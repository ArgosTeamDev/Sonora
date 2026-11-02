import { z } from "zod";
import { ListSchema } from "./list";
import { ReviewSchema } from "./review";

// What the people you follow did, newest first. `at` is when it happened.
export const FeedEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("review"), at: z.coerce.date(), userId: z.string().uuid(), review: ReviewSchema }),
  z.object({ type: z.literal("list"), at: z.coerce.date(), userId: z.string().uuid(), list: ListSchema }),
  z.object({ type: z.literal("favorite"), at: z.coerce.date(), userId: z.string().uuid(), albumId: z.string().min(1) }),
]);
export type FeedEvent = z.infer<typeof FeedEventSchema>;
