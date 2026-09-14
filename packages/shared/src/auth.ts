import { z } from "zod";
import { UserSchema } from "./user";

export const RegisterDtoSchema = z.object({
  username: UserSchema.shape.username,
  name: z.string().min(1),
  password: z.string().min(8).max(72),
});
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDtoSchema>;
