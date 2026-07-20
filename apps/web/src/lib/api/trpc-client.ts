import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";

import { trpc } from "./trpc";

const wsProtocol = location.protocol === "https:" ? "wss" : "ws";

const wsClient = createWSClient({
	url: `${wsProtocol}://${location.host}/trpc`,
});

export const trpcClient = trpc.createClient({
	links: [
		splitLink({
			condition: (op) => op.type === "subscription",
			true: wsLink({ client: wsClient }),
			false: httpBatchLink({ url: "/trpc" }),
		}),
	],
});
