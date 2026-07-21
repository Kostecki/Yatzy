# ---- deps: install once, cached unless a manifest changes ----
FROM node:26-alpine AS deps
# python3/make/g++ are needed to compile better-sqlite3's native addon on
# musl (alpine) — there's no guaranteed prebuilt binary for this combo.
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@11.13.1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile server (tsc) + web (vite) ----
FROM deps AS build
COPY . .
RUN pnpm --filter server build
RUN pnpm --filter web build

# ---- prod-deps: isolated, production-only node_modules for just the server package ----
# --legacy: pnpm v10+'s default deploy mode requires every workspace package
# to use injected (hard-copied) workspace-internal dependencies; apps/web's
# type-only "server": "workspace:*" dependency doesn't, and server itself
# has no workspace-internal deps to inject in the first place, so the
# legacy deploy mode is the correct fit here rather than changing how the
# whole workspace links internally.
FROM build AS prod-deps
RUN pnpm --filter server deploy --prod --legacy /prod/server

# ---- runtime: minimal final image ----
FROM node:26-alpine AS runtime
# better-sqlite3's compiled addon dynamically links libstdc++, which the
# bare alpine image doesn't ship (only the build stage's g++ install pulls
# it in) — without this it fails at require() time, not build time.
RUN apk add --no-cache libstdc++
# Use the image's built-in "node" user (fixed uid/gid 1000:1000) instead of
# creating our own — it's a stable, well-known id, which matters for bind
# mounts (e.g. Komodo) where the host-side directory's ownership has to be
# set to match it manually; a self-rolled user's uid isn't guaranteed/documented.

WORKDIR /app
COPY --from=prod-deps /prod/server/node_modules ./node_modules
COPY --from=prod-deps /prod/server/package.json ./package.json
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/web/dist ./public

# Named volumes are created root-owned; pre-creating /data here and
# chowning it lets Docker carry that ownership onto the volume the first
# time it's populated, so the non-root "node" user can write the SQLite
# file into it. For a bind mount instead, the host-side directory needs to
# be chowned to 1000:1000 directly (see deploy notes).
RUN mkdir -p /data && chown -R node:node /data

USER node
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/yatzy.sqlite
EXPOSE 3000
CMD ["node", "dist/index.js"]
