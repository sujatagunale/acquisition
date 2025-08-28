import { z } from 'zod';

export const createDealSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID format'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
});

export const updateDealSchema = z.object({
  amount: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
    .optional(),
  status: z.enum(['pending', 'in_escrow', 'completed', 'cancelled']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const dealIdSchema = z.object({
  id: z.string().uuid('Invalid deal ID format'),
});

export const acceptDealSchema = z.object({
  id: z.string().uuid('Invalid deal ID format'),
});
