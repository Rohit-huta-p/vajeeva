import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
  lastSyncAt: z.date().default(() => new Date(0)),
  createdAt: z.date().default(() => new Date()),
});

export const GenderSchema = z.enum(['female', 'male', 'other', 'prefer_not_to_say']);

export const RegisterInputSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().optional(),
  phone:    z.string().optional(),
  age:      z.coerce.number().int().min(13).max(120).optional(),
  gender:   GenderSchema.optional(),
});

// No min-length at login — password policy applies at registration only;
// a wrong-length password must fail the credential check (401), not validation (400).
export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
