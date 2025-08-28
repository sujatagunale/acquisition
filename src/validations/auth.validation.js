import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(255, 'Name must not exceed 255 characters')
    .trim(),

  email: z
    .string()
    .email('Valid email is required')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must not exceed 128 characters'),

  role: z
    .enum(['user', 'admin'], {
      errorMap: () => ({ message: 'Role must be either user or admin' }),
    })
    .default('user'),
});

export const signinSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),

  password: z.string().min(1, 'Password is required'),
});
