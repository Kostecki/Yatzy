import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Fastify from "fastify";

import { client } from "./db/db-client.js";
import { appRouter } from "./routers/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;

const ENV = process.env.NODE_ENV as "development" | "production" | "test";
if (!ENV) {
	throw new Error("NODE_ENV is not set");
}

const envToLogger = {
	development: {
		transport: {
			target: "pino-pretty",
			options: {
				translateTime: "HH:MM:ss Z",
				ignore: "pid,hostname",
			},
		},
	},
	production: true,
	test: false,
};

// Run database migrations and seed the database with initial data.
// Resolved relative to this file's own location (not cwd) so it works
// whether running src/index.ts directly (dev) or the compiled dist/index.js
// (production) — the migrations folder ships alongside whichever one is
// currently running (see apps/server/package.json's build script).
migrate(client, { migrationsFolder: path.join(__dirname, "db/drizzle") });
await import("./db/seed.js");

const fastify = Fastify({
	logger: envToLogger[ENV] ?? true,
});

await fastify.register(import("@fastify/websocket"));
await fastify.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: {
		router: appRouter,
		keepAlive: {
			enabled: true,
			pingMs: 30000,
			pongWaitMs: 5000,
		},
	},
	useWSS: true,
});

// The built web app ships as a sibling `public/` directory next to this
// file (see the Docker build) — not present in dev, where Vite's own dev
// server serves the frontend and proxies /trpc here instead.
const publicDir = path.join(__dirname, "../public");
if (existsSync(publicDir)) {
	await fastify.register(fastifyStatic, {
		root: publicDir,
	});

	fastify.setNotFoundHandler((request, reply) => {
		if (request.method === "GET" && !request.url.startsWith("/trpc")) {
			reply.sendFile("index.html");
			return;
		}
		reply.code(404).send();
	});
}

fastify.listen({ host: HOST, port: PORT }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
