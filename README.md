# yatzy

A scorekeeping app for physical Yatzy — no dice-rolling/simulation in-app, it just calculates and tracks scores. One player hosts a game on their device, everyone else joins as read-only companions on their phones and checks their own progress.

Self-hosted, single Docker image, SQLite storage, no accounts.

See [PLAN.md](PLAN.md) for the full design/architecture writeup.

## Stack

- **Frontend** (`apps/web`): Vite + React, Mantine, TanStack Router/Query, `react-i18next` (English/Danish). Installable PWA.
- **Backend** (`apps/server`): Fastify + tRPC, SQLite via Drizzle ORM, WebSocket subscriptions for live updates.
- **Tooling**: pnpm workspaces, Biome (lint/format), Vitest (server tests).

## Local development

This repo pins its toolchain with [Volta](https://volta.sh) (see the `volta` field in the root `package.json`) — install it once and it automatically switches to the right Node (26.3.0) and pnpm (11.13.1) versions whenever you're in this directory, no manual version management needed:

```sh
curl https://get.volta.sh | bash
```

Without Volta, just make sure Node 26.3.0 and pnpm 11.13.1 (or compatible) are on your `PATH` yourself.

```sh
pnpm install

# apps/server/.env.example -> apps/server/.env, adjust if needed
cp apps/server/.env.example apps/server/.env

# apps/web/.env.example -> apps/web/.env, adjust if needed
cp apps/web/.env.example apps/web/.env

pnpm --filter server dev   # Fastify + tRPC on :3000
pnpm --filter web dev      # Vite dev server

# Run both "server" and "web" concurrently - from project root
pnpm dev                   
```

Other useful commands:

```sh
pnpm --filter server test        # Vitest — scoring primitives etc.
pnpm --filter server db:studio   # Drizzle Studio, browse the SQLite file
pnpm --filter server db:generate # generate a migration from schema.ts changes
pnpm --filter server db:migrate  # apply migrations
pnpm --filter web check          # tsc --noEmit
```

## Deployment

`Dockerfile` builds both packages into a single production image (multi-stage: install → build → prod deps → minimal `node:26-alpine` runtime, running as the non-root `node` user). It serves the built web app as static files and the API from one Fastify process.

```sh
docker compose up -d --build
```

`docker-compose.yml` runs the one container and keeps the SQLite file in a named volume (`yatzy-data`). Point a reverse proxy at port `3000` for TLS — the PWA service worker requires a secure context.

On push to `main`, `.github/workflows/build-push-image.yml` runs the server test suite, builds multi-arch (amd64/arm64) images, pushes them to `ghcr.io`, and deploys via Komodo.
