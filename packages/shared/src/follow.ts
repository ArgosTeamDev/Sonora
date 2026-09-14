import { z } from "zod";

const followerIsNotFollowing = (f: { followerId: string; followingId: string }) =>
  f.followerId !== f.followingId;

export const FollowSchema = z
  .object({
    followerId: z.string().uuid(),
    followingId: z.string().uuid(),
    createdAt: z.coerce.date(),
  })
  .refine(followerIsNotFollowing, "A user cannot follow themselves");
export type Follow = z.infer<typeof FollowSchema>;

export const CreateFollowDtoSchema = z
  .object({
    followerId: z.string().uuid(),
    followingId: z.string().uuid(),
  })
  .refine(followerIsNotFollowing, "A user cannot follow themselves");
export type CreateFollowDto = z.infer<typeof CreateFollowDtoSchema>;
