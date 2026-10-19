import { z } from "zod";
import { UserSchema } from "./user";

export const RegisterDtoSchema = z.object({
  username: UserSchema.shape.username,
  name: z.string().trim().min(1).max(100),
  // Private: only used to sign in. Not part of the public User shape.
  email: z.string().trim().toLowerCase().email("Correo inválido.").max(255),
  password: z.string().min(8).max(72),
  location: z.string().trim().max(80).nullable().optional(),
});
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  // Username or email.
  identifier: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
  // true: 30-day session; false: ends when the browser closes (1-day token).
  remember: z.boolean().default(true),
});
export type LoginDto = z.infer<typeof LoginDtoSchema>;
