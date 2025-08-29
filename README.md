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
- `ARCJET_KEY` - Arcjet API key for security features
- `ARCJET_ENV` - Arcjet environment (development/production)
- `ARCJET_ALLOWED_COUNTRIES` - Optional comma-separated list of allowed countries

## Advanced Security Features

The API includes comprehensive security features powered by Arcjet following industry best practices:

### Core Protection
- **Single Instance Pattern** - Uses Arcjet's recommended single instance with rules array
- **Shield Protection** - Blocks SQL injection, XSS, and other common attacks
- **Bot Protection** - Prevents automated attacks with search engine allowlist
- **Rate Limiting** - Adaptive limits based on user roles and context

### Advanced Features
- **IP Geolocation Analysis** - Country-based access control and suspicious location detection
- **VPN/Proxy Detection** - Blocks VPNs and proxies with Apple Private Relay exception
- **Hosting Provider Detection** - Prevents requests from hosting providers (potential proxies)
- **Email Validation** - Blocks disposable, invalid, and free email addresses
- **Financial Transaction Protection** - Enhanced security for deal operations

### Rate Limiting Tiers
- **Admin users**: 200 requests/minute
- **Regular users**: 60 requests/minute  
- **Anonymous users**: 20 requests/minute
- **Authentication endpoints**: 5 attempts/10 minutes
- **Deal operations**: 20 operations/hour

### Geographic Restrictions
- Configurable country-based access control
- Default restrictions for financial operations (US, CA, GB, AU)
- Suspicious location detection and logging

### Implementation Details
- Follows Arcjet's official blueprint patterns
- Single instance pattern with rules array for optimal performance
- Advanced IP analysis with comprehensive decision handling
- Enhanced characteristics usage (userId, userRole, custom tracking)
- "Fail open" design for resilience and availability
- Environment-specific configuration and graceful test handling

## Development

The application uses:

- ESLint for code linting with Prettier integration
- Winston for structured logging
- Jest for testing with SuperTest for HTTP assertions
- Drizzle ORM for database operations
- Module-alias for absolute imports
