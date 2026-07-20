import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "server/src/routers";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
