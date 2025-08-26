require('dotenv').config();

module.exports = {
  schema: './src/models/*.js',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
