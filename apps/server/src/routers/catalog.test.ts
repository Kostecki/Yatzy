import { describe, expect, it } from "vitest";

import { appRouter } from "./index.js";

const caller = appRouter.createCaller({});

describe("catalog.listGameModes", () => {
	it("returns all three built-in modes", async () => {
		const modes = await caller.catalog.listGameModes();
		expect(modes.map((m) => m.id).sort()).toEqual([
			"family",
			"giant",
			"normal",
		]);
	});

	it("returns the correct bonus config per mode", async () => {
		const modes = await caller.catalog.listGameModes();
		const normal = modes.find((m) => m.id === "normal");
		const family = modes.find((m) => m.id === "family");
		const giant = modes.find((m) => m.id === "giant");

		expect(normal).toMatchObject({
			diceCount: 5,
			upperBonusThreshold: 63,
			upperBonusAmount: 50,
		});
		expect(family).toMatchObject({
			diceCount: 6,
			upperBonusThreshold: 84,
			upperBonusAmount: 50,
		});
		expect(giant).toMatchObject({
			diceCount: 12,
			upperBonusThreshold: 189,
			upperBonusAmount: 200,
		});
	});
});

describe("catalog.getGameMode", () => {
	it("returns Normal's categories in order, starting with the upper section", async () => {
		const result = await caller.catalog.getGameMode({ id: "normal" });
		expect(result).toHaveLength(15);
		expect(result[0]).toMatchObject({ id: "ones", orderIndex: 0 });
		expect(result[1]).toMatchObject({ id: "twos", orderIndex: 1 });
	});

	it("returns more categories for Family than Normal", async () => {
		const normal = await caller.catalog.getGameMode({ id: "normal" });
		const family = await caller.catalog.getGameMode({ id: "family" });
		expect(family.length).toBeGreaterThan(normal.length);
	});

	it("returns an empty array for a mode with no linked categories", async () => {
		const result = await caller.catalog.getGameMode({ id: "does-not-exist" });
		expect(result).toEqual([]);
	});
});
