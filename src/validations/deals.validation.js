import { z } from 'zod';

export const createDealSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID format'),
  amount: z.number(),
});

export const updateDealSchema = z
  .object({
    amount: z.number().optional(),
    status: z
      .enum(['pending', 'in_escrow', 'completed', 'cancelled'])
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const dealIdSchema = z.object({
  id: z.string().uuid('Invalid deal ID format'),
});

export const acceptDealSchema = z.object({
  id: z.string().uuid('Invalid deal ID format'),
});
