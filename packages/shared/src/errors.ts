import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "NOT_FOUND",
  "STALE_VERSION",
  "VALIDATION",
  "DUPLICATE_REVIEW",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
