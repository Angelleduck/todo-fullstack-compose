FROM node:26.13.1 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM node:26.13.1-alpine3.23

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001

WORKDIR /app

# Nitro's Node output is self-contained; no development dependencies are needed.
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]
