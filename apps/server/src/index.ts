import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Fastify from "fastify";

import { client } from "./db/db-client.js";
import { appRouter } from "./routers/index.js";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;

// Run database migrations and seed the database with initial data
migrate(client, { migrationsFolder: "./src/db/drizzle" });
await import("./db/seed.js");

const fastify = Fastify({
	logger: true,
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

fastify.get("/", (_request, reply) => {
	reply.send({ hello: "world" });
});

fastify.listen({ host: HOST, port: PORT }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
