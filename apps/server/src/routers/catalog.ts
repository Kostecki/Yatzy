import { eq } from "drizzle-orm";
import { z } from "zod";

import { client } from "../db/db-client.js";
import { categories, gameModeCategories, gameModes } from "../db/schema.js";
import { publicProcedure, router } from "../trpc.js";

export const catalogRouter = router({
	listGameModes: publicProcedure.query(() => {
		return client.select().from(gameModes).all();
	}),

	getGameMode: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(({ input }) => {
			return client
				.select({
					id: categories.id,
					label: categories.label,
					labelOverride: gameModeCategories.labelOverride,
					description: categories.description,
					primitive: categories.primitive,
					params: categories.params,
					exampleDice: categories.exampleDice,
					section: categories.section,
					orderIndex: gameModeCategories.orderIndex,
				})
				.from(gameModeCategories)
				.innerJoin(categories, eq(gameModeCategories.categoryId, categories.id))
				.where(eq(gameModeCategories.gameModeId, input.id))
				.orderBy(gameModeCategories.orderIndex)
				.all();
		}),
});
