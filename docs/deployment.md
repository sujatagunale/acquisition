Deployment (Docker)

Overview
- Production-grade, multi-stage Dockerfiles for production and staging
- Non-root runtime user, minimal Node.js Alpine base
- Healthchecks wired to GET /health
- docker-compose files per environment with env_file support
- No secrets are committed; use .env.production and .env.staging locally or your secrets manager in CI/CD

Prerequisites
- Docker 24+
- Docker Compose v2+

Environment variables
Set these in .env.production or .env.staging or in your deployment environment:
- NODE_ENV: production | staging
- PORT: Container port (default 3000; mapped differently per compose)
- DATABASE_URL: Neon Postgres URL
- JWT_SECRET: Strong secret for JWT signing
- CORS_ORIGIN: Comma-separated allowed origins (e.g., https://your.domain)

Local: build images
- Production:
  docker build -f Dockerfile -t acquisition-api:prod .
- Staging:
  docker build -f Dockerfile.staging -t acquisition-api:staging .

Local: run with Compose
1) Staging
- Fill .env.staging with DATABASE_URL and JWT_SECRET
- docker compose -f docker-compose.staging.yml up --build -d
- curl http://localhost:3001/health should return 200 JSON
- docker compose -f docker-compose.staging.yml logs -f api
- docker compose -f docker-compose.staging.yml down

2) Production (local)
- Fill .env.production
- docker compose -f docker-compose.prod.yml up --build -d
- curl http://localhost:3000/health
- docker compose -f docker-compose.prod.yml down

Security
- Runs as non-root user inside the container
- NODE_ENV set to production/staging appropriately
- Healthcheck ensures container restarts on failures (Compose restart policy)
- Do not bake secrets into images; inject via env at runtime
- Consider read-only root filesystem and further hardening if deploying to Kubernetes

Notes
- The Neon driver currently does not support transactions in neon-http; certain endpoints may return 500 if they rely on transactions. This is an application-level consideration, not Docker-specific.
- If you need to run tests inside the container, use:
  docker run --rm --env-file .env.staging acquisition-api:staging npm test -- --runInBand
