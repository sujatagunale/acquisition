import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  serial,
} from 'drizzle-orm/pg-core';
import { users } from './users.model.js';
import { listings } from './listings.model.js';

export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  listing_id: uuid('listing_id')
    .references(() => listings.id, { onDelete: 'cascade' })
    .notNull(),
  buyer_id: serial('buyer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  seller_id: serial('seller_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
