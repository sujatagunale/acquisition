# Multi-stage Dockerfile for Node.js application
# Stage 1: Base image with Node.js
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Stage 2: Development dependencies
FROM base AS dev-deps
RUN npm ci --include=dev

# Stage 3: Production dependencies  
FROM base AS prod-deps
RUN npm ci --omit=dev && npm cache clean --force

# Stage 4: Development stage
FROM base AS development

# Copy development dependencies
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Create app user and group
RUN addgroup -g 1001 dev && \
    adduser -S -u 1001 -G dev devuser

# Change ownership of app directory to app user
RUN chown -R devuser:dev /app

# Switch to non-root user
USER devuser

# Expose application port
EXPOSE 3000

# Start application in development mode with hot reload
CMD ["npm", "run", "dev"]

# Stage 5: Production stage
FROM base AS production

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Create app user and group
RUN addgroup -g 1001 prod && \
    adduser -S -u 1001 -G prod produser

# Change ownership of app directory to app user
RUN chown -R produser:prod /app

# Switch to non-root user
USER produser

# Expose application port
EXPOSE 3000

# Start application in production mode
CMD ["npm", "start"]
