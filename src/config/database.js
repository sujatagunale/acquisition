const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle ORM
const db = drizzle(sql);

module.exports = { db, sql };
