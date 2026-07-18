import { categoriesData } from "./categories.js";
import { client } from "./db-client.js";
import { familyGameModeCategories } from "./game-mode-categories/family.js";
import { giantGameModeCategories } from "./game-mode-categories/giant.js";
import { normalGameModeCategories } from "./game-mode-categories/normal.js";
import { gameModesData } from "./game-modes.js";
import { categories, gameModeCategories, gameModes } from "./schema.js";

const alreadySeeded = client.select().from(gameModes).all().length > 0;
if (!alreadySeeded) {
	client.insert(gameModes).values(gameModesData).run();
	client.insert(categories).values(categoriesData).run();
	client
		.insert(gameModeCategories)
		.values([
			...normalGameModeCategories.map((l) => ({ ...l, gameModeId: "normal" })),
			...familyGameModeCategories.map((l) => ({ ...l, gameModeId: "family" })),
			...giantGameModeCategories.map((l) => ({ ...l, gameModeId: "giant" })),
		])
		.run();
}
