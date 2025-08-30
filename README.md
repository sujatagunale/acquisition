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
