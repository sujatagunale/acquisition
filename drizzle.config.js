import 'dotenv/config';

export default {
  schema: './src/models/*.js',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
