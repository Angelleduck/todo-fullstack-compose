FROM node:26.13.1-alpine3.23 AS base
WORKDIR /app
COPY package*.json ./

# Full deps + compile
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production deps only
FROM base AS production-deps
RUN npm ci --omit=dev --no-audit --no-fund

# Small image just for migrations
FROM production-deps AS migrate
# Only needed if prisma is in devDependencies (see note below)
RUN npm install --no-save --no-audit --no-fund prisma
COPY prisma ./prisma
COPY prisma7.config.ts ./
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# Runtime
FROM base AS production
ENV NODE_ENV=production
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]