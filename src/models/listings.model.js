import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.model.js';

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  seller_id: uuid('seller_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  tech_stack: text('tech_stack').array(),
  asking_price: numeric('asking_price'),
  revenue_monthly: numeric('revenue_monthly'),
  profit_monthly: numeric('profit_monthly'),
  status: text('status').notNull().default('draft'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
