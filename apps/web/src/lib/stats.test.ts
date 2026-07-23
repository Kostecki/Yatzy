import { describe, expect, it } from "vitest";

import {
	bonusAchievementRate,
	bucketize,
	categoryAveragesByPlayer,
	categoryStats,
	diceFaceFrequency,
	gamesOverTime,
	overview,
	playerLeaderboard,
	scoreDistribution,
	scoreExtremes,
	turnOrderAdvantage,
	yatzyHitRate,
	type GameModesById,
	type StatsSession,
} from "./stats";

const NORMAL: GameModesById = {
	normal: { upperBonusThreshold: 63, upperBonusAmount: 50, diceCount: 5 },
};

describe("diceFaceFrequency", () => {
	it("counts faces overall and per game mode", () => {
		const sessions: StatsSession[] = [
			{
				sessionCode: "A",
				gameModeId: "normal",
				createdAt: "2026-01-01T00:00:00Z",
				finishedAt: "2026-01-01T00:10:00Z",
				players: [{ id: "p1", name: "Alice", orderIndex: 0 }],
				categories: [{ id: "ones", section: "upper" }],
				scores: [
					{ playerId: "p1", categoryId: "ones", value: 3, dice: [1, 1, 1, 4, 5] },
				],
			},
			{
				sessionCode: "B",
				gameModeId: "family",
				createdAt: "2026-01-02T00:00:00Z",
				finishedAt: "2026-01-02T00:10:00Z",
				players: [{ id: "p2", name: "Bob", orderIndex: 0 }],
				categories: [{ id: "sixes", section: "upper" }],
				scores: [
					{
						playerId: "p2",
						categoryId: "sixes",
						value: 12,
						dice: [6, 6, 2, 2, 3, 3],
					},
				],
			},
		];

		const { overall, byGameMode } = diceFaceFrequency(sessions);

		expect(overall.find((f) => f.face === 1)?.count).toBe(3);
		expect(overall.find((f) => f.face === 6)?.count).toBe(2);
		const total = overall.reduce((sum, f) => sum + f.count, 0);
		expect(total).toBe(11);

		expect(byGameMode.normal.find((f) => f.face === 1)?.count).toBe(3);
		expect(byGameMode.family.find((f) => f.face === 6)?.count).toBe(2);
	});

	it("returns zero percentages when there are no dice", () => {
		const { overall } = diceFaceFrequency([]);
		expect(overall.every((f) => f.count === 0 && f.percentage === 0)).toBe(
			true,
		);
	});
});

describe("bucketize", () => {
	it("groups values into fixed-width buckets, filling gaps", () => {
		const buckets = bucketize([5, 12, 15, 45], 20);
		expect(buckets).toEqual([
			{ bucket: 0, label: "0", count: 3 },
			{ bucket: 1, label: "20", count: 0 },
			{ bucket: 2, label: "40", count: 1 },
		]);
	});

	it("returns an empty array for no values", () => {
		expect(bucketize([], 10)).toEqual([]);
	});

	it("trims leading and trailing empty buckets but keeps internal gaps", () => {
		const buckets = bucketize([220, 260, 300], 20);
		expect(buckets).toEqual([
			{ bucket: 11, label: "220", count: 1 },
			{ bucket: 12, label: "240", count: 0 },
			{ bucket: 13, label: "260", count: 1 },
			{ bucket: 14, label: "280", count: 0 },
			{ bucket: 15, label: "300", count: 1 },
		]);
	});
});

function twoPlayerSession(): StatsSession {
	return {
		sessionCode: "A",
		gameModeId: "normal",
		createdAt: "2026-01-01T10:00:00Z",
		finishedAt: "2026-01-01T10:30:00Z",
		players: [
			{ id: "p1", name: "Alice", orderIndex: 0 },
			{ id: "p2", name: "Bob", orderIndex: 1 },
		],
		categories: [
			{ id: "ones", section: "upper" },
			{ id: "sixes", section: "upper" },
			{ id: "chance", section: "lower" },
			{ id: "yatzy_5", section: "lower" },
		],
		scores: [
			{ playerId: "p1", categoryId: "ones", value: 3, dice: null },
			{ playerId: "p1", categoryId: "sixes", value: 18, dice: null },
			{ playerId: "p1", categoryId: "chance", value: 20, dice: null },
			{ playerId: "p1", categoryId: "yatzy_5", value: 0, dice: null },
			{ playerId: "p2", categoryId: "ones", value: 2, dice: null },
			{ playerId: "p2", categoryId: "sixes", value: 12, dice: null },
			{ playerId: "p2", categoryId: "chance", value: 24, dice: null },
			{ playerId: "p2", categoryId: "yatzy_5", value: 50, dice: null },
		],
	};
}

describe("scoreDistribution", () => {
	it("computes bonus-aware grand totals per player-game", () => {
		const totals = scoreDistribution([twoPlayerSession()], NORMAL);

		expect(totals).toContainEqual(
			expect.objectContaining({ playerName: "Alice", total: 41 }),
		);
		expect(totals).toContainEqual(
			expect.objectContaining({ playerName: "Bob", total: 88 }),
		);
	});
});

describe("scoreExtremes", () => {
	it("finds the highest and lowest total, with who and which game", () => {
		const totals = scoreDistribution([twoPlayerSession()], NORMAL);
		const { highest, lowest } = scoreExtremes(totals);

		expect(highest).toEqual({
			sessionCode: "A",
			playerName: "Bob",
			total: 88,
		});
		expect(lowest).toEqual({
			sessionCode: "A",
			playerName: "Alice",
			total: 41,
		});
	});

	it("returns undefined for both when there are no totals", () => {
		expect(scoreExtremes([])).toEqual({
			highest: undefined,
			lowest: undefined,
		});
	});
});

describe("categoryStats", () => {
	it("computes attempts, average, scratch rate and max per category", () => {
		const stats = categoryStats([twoPlayerSession()]);
		const yatzy = stats.find((s) => s.categoryId === "yatzy_5");

		expect(yatzy).toEqual({
			categoryId: "yatzy_5",
			section: "lower",
			attempts: 2,
			average: 25,
			scratchRate: 0.5,
			max: 50,
		});
	});
});

describe("yatzyHitRate", () => {
	it("counts nonzero yatzy_N scores as hits, by id prefix", () => {
		const session: StatsSession = {
			...twoPlayerSession(),
			categories: [
				...twoPlayerSession().categories,
				{ id: "yatzy_5", section: "lower" },
			],
			scores: [
				{ playerId: "p1", categoryId: "yatzy_5", value: 0, dice: null },
				{ playerId: "p2", categoryId: "yatzy_5", value: 50, dice: null },
			],
		};

		expect(yatzyHitRate([session])).toEqual({
			attempts: 2,
			hits: 1,
			rate: 0.5,
		});
	});

	it("ignores unrelated categories and unscored attempts", () => {
		const session: StatsSession = {
			...twoPlayerSession(),
			scores: [
				{ playerId: "p1", categoryId: "chance", value: 20, dice: null },
				{ playerId: "p1", categoryId: "yatzy_5", value: null, dice: null },
			],
		};

		expect(yatzyHitRate([session])).toEqual({ attempts: 0, hits: 0, rate: 0 });
	});

	it("returns a zero rate when there are no sessions", () => {
		expect(yatzyHitRate([])).toEqual({ attempts: 0, hits: 0, rate: 0 });
	});
});

describe("turnOrderAdvantage", () => {
	it("aggregates win rate and average rank by seat, not player identity", () => {
		// Bob (seat 1) always outscores Alice (seat 0) in twoPlayerSession.
		const stats = turnOrderAdvantage([twoPlayerSession()], NORMAL);

		expect(stats).toEqual([
			{ orderIndex: 0, gamesPlayed: 1, winRate: 0, avgRank: 2 },
			{ orderIndex: 1, gamesPlayed: 1, winRate: 1, avgRank: 1 },
		]);
	});

	it("skips players whose seat can't be resolved and sorts by seat", () => {
		expect(turnOrderAdvantage([], NORMAL)).toEqual([]);
	});
});

describe("bonusAchievementRate", () => {
	it("reports overall and per-game-mode rates", () => {
		const lowThreshold: GameModesById = {
			mini: { upperBonusThreshold: 10, upperBonusAmount: 5, diceCount: 5 },
		};
		const session: StatsSession = {
			sessionCode: "B",
			gameModeId: "mini",
			createdAt: "2026-01-02T09:00:00Z",
			finishedAt: "2026-01-02T09:20:00Z",
			players: [{ id: "p3", name: "Alice", orderIndex: 0 }],
			categories: [{ id: "ones", section: "upper" }],
			scores: [{ playerId: "p3", categoryId: "ones", value: 12, dice: null }],
		};

		const rates = bonusAchievementRate([session], lowThreshold);
		const overall = rates.find((r) => r.gameModeId === "overall");
		const mini = rates.find((r) => r.gameModeId === "mini");

		expect(overall).toMatchObject({ achieved: 1, total: 1, rate: 1 });
		expect(mini).toMatchObject({ achieved: 1, total: 1, rate: 1 });
	});

	it("skips sessions whose game mode is unknown", () => {
		const session: StatsSession = {
			...twoPlayerSession(),
			gameModeId: "unknown-mode",
		};
		const rates = bonusAchievementRate([session], NORMAL);
		expect(rates.find((r) => r.gameModeId === "overall")).toMatchObject({
			achieved: 0,
			total: 0,
		});
	});
});

describe("playerLeaderboard", () => {
	it("groups by player name across sessions and ranks by average total", () => {
		const secondGame: StatsSession = {
			sessionCode: "B",
			gameModeId: "normal",
			createdAt: "2026-01-02T09:00:00Z",
			finishedAt: "2026-01-02T09:20:00Z",
			players: [{ id: "p3", name: "Alice", orderIndex: 0 }],
			categories: [{ id: "ones", section: "upper" }],
			scores: [{ playerId: "p3", categoryId: "ones", value: 12, dice: null }],
		};

		const leaderboard = playerLeaderboard(
			[twoPlayerSession(), secondGame],
			NORMAL,
		);

		const alice = leaderboard.find((p) => p.name === "Alice");
		const bob = leaderboard.find((p) => p.name === "Bob");

		expect(alice).toMatchObject({ gamesPlayed: 2, wins: 1, bestTotal: 41 });
		expect(bob).toMatchObject({ gamesPlayed: 1, wins: 1, bestTotal: 88 });
		// Bob's single 88 outranks Alice's (41+12)/2 average.
		expect(leaderboard[0].name).toBe("Bob");
	});
});

describe("categoryAveragesByPlayer", () => {
	it("averages each player's score per category", () => {
		const averages = categoryAveragesByPlayer([twoPlayerSession()]);
		expect(averages.Alice.yatzy_5).toBe(0);
		expect(averages.Bob.yatzy_5).toBe(50);
		expect(averages.Alice.ones).toBe(3);
	});
});

describe("gamesOverTime", () => {
	it("buckets finished games by calendar day, sorted ascending", () => {
		const sessions: StatsSession[] = [
			{ ...twoPlayerSession(), sessionCode: "A", finishedAt: "2026-01-02T10:00:00Z" },
			{ ...twoPlayerSession(), sessionCode: "B", finishedAt: "2026-01-01T10:00:00Z" },
			{ ...twoPlayerSession(), sessionCode: "C", finishedAt: "2026-01-01T15:00:00Z" },
		];

		expect(gamesOverTime(sessions)).toEqual([
			{ date: "2026-01-01", count: 2 },
			{ date: "2026-01-02", count: 1 },
		]);
	});

	it("ignores unfinished sessions", () => {
		const unfinished: StatsSession = { ...twoPlayerSession(), finishedAt: null };
		expect(gamesOverTime([unfinished])).toEqual([]);
	});
});

describe("overview", () => {
	it("summarizes totals and durations across sessions", () => {
		const summary = overview([twoPlayerSession()]);

		expect(summary.totalGames).toBe(1);
		expect(summary.totalScoreEntries).toBe(8);
		expect(summary.totalRollsRecorded).toBe(0); // fixture uses dice: null
		expect(summary.avgDurationMs).toBe(30 * 60 * 1000);
		expect(summary.longestDurationMs).toBe(30 * 60 * 1000);
		expect(summary.shortestDurationMs).toBe(30 * 60 * 1000);
		expect(summary.totalDurationMs).toBe(30 * 60 * 1000);
	});

	it("handles sessions with no finished games", () => {
		const unfinished: StatsSession = { ...twoPlayerSession(), finishedAt: null };
		const summary = overview([unfinished]);
		expect(summary.avgDurationMs).toBeUndefined();
		expect(summary.longestDurationMs).toBeUndefined();
		expect(summary.shortestDurationMs).toBeUndefined();
		expect(summary.totalDurationMs).toBeUndefined();
	});
});
