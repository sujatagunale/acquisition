# Acquisition API

This is a Node.js Express API for managing real estate listings and deals. It includes authentication, user management, listings, and deals endpoints.

## Features

- Authentication (JWT-based)
- User management
- Listings management
- Deals management
- Health check endpoint

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A PostgreSQL database (Neon or any compatible service)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sujatagunale/acquisition.git
   cd acquisition
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set the `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```

### Running the Server

```bash
npm start
```

The API will be available at `http://localhost:3000`

### Health Check

```bash
curl http://localhost:3000/health
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (Neon or local)
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Environment (`development`, `production`, `test`)
- `LOG_LEVEL` - Log level (`info`, `error`, etc.)

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API status
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/listings` - Get all listings
- `GET /api/listings/my` - Get current user's listings
- `GET /api/listings/:id` - Get listing by ID
- `POST /api/listings` - Create listing (auth required)
- `PUT /api/listings/:id` - Update listing (owner/admin)
- `DELETE /api/listings/:id` - Delete listing (owner/admin)
- `GET /api/deals` - Get all deals (admin only)
- `GET /api/deals/:id` - Get deal by ID
- `POST /api/deals` - Create deal (auth required)
- `PUT /api/deals/:id` - Update deal (owner/admin)
- `DELETE /api/deals/:id` - Delete deal (owner/admin)
- `POST /api/deals/:id/accept` - Accept a deal (auth required)

## Security: Arcjet Integration

This project uses a single shared Arcjet instance for security protections. The instance and middleware are defined in `src/config/arcjet.js` and reused across the app.

Enabled protections (when `ARCJET_API_KEY` is set):
- Bot protection (global)
- Shield: reputation and optional country blocking (global)
- Rate limiting:
  - Auth endpoints strict limit (default 10 RPM)
  - Adaptive per-user limiter on write endpoints (default 60 RPM)
  - Per-route limiter factory for other use
- Sensitive information detection for write endpoints (secrets/credentials/PII)

Configuration via environment variables:
- `ARCJET_API_KEY`
- `ARCJET_ENV` (defaults to NODE_ENV)
- `ARCJET_RPM_AUTH` (default 10)
- `ARCJET_RPM_DEFAULT` (default 120)
- `ARCJET_RPM_USER` (default 60)
- `ARCJET_BLOCK_COUNTRIES` (CSV of country codes)
- `ARCJET_SENSITIVE_MODE` (`block` or `log`, default `block`)

If `ARCJET_API_KEY` is not set or the SDK is not available, all Arcjet middlewares are safe no-ops.

## Testing

```bash
npm test
```

Note: Tests require a valid `DATABASE_URL` to be set. For local testing, you can use Neon Local or a test PostgreSQL instance.

## Logging

- Uses Winston logger with environment-based log levels
- Logs API requests and errors

## Error Handling

- Centralized error handling middleware
- Returns consistent JSON responses with error messages and status codes

# Acquisition API

A Node.js API application built with Express.js, Neon DB PostgreSQL, Drizzle ORM, Winston for logging, and Jest with SuperTest for testing. This application is fully dockerized with support for both local development using Neon Local and production deployment with Neon Cloud.

## Features

- **Express.js** - Fast, unopinionated web framework
- **Neon DB PostgreSQL** - Serverless PostgreSQL database
- **Drizzle ORM** - TypeScript ORM with SQL-like syntax
- **Winston** - Logging library
- **Jest + SuperTest** - Testing framework
- **ESLint + Prettier** - Code linting and formatting
- **Absolute Imports** - Clean import paths using module-alias

## 🐳 Docker Setup (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Neon account](https://neon.tech/) with API key and project ID

### Quick Start - Development

1. **Get your Neon credentials:**
   - Go to [Neon Console](https://console.neon.tech)
   - Copy your API key from the dashboard
   - Copy your project ID from Project Settings → General

2. **Configure environment:**
   ```bash
   # Update .env.development with your Neon credentials
   NEON_API_KEY=your_actual_neon_api_key
   NEON_PROJECT_ID=your_actual_neon_project_id
   ```

3. **Start development environment:**
   ```bash
   # Using the provided script (recommended)
   ./scripts/dev.sh
   
   # Or manually with docker-compose
   docker-compose up --build
   ```

   This will:
   - Start Neon Local proxy with ephemeral database branches
   - Start your application with hot reload
   - Create a fresh database branch for each session

4. **Access your application:**
   - App: http://localhost:3000
   - Health check: http://localhost:3000/health
   - Database: `postgres://neon:npg@localhost:5432/neondb`

### Production Deployment

1. **Configure production environment:**
   ```bash
   # Create .env.production with your actual values
   DATABASE_URL=postgresql://your-user:your-password@your-host.neon.tech/your-db
   JWT_SECRET=your-strong-production-secret
   CORS_ORIGIN=https://your-domain.com
   ```

2. **Deploy to production:**
   ```bash
   # Using the provided script (recommended)
   ./scripts/prod.sh
   
   # Or manually
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
   ```

### Docker Commands Reference

```bash
# Development
docker compose up --build          # Start dev environment
docker compose down                 # Stop dev environment
docker compose logs -f app          # View app logs

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d    # Start prod
docker compose -f docker-compose.yml -f docker-compose.prod.yml down      # Stop prod
docker logs -f acquisition-app-prod  # View prod logs
```

## 💻 Local Setup (Without Docker)

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

- `#/` - `./src/`
- `#config/` - `./src/config/`
- `#models/` - `./src/models/`
- `#routes/` - `./src/routes/`
- `#middleware/` - `./src/middleware/`
- `#utils/` - `./src/utils/`

Example usage:
```javascript
const logger = require('#config/logger');
const { users } = require('#models/users');
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

## Security: Arcjet Integration

This API integrates Arcjet protections:
- Bot protection (global)
- Shield: threat intelligence, reputation, and optional geo blocking (global)
- Rate limiting: strict on auth endpoints; adaptive per-user for write endpoints
- Sensitive information detection on write endpoints (block/report)

Environment variables:
- ARCJET_API_KEY
- ARCJET_ENV=development|production|test
- ARCJET_RPM_AUTH=10
- ARCJET_RPM_DEFAULT=120
- ARCJET_RPM_USER=60
- ARCJET_BLOCK_COUNTRIES=  (comma-separated ISO codes, e.g. "RU,IR,KP")
- ARCJET_SENSITIVE_MODE=block  (block|report)

Notes:
- Protections are no-ops if ARCJET_API_KEY is not set.
- The server trusts proxy for accurate req.ip. Configure your proxy accordingly.

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - Basic API info

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)
- `LOG_LEVEL` - Logging level (default: info)
- `DATABASE_URL` - PostgreSQL connection string

## 🏗️ Docker Architecture

### Development Environment
- **Neon Local**: Proxy service that creates ephemeral database branches
- **Application**: Node.js app with hot reload for development
- **Network**: Isolated Docker network for service communication

### Production Environment
- **Application Only**: Lightweight production container
- **Neon Cloud**: Direct connection to your Neon cloud database
- **No Proxy**: Direct database connection for optimal performance

## 🔧 Troubleshooting

### Common Issues

**"Connection refused" to database:**
- Ensure Docker is running
- Verify your NEON_API_KEY and NEON_PROJECT_ID are correct
- Check that port 5432 is not already in use: `lsof -i :5432`

**"Cannot connect to Docker daemon":**
- Start Docker Desktop
- On macOS: Ensure Docker Desktop is running in the system tray

**Hot reload not working:**
- Ensure source code is properly mounted: `docker-compose logs app`
- On macOS with Docker Desktop: Use gRPC FUSE instead of VirtioFS in settings

**Database migrations fail:**
```bash
# Run migrations inside the container
docker compose exec app npm run db:migrate
```

### Useful Commands

```bash
# View real-time logs
docker compose logs -f

# Execute commands inside containers
docker compose exec app npm run db:studio
docker compose exec neon-local psql -U neon -d neondb

# Reset everything
docker compose down -v  # Removes volumes too
docker compose up --build --force-recreate

# Check container status
docker compose ps
```

## 📁 File Structure

```
.
├── Dockerfile                 # Multi-stage Docker build
├── .dockerignore             # Docker build exclusions
├── docker-compose.yml        # Development with Neon Local
├── docker-compose.prod.yml   # Production overrides
├── .env.development          # Dev environment variables
├── .env.production           # Prod environment template
├── scripts/
│   ├── dev.sh               # Development startup script
│   └── prod.sh              # Production startup script
└── src/
    ├── config/
    │   ├── database.js       # Database connection with Neon Local support
    │   └── logger.js         # Winston logger setup
    └── ...
```

## Development

The application uses:
- ESLint for code linting with Prettier integration
- Winston for structured logging
- Jest for testing with SuperTest for HTTP assertions
- Drizzle ORM for database operations
- Absolute imports with # prefix (following project rules)
