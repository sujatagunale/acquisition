# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV NODE_ENV=production \
    CI=true
WORKDIR /usr/src/app

# Install dependencies separately for better caching
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
FROM base AS source
COPY . .

# Final image
FROM node:20-alpine AS runner
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=source /usr/src/app ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
CMD ["npm", "start"]
