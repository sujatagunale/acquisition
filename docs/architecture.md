# Acquisition API Architecture

## Overview
- Express.js application with modular routing, controllers, services, and validations
- Neon Postgres via drizzle-orm/neon-http
- Auth via JWT stored in httpOnly cookies
- Logging via Winston (through #config/logger.js)
- Validation with Zod
- Testing with Jest + SuperTest

## Module Layout
- src/app.js: Configures middleware, routes, error handling, and basic endpoints
- src/index.js: Loads env and starts server (via src/server.js)
- src/server.js: Starts app unless NODE_ENV === 'test'
- src/config/database.js: Neon client and Drizzle db export
- src/routes/*.routes.js: Route definitions and per-route middleware
- src/controllers/*.controller.js: HTTP orchestration, validation, response shaping
- src/services/*.service.js: Data access via Drizzle ORM
- src/middlewares/*.js: Authentication, role-based authz, error handling
- src/utils/*.js: JWT and cookie helpers
- src/validations/*.js: Zod schemas for request validation
- tests/: Jest + SuperTest test suites

## Middleware
- helmet, cors, morgan, express.json/urlencoded, cookie-parser
- Authentication: authenticateToken reads req.cookies.token and verifies JWT
- Authorization: requireRole/requireAdmin gate access by req.user.role
- errorMiddleware: centralized error logging and mapping to HTTP status/payloads
- 404 handler: returns { error: 'Route not found' }

## Routes
- GET /health -> status, timestamp, uptime
- GET /api -> { message }
- /api/auth
  - POST /signup -> create user, set JWT cookie, return user
  - POST /signin -> authenticate, set JWT cookie, return user
  - POST /signout -> clear cookie
- /api/users
  - GET /          [auth + admin] -> list users
  - GET /:id       [auth] -> get user by id
  - PUT /:id       [auth] -> update own or admin can update others; non-admin cannot change roles
  - DELETE /:id    [auth + admin] -> admin can delete; cannot delete self
- /api/listings
  - GET /          -> public list
  - GET /my        [auth] -> listings for logged-in user
  - GET /:id       -> public get by id
  - POST /         [auth] -> create listing as seller
  - PUT /:id       [auth] -> update if seller or admin
  - DELETE /:id    [auth] -> delete if seller or admin
- /api/deals
  - GET /          [auth + admin] -> all deals
  - GET /:id       [auth] -> buyer/seller/admin can view
  - POST /         [auth] -> create if listing exists, is listed, and not own listing
  - PUT /:id       [auth] -> buyer/admin can update if pending
  - DELETE /:id    [auth] -> buyer/admin can delete
  - POST /:id/accept [auth] -> seller accepts, cancels other pending for same listing
  - GET /listing/:listingId [auth] -> deals by listing

## Data Access
- Drizzle models: users, listings, deals
- Services encapsulate CRUD and transactions:
  - users.service: getAllUsers, getUserById, updateUser, deleteUser
  - listings.service: getAllListings, getListingById, create, update, delete, getBySeller
  - deals.service: getAllDeals, getDealById, create, update, delete, getDealsByListing, acceptDeal

## Auth
- JWT secret: process.env.JWT_SECRET (defaults to dev value)
- jwttoken.sign/verify for token ops
- cookies helper sets httpOnly, sameSite strict, secure in production

## Testing
- Jest + SuperTest with setup in tests/setup.js
- SuperTest agent used to capture/set cookies for auth-required routes
- Integration tests can target Neon DATABASE_URL
- Ensure isolation: create test users/listings/deals and clean up as needed

## Environment
- .env: DATABASE_URL (Neon), JWT_SECRET suggested for test predictability
- Drizzle used without explicit migrations in tests; ensure schema exists in Neon
