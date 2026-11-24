# Daylist API

The backend for [Daylist](../README.md), a personal todo app. This is a NestJS
12 / TypeScript API backed by PostgreSQL and Prisma 7. It manages user accounts,
cookie-based sessions, and user-owned todos.

## What it does

- Registers and signs in users with Argon2-hashed passwords.
- Issues a short-lived JWT access cookie and a rotating, database-backed
  session cookie; only session-token hashes are stored in PostgreSQL.
- Restricts todo reads and writes to the signed-in user. Lists are paginated
  with `limit` and `offset`.
- Provides a database-aware health endpoint and optional Swagger UI.
- Validates requests and configuration, applies rate limits, and returns
  consistently shaped errors.

## Quick start with Docker Compose

From the **repository root**, create any missing environment files from their
templates (do not overwrite files you have already configured), then replace
the placeholder `JWT_SECRET` and `POSTGRES_PASSWORD` with strong values:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose --env-file backend/.env --env-file frontend/.env up --build -d
```

On PowerShell, use `Copy-Item` instead of `cp` if preferred. Use an alphanumeric
PostgreSQL password: Compose embeds it in a connection URL, where URL-special
characters would need encoding. Keep the env files private.

Compose starts PostgreSQL, runs the migrations, and then starts the API and
frontend. Visit http://localhost:3001 for the app, http://localhost:3000/health
for API readiness, and http://localhost:8080 for Adminer (server `db`, using the
PostgreSQL credentials from `backend/.env`). The database is not published to
the host. The Compose backend runs in production mode, so Swagger is disabled
by default. For logs, run:

```sh
docker compose --env-file backend/.env --env-file frontend/.env logs backend migrate
```

To stop the stack, run:

```sh
docker compose --env-file backend/.env --env-file frontend/.env down
```

PostgreSQL data lives in the `todo_postgres_data` volume: **adding `-v` to
`down` deletes that data**.

> Compose passes its own `DATABASE_URL` (with hostname `db`) to the backend and
> migration service. A host-run backend needs a separate URL pointing to a
> PostgreSQL instance reachable from your machine.

## Run the backend locally

Use Node.js 26 (the version used by the Dockerfile), npm, and a reachable
PostgreSQL database. The Compose database is private to its network, so use
your own local PostgreSQL instance or provide a reachable database URL.

1. From `backend/`, install dependencies with `npm ci`.
2. Copy `.env.example` to `.env`. Set `DATABASE_URL` to your PostgreSQL
   connection string, for example
   `postgresql://todo:your-password@localhost:5432/todo?schema=public`.
   Replace `JWT_SECRET` with a random secret of at least 32 characters.
   `FRONTEND_URL` must match the browser origin of the frontend (by default,
   `http://localhost:3001`). The `POSTGRES_*` values in the template are
   consumed by Compose; they do not create a database for a locally run API.
3. Apply migrations and start the server:

   ```sh
   npx prisma --config ./prisma7.config.ts migrate deploy
   npm run dev
   ```

The `dev` script generates the Prisma client before starting Nest in watch
mode. The API listens on `http://localhost:3000` by default; visit
http://localhost:3000/docs for Swagger UI in development. Run the frontend
separately as described in [its README](../frontend/README.md).

## Configuration

Set variables in `backend/.env` for local development. Values are checked at
startup in `src/config/env.validation.ts`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL connection URL. Compose supplies its own URL to the API and migration containers. |
| `FRONTEND_URL` | Required, exact allowed frontend origin for credentialed CORS; defaults to `http://localhost:3001` in the example file. |
| `JWT_SECRET` | Required signing secret, at least 32 characters. |
| `PORT` | Optional API listening port; default `3000`. Compose maps host port `3000` to container port `3000`. |
| `NODE_ENV` | Defaults to `development`; production enables secure cookies. |
| `SWAGGER_ENABLED` | Optional `true`/`false`; defaults to enabled outside production and disabled in production. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Required by the root Compose file to initialize PostgreSQL and construct the container connection URL. |

For browser cookie authentication on a real deployment, serve the API over
HTTPS and place the frontend and API on the same site. Cookies are HTTP-only
and `SameSite=Lax`, with `Secure` enabled in production. Do not expose Adminer
publicly.

## HTTP API

The base URL is `http://localhost:3000` unless you change `PORT`. Protected
endpoints use cookies, **not** bearer tokens. Send credentials with browser
requests; the frontend's API client already uses `credentials: 'include'`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Starter greeting (`Hello World!`). |
| `GET` | `/health` | Database readiness and process uptime; returns `503` if the database is unavailable. |
| `POST` | `/auth/register` | Create a user with `name`, `email`, and `password`; does not sign in automatically. |
| `POST` | `/auth/login` | Sign in with `email` and `password`; returns `{ "user": ... }` and sets auth cookies. |
| `GET` | `/auth/me` | Return the current user; requires the access cookie. |
| `POST` | `/auth/refresh` | Rotate the session cookie and renew the access cookie; returns `{ "ok": true }`. |
| `POST` | `/auth/logout` | Revoke the current session and clear cookies; returns `204`. |
| `POST` | `/todos` | Create a todo with `title` and optional `description`. |
| `GET` | `/todos` | List your todos, newest first; optional `limit` (1–100, default 20) and `offset` (default 0). Returns an array, not a pagination envelope. |
| `GET` | `/todos/:id` | Read one of your todos. |
| `PATCH` | `/todos/:id` | Update `title`, `description`, or `completed`. |
| `DELETE` | `/todos/:id` | Delete one of your todos; returns `204`. |

All `/todos` routes require the access cookie. Todo IDs are UUIDs; requests
for another user's todo return `404`. Todo records include `id`, `userId`,
`title`, `description`, `completed`, `createdAt`, and `updatedAt`.
Registration requires a name and email of at most 50 characters and a password
of 8–50 characters. Todo titles are required, nonblank, and at most 255
characters.

The access cookie lasts 15 minutes and the session cookie lasts 30 days,
sliding forward on refresh. The session cookie is scoped to `/auth`; the
frontend retries requests after refreshing on a `401`. Errors have `error`,
`message`, `statusCode`, `path`, and `timestamp`, with optional `details` for
validation failures. Default rate limiting is 60 requests per minute, with
stricter limits on registration and login (5 per minute) and refresh (30 per
minute). Expired sessions are cleaned up daily.

When enabled, the interactive OpenAPI documentation is at `/docs`.

## Development commands

Run these from `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Generate the Prisma client and start Nest in watch mode. |
| `npm run build` | Generate the client and compile into `dist/`. |
| `npm run start:prod` | Run the compiled server after building. |
| `npm run test` | Run Vitest unit tests. |
| `npm run test:e2e` | Run the end-to-end suite (requires valid configuration and a database). |
| `npm run test:cov` | Generate unit-test coverage. |
| `npm run lint` | Check `src/` and `test/` with Oxlint. |

The current end-to-end suite checks the starter `GET /` route; it is not a
comprehensive API integration suite.

## Project layout

```text
src/auth/       Registration, login, JWT guard, cookie sessions, cleanup
src/todo/       User-scoped todo CRUD and request DTOs
src/health/     Database readiness endpoint
src/prisma/     Prisma connection and Nest module
src/config/     Startup environment validation
src/common/     Shared exception handling
prisma/        PostgreSQL schema and migrations
test/          End-to-end tests
```
