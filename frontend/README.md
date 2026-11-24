# Daylist

A Todo app built with TanStack Start and the NestJS API in `../backend`.

HTTP requests live in `src/services/apiAuth.ts` and `src/services/apiTodo.ts`,
using the shared Ky client in `src/services/client.ts`. The UI uses
`src/hooks/useAuth.ts` and `src/hooks/useTodo.ts` with TanStack Query for
authentication, paginated lists, mutations, and cache invalidation.

## Run locally

1. Start the backend and its PostgreSQL database as described in `../backend/README.md`. The API must be reachable at **http://localhost:3000**. For the Docker setup, leave `APP_PORT` at its default of `3000`. If running Nest directly, set `PORT=3000` and configure `DATABASE_URL` and `JWT_SECRET`.
2. `frontend/.env.development` sets `VITE_API_URL=http://localhost:3000`. Change it if your backend uses another origin; an ignored `.env.local` can override it on your computer.
3. From `frontend`, run `npm install` (if needed) and `npm run dev`.
4. Open **http://localhost:3001**. Create an account, sign in, and manage your todos.

Ky sends requests **directly** to `VITE_API_URL`, with credentials included so the backend's HTTP-only authentication cookies work across the two local ports. The backend must allow `http://localhost:3001` with credentialed CORS. Registration creates an account; the frontend signs in immediately afterward.

## Production

Set `VITE_API_URL` to your public HTTPS backend origin **when building**
(`.env.example` is a template), then run `npm run build` and serve the
TanStack Start app (for example, set `PORT=3001` for the frontend process
and run `node .output/server/index.mjs`). Add your deployed frontend origin
to the backend's credentialed CORS allowlist. For cookie auth, deploy the
frontend and API on the same site over HTTPS; the session cookie uses
`Path=/auth` and the backend sets `Secure` cookies in production.

### Docker image

To run the full stack from the project root, set `VITE_API_URL` in
`frontend/.env` (copy `frontend/.env.example` if needed) and run:

```bash
docker compose --env-file backend/.env --env-file frontend/.env up --build -d
```

Compose passes `VITE_API_URL` as a frontend **build argument**, not a runtime
variable. For a standalone frontend container, build and run it with:

```bash
docker build --build-arg VITE_API_URL=http://localhost:3000 -t daylist-frontend ./frontend
docker run --rm -p 3001:3001 daylist-frontend
```

Open http://localhost:3001 with the backend running at http://localhost:3000.
`VITE_API_URL` must be a URL the **browser** can reach, not a Docker-only
hostname such as `backend`. Pass your public HTTPS API URL when building for
deployment; setting `VITE_API_URL` only when running the container does not
change the already-built browser bundle. `.dockerignore` excludes local env
files from the image.

## Checks

Run `npm run check` and `npx tsc --noEmit` from `frontend`. The Todo list loads 20 items at a time; filters and progress apply only to the loaded items.
