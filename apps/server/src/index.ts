import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify from "fastify";

import { appRouter } from "./routers/index.js";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;

const fastify = Fastify({
	logger: true,
});

await fastify.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: { router: appRouter },
});
await fastify.register(import("@fastify/websocket"));

fastify.get("/", (_request, reply) => {
	reply.send({ hello: "world" });
});

fastify.listen({ host: HOST, port: PORT }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
