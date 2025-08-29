FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp && chown -R nodeusr:nodegrp /app
USER nodeusr
ENV NODE_ENV=development
EXPOSE 3000
CMD [ "sh", "-c", "npm run db:push && npm start" ]
