import 'dotenv/config';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle ORM
const db = drizzle(sql);

export { db, sql };
