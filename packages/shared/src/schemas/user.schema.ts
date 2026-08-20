import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
  lastSyncAt: z.date().default(() => new Date(0)),
  createdAt: z.date().default(() => new Date()),
});

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginInputSchema = RegisterInputSchema;

export type User = z.infer<typeof UserSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
