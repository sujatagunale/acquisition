import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(255, 'Name must not exceed 255 characters')
      .trim()
      .optional(),

    email: z
      .string()
      .email('Valid email is required')
      .max(255, 'Email must not exceed 255 characters')
      .toLowerCase()
      .trim()
      .optional(),

    role: z
      .enum(['user', 'admin'], {
        errorMap: () => ({ message: 'Role must be either user or admin' }),
      })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const userIdSchema = z.object({
  id: z.coerce
    .number({
      errorMap: () => ({ message: 'User ID must be a number' }),
    })
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
});
