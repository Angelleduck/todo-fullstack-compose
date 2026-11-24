# Daylist

Daylist is a full-stack personal todo app. The [frontend](frontend/README.md)
uses React, TanStack Start, and TanStack Query; the
[backend](backend/README.md) is a NestJS API backed by PostgreSQL and Prisma.
Users can register, sign in, and manage their own todos.

## Run with Docker Compose

You need Docker and Docker Compose. From the repository root, create any
missing local environment files (do not overwrite configured files), replace
the example `JWT_SECRET` and `POSTGRES_PASSWORD` with strong values, then
start the stack:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose --env-file backend/.env --env-file frontend/.env up --build -d
```

On PowerShell, `Copy-Item` can be used instead of `cp`. Keep these env files
private. Use an alphanumeric PostgreSQL password because Compose includes it
in a connection URL. `VITE_API_URL` in `frontend/.env` is baked into the
frontend at build time and must be a URL the **browser** can reach, not a
Compose hostname such as `backend`.

| Service | Local URL | Notes |
| --- | --- | --- |
| Frontend | http://localhost:3001 | Open this to use Daylist. |
| API | http://localhost:3000 | `GET /health` checks database readiness. |
| Adminer | http://localhost:8080 | Available only on localhost; use server `db` and the PostgreSQL credentials in `backend/.env`. |

Compose starts PostgreSQL, applies migrations in a one-shot service, then
starts the API and frontend. The database is accessible only within the
Compose network. To inspect the services or stop them:

```sh
docker compose --env-file backend/.env --env-file frontend/.env ps
docker compose --env-file backend/.env --env-file frontend/.env down
```

Data persists in the `todo_postgres_data` volume after `down`; **do not add
`-v` unless you intend to delete the database data**.

## Run locally without Compose

Use Node.js 26, npm, and a PostgreSQL database reachable from your machine.
Follow the [backend setup](backend/README.md#run-the-backend-locally) to set
`DATABASE_URL`, migrate, and start the API. The frontend's
`frontend/.env.development` points to `http://localhost:3000` by default.
Then, from `frontend/`, run:

```sh
npm ci
npm run dev
```

Open http://localhost:3001. If either origin changes, update the frontend's
`VITE_API_URL` and the backend's `FRONTEND_URL` so cookie requests are allowed
by CORS.

## Repository layout

```text
backend/      NestJS API, authentication, todo endpoints, Prisma migrations
frontend/     TanStack Start web app
compose.yaml  PostgreSQL, migrations, API, frontend, and Adminer
```

See the [backend README](backend/README.md) for environment variables, API
routes, and tests, and the [frontend README](frontend/README.md) for UI
development and deployment details.
