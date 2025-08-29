# Acquisition API

A Node.js API application built with Express.js, Neon DB PostgreSQL, Drizzle ORM, Winston for logging, and Jest with SuperTest for testing.

## Features

- **Express.js** - Fast, unopinionated web framework
- **Neon DB PostgreSQL** - Serverless PostgreSQL database
- **Drizzle ORM** - TypeScript ORM with SQL-like syntax
- **Winston** - Logging library
- **Jest + SuperTest** - Testing framework
- **ESLint + Prettier** - Code linting and formatting
- **Absolute Imports** - Clean import paths using module-alias

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Fill in your database URL in `.env`:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Absolute Imports

The project is configured to use absolute imports with the following aliases:

- `@/` - `./src/`
- `@config/` - `./src/config/`
- `@models/` - `./src/models/`
- `@routes/` - `./src/routes/`
- `@middleware/` - `./src/middleware/`
- `@utils/` - `./src/utils/`

Example usage:
```javascript
const logger = require('@config/logger');
const { users } = require('@models/users');
```

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # Database connection
│   └── logger.js    # Winston logger setup
├── models/          # Drizzle ORM models
│   └── users.js     # User model example
├── routes/          # Express routes
├── middleware/      # Custom middleware
└── utils/           # Utility functions
tests/               # Test files
├── setup.js         # Test setup
└── app.test.js      # Application tests
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - Basic API info

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)
- `LOG_LEVEL` - Logging level (default: info)
- `DATABASE_URL` - PostgreSQL connection string

## Development

The application uses:
- ESLint for code linting with Prettier integration
- Winston for structured logging
- Jest for testing with SuperTest for HTTP assertions
- Drizzle ORM for database operations
- Module-alias for absolute imports

## Running with Docker (Development)

1. Copy envs:
   - cp .env.example .env
   - Set DATABASE_URL to your Neon connection string in .env
2. Start the app:
   - docker compose -f docker-compose.dev.yml up --build
3. Open:
   - http://localhost:3000/health

## Production Image

Build:
- docker build -f Dockerfile.prod -t yourrepo/acquisition:latest .

Run:
- docker run -e DATABASE_URL="postgresql://user:pass@host:5432/db" -p 3000:3000 yourrepo/acquisition:latest

Health:
- GET /health should return 200 OK.

## CI/CD

- CI runs on push/PR to main: installs deps, lints, tests, uploads coverage.
- Docker publish:
  - On merges to main: pushes multi-arch images with tags latest and short SHA.
  - On version tags (vX.Y.Z): pushes vX.Y.Z, latest, and short SHA.
- Configure GitHub Actions:
  - Secrets: DOCKERHUB_USERNAME, DOCKERHUB_TOKEN, DATABASE_URL
  - Variables: DOCKERHUB_REPO (e.g., sujatagunale/acquisition)
