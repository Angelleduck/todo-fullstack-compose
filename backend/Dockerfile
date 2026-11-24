FROM node:26.13.1 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM build AS production-deps

RUN npm prune --omit=dev --no-audit --no-fund

FROM node:26.13.1-alpine3.23

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
