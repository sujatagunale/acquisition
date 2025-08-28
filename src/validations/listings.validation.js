import { z } from 'zod';

export const createListingSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters')
    .trim(),
  description: z.string().optional(),
  category: z.string().optional(),
  tech_stack: z.array(z.string()).optional(),
  asking_price: z.number().optional(),
  revenue_monthly: z.number().optional(),
  profit_monthly: z.number().optional(),
  status: z.enum(['draft', 'listed', 'sold', 'withdrawn']).default('draft'),
});

export const updateListingSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must not exceed 255 characters')
      .trim()
      .optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tech_stack: z.array(z.string()).optional(),
    asking_price: z.number().optional(),
    revenue_monthly: z.number().optional(),
    profit_monthly: z.number().optional(),
    status: z.enum(['draft', 'listed', 'sold', 'withdrawn']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listingIdSchema = z.object({
  id: z.string().uuid('Invalid listing ID format'),
});
