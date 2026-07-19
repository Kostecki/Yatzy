import { describe, expect, it } from "vitest";

import { appRouter } from "./index.js";

const caller = appRouter.createCaller({});

function createTestSession(playerNames: string[] = ["Alice", "Bob"]) {
	return caller.session.create({ gameModeId: "normal", playerNames });
}

describe("session.create", () => {
	it("creates a session with players and resolved categories", async () => {
		const { sessionCode, hostToken } = await createTestSession();
		expect(sessionCode).toHaveLength(6);
		expect(hostToken).toBeTruthy();

		const state = await caller.session.get({ sessionCode });
		expect(state.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
		expect(state.categories).toHaveLength(15);
	});

	it("generates a different code and token for each session", async () => {
		const a = await createTestSession();
		const b = await createTestSession();
		expect(a.sessionCode).not.toBe(b.sessionCode);
		expect(a.hostToken).not.toBe(b.hostToken);
	});
});

describe("session.get", () => {
	it("throws for a nonexistent session", async () => {
		await expect(
			caller.session.get({ sessionCode: "NOPE99" }),
		).rejects.toThrow();
	});

	it("never exposes hostTokenHash", async () => {
		const { sessionCode } = await createTestSession();
		const state = await caller.session.get({ sessionCode });
		expect(state.session).not.toHaveProperty("hostTokenHash");
	});
});

describe("session.submitScore", () => {
	it("inserts a new score", async () => {
		const { sessionCode, hostToken } = await createTestSession();
		const { players } = await caller.session.get({ sessionCode });

		await caller.session.submitScore({
			sessionCode,
			hostToken,
			playerId: players[0].id,
			categoryId: "ones",
			value: 5,
		});

		const state = await caller.session.get({ sessionCode });
		const score = state.scores.find((s) => s.categoryId === "ones");
		expect(score?.value).toBe(5);
	});

	it("updates an existing score instead of duplicating it", async () => {
		const { sessionCode, hostToken } = await createTestSession();
		const { players } = await caller.session.get({ sessionCode });

		await caller.session.submitScore({
			sessionCode,
			hostToken,
			playerId: players[0].id,
			categoryId: "ones",
			value: 5,
		});
		await caller.session.submitScore({
			sessionCode,
			hostToken,
			playerId: players[0].id,
			categoryId: "ones",
			value: 3,
		});

		const state = await caller.session.get({ sessionCode });
		const onesScores = state.scores.filter(
			(s) => s.categoryId === "ones" && s.playerId === players[0].id,
		);
		expect(onesScores).toHaveLength(1);
		expect(onesScores[0].value).toBe(3);
	});

	it("rejects an invalid host token and does not write anything", async () => {
		const { sessionCode } = await createTestSession();
		const { players } = await caller.session.get({ sessionCode });

		await expect(
			caller.session.submitScore({
				sessionCode,
				hostToken: "not-the-real-token",
				playerId: players[0].id,
				categoryId: "ones",
				value: 5,
			}),
		).rejects.toThrow();

		const state = await caller.session.get({ sessionCode });
		expect(state.scores).toHaveLength(0);
	});
});

describe("player management", () => {
	it("adds a player with the next orderIndex", async () => {
		const { sessionCode, hostToken } = await createTestSession(["Alice"]);
		await caller.session.addPlayer({ sessionCode, hostToken, name: "Carol" });

		const state = await caller.session.get({ sessionCode });
		expect(state.players.map((p) => p.name)).toEqual(["Alice", "Carol"]);
		expect(state.players[1].orderIndex).toBe(1);
	});

	it("renames a player", async () => {
		const { sessionCode, hostToken } = await createTestSession(["Alice"]);
		const { players } = await caller.session.get({ sessionCode });

		await caller.session.renamePlayer({
			sessionCode,
			hostToken,
			playerId: players[0].id,
			name: "Alicia",
		});

		const state = await caller.session.get({ sessionCode });
		expect(state.players[0].name).toBe("Alicia");
	});

	it("removes a player", async () => {
		const { sessionCode, hostToken } = await createTestSession([
			"Alice",
			"Bob",
		]);
		const { players } = await caller.session.get({ sessionCode });

		await caller.session.removePlayer({
			sessionCode,
			hostToken,
			playerId: players[0].id,
		});

		const state = await caller.session.get({ sessionCode });
		expect(state.players.map((p) => p.name)).toEqual(["Bob"]);
	});

	it("cannot rename or remove a player belonging to a different session", async () => {
		const sessionA = await createTestSession(["Alice"]);
		const sessionB = await createTestSession(["Dave"]);
		const { players: playersB } = await caller.session.get({
			sessionCode: sessionB.sessionCode,
		});

		// Valid host token for session A, but targeting a player from session B.
		await caller.session.renamePlayer({
			sessionCode: sessionA.sessionCode,
			hostToken: sessionA.hostToken,
			playerId: playersB[0].id,
			name: "Hacked",
		});

		const stateB = await caller.session.get({
			sessionCode: sessionB.sessionCode,
		});
		expect(stateB.players[0].name).toBe("Dave");
		expect(stateB.players).toHaveLength(1);
	});
});

describe("session.endGame", () => {
	it("stamps finishedAt", async () => {
		const { sessionCode, hostToken } = await createTestSession();
		const before = await caller.session.get({ sessionCode });
		expect(before.session.finishedAt).toBeNull();

		await caller.session.endGame({ sessionCode, hostToken });

		const after = await caller.session.get({ sessionCode });
		expect(after.session.finishedAt).not.toBeNull();
	});
});
