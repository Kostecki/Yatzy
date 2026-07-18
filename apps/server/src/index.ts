import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { appRouter } from "./routers/index.js";

const PORT = Number(process.env.PORT) || 3000;

const fastify = Fastify({
	logger: true,
});

await fastify.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: { router: appRouter },
});
await fastify.register(import("@fastify/websocket"));

// Declare a route
fastify.get("/", (_request, reply) => {
	reply.send({ hello: "world" });
});

// Run the server!
fastify.listen({ host: "0.0.0.0", port: PORT }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}

	// Server is now listening on ${address}
});
