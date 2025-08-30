import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for local development
if (process.env.NODE_ENV === 'development') {
  // Configure for Neon Local proxy
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle ORM
const db = drizzle(sql);

export { db, sql };
