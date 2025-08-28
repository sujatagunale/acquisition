import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.model.js';
import { listings } from './listings.model.js';

export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  listing_id: uuid('listing_id').references(() => listings.id).notNull(),
  buyer_id: uuid('buyer_id').references(() => users.id).notNull(),
  seller_id: uuid('seller_id').references(() => users.id).notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
