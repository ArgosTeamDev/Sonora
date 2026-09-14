import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only"),
  name: z.string().min(1),
  bio: z.string().max(300).nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  // Optimistic locking for profile edits. Defaulted so seed records without
  // it still parse.
  version: z.number().int().positive().default(1),
});
export type User = z.infer<typeof UserSchema>;

// username isn't editable — it's used as the identity in every URL.
export const UpdateUserDtoSchema = UserSchema.omit({
  id: true,
  username: true,
  createdAt: true,
})
  .partial()
  .required({ version: true });
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;
