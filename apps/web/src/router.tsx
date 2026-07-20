import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";

import Root from "./Root";
import CreateGame from "./routes/CreateGame";
import Host from "./routes/Host";
import PlayerView from "./routes/PlayerView";
import View from "./routes/View";

const rootRoute = createRootRoute({
	component: Root,
});

const createGameRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: CreateGame,
});

const hostRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/s/$code/host",
	component: Host,
});

const viewRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/s/$code/view",
	component: View,
});

const playerViewRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/s/$code/view/$playerId",
	component: PlayerView,
});

const routeTree = rootRoute.addChildren([
	createGameRoute,
	hostRoute,
	viewRoute,
	playerViewRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
