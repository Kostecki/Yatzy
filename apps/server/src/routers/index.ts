import { router } from "../trpc.js";
import { catalogRouter } from "./catalog.js";
import { sessionRouter } from "./session.js";

export const appRouter = router({
	catalog: catalogRouter,
	session: sessionRouter,
});

export type AppRouter = typeof appRouter;
