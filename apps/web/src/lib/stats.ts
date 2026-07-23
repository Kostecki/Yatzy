import { grandTotal, rankPlayers } from "./scoring";

export interface StatsSession {
	sessionCode: string;
	gameModeId: string;
	createdAt: string | Date;
	finishedAt: string | Date | null;
	players: { id: string; name: string; orderIndex: number }[];
	categories: { id: string; section: "upper" | "lower" }[];
	scores: {
		playerId: string;
		categoryId: string;
		value: number | null;
		dice: number[] | null;
	}[];
}

export interface GameModeBonusInfo {
	upperBonusThreshold: number;
	upperBonusAmount: number;
	diceCount: number;
}

export type GameModesById = Record<string, GameModeBonusInfo>;

// Every recorded dice result (the final dice a category was scored with,
// not each individual reroll) flattened across every finished session -
// used both overall and split per game mode (dice counts differ per mode,
// so a global-only count would over-represent whichever mode has more dice).
export interface DiceFaceCount {
	face: number;
	count: number;
	percentage: number;
}

function countFaces(diceRolls: number[][]): DiceFaceCount[] {
	const counts = [0, 0, 0, 0, 0, 0, 0];
	let total = 0;
	for (const dice of diceRolls) {
		for (const face of dice) {
			counts[face]++;
			total++;
		}
	}
	return Array.from({ length: 6 }, (_, i) => {
		const face = i + 1;
		return {
			face,
			count: counts[face],
			percentage: total > 0 ? (counts[face] / total) * 100 : 0,
		};
	});
}

export function diceFaceFrequency(sessions: StatsSession[]): {
	overall: DiceFaceCount[];
	byGameMode: Record<string, DiceFaceCount[]>;
} {
	const allDice: number[][] = [];
	const diceByGameMode: Record<string, number[][]> = {};

	for (const session of sessions) {
		for (const score of session.scores) {
			if (!score.dice) continue;
			allDice.push(score.dice);
			(diceByGameMode[session.gameModeId] ??= []).push(score.dice);
		}
	}

	return {
		overall: countFaces(allDice),
		byGameMode: Object.fromEntries(
			Object.entries(diceByGameMode).map(([gameModeId, dice]) => [
				gameModeId,
				countFaces(dice),
			]),
		),
	};
}

export interface PlayerGameTotal {
	sessionCode: string;
	gameModeId: string;
	playerId: string;
	playerName: string;
	total: number;
}

// Every player's final grand total from every finished game, reusing the
// same bonus-aware grandTotal() the live scoreboard uses - so a stats-page
// total always matches what that player actually saw at game end.
export function scoreDistribution(
	sessions: StatsSession[],
	gameModesById: GameModesById,
): PlayerGameTotal[] {
	return sessions.flatMap((session) =>
		session.players.map((player) => ({
			sessionCode: session.sessionCode,
			gameModeId: session.gameModeId,
			playerId: player.id,
			playerName: player.name,
			total: grandTotal(session, gameModesById[session.gameModeId], player.id),
		})),
	);
}

export interface ScoreExtreme {
	sessionCode: string;
	playerName: string;
	total: number;
}

// The single best and worst final totals ever recorded, with who and which
// game - a plain min/max is a number with no story, this is a callout.
export function scoreExtremes(totals: PlayerGameTotal[]): {
	highest: ScoreExtreme | undefined;
	lowest: ScoreExtreme | undefined;
} {
	if (totals.length === 0) return { highest: undefined, lowest: undefined };

	const sorted = [...totals].sort((a, b) => a.total - b.total);
	const toExtreme = (t: PlayerGameTotal): ScoreExtreme => ({
		sessionCode: t.sessionCode,
		playerName: t.playerName,
		total: t.total,
	});

	return {
		lowest: toExtreme(sorted[0]),
		highest: toExtreme(sorted[sorted.length - 1]),
	};
}

// Groups raw values into fixed-width buckets for a histogram, labeling each
// bucket by its lower bound (e.g. width 20 -> "0", "20", "40", ...). Empty
// buckets between real values are kept (a real gap in the distribution is
// meaningful), but leading/trailing empty buckets are trimmed - nobody's
// score sits near zero in a finished game, so that's just dead padding.
export function bucketize(
	values: number[],
	bucketSize: number,
): { bucket: number; label: string; count: number }[] {
	if (values.length === 0) return [];

	const bucketsOf = values.map((v) => Math.floor(v / bucketSize));
	const minBucket = Math.min(...bucketsOf);
	const maxBucket = Math.max(...bucketsOf);
	const buckets = new Map<number, number>();
	for (const bucket of bucketsOf) {
		buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
	}

	return Array.from({ length: maxBucket - minBucket + 1 }, (_, i) => {
		const bucket = minBucket + i;
		return {
			bucket,
			label: String(bucket * bucketSize),
			count: buckets.get(bucket) ?? 0,
		};
	});
}

export interface CategoryStat {
	categoryId: string;
	section: "upper" | "lower";
	attempts: number;
	average: number;
	scratchRate: number;
	max: number;
}

// Per category (e.g. "yatzy_5", "house"): how often it's actually played,
// its average score, how often it's scored a flat zero ("scratched"), and
// the best result anyone's landed - a rough proxy for how hard it is to hit.
export function categoryStats(sessions: StatsSession[]): CategoryStat[] {
	const sectionByCategory = new Map<string, "upper" | "lower">();
	const valuesByCategory = new Map<string, number[]>();

	for (const session of sessions) {
		for (const category of session.categories) {
			sectionByCategory.set(category.id, category.section);
		}
		for (const score of session.scores) {
			if (score.value === null) continue;
			const values = valuesByCategory.get(score.categoryId) ?? [];
			values.push(score.value);
			valuesByCategory.set(score.categoryId, values);
		}
	}

	return Array.from(valuesByCategory.entries()).map(([categoryId, values]) => ({
		categoryId,
		section: sectionByCategory.get(categoryId) ?? "lower",
		attempts: values.length,
		average: values.reduce((sum, v) => sum + v, 0) / values.length,
		scratchRate: values.filter((v) => v === 0).length / values.length,
		max: Math.max(...values),
	}));
}

export interface YatzyHitRate {
	attempts: number;
	hits: number;
	rate: number;
}

// The category is identified by its id prefix ("yatzy_5"/"yatzy_6"/"yatzy_12"
// in the seed data) rather than needing the category's primitive type
// threaded through from the backend - stable since these are the game's own
// fixed catalog ids, not something a user can rename or redefine.
export function yatzyHitRate(sessions: StatsSession[]): YatzyHitRate {
	let attempts = 0;
	let hits = 0;

	for (const session of sessions) {
		for (const score of session.scores) {
			if (!score.categoryId.startsWith("yatzy") || score.value === null) {
				continue;
			}
			attempts += 1;
			if (score.value > 0) hits += 1;
		}
	}

	return { attempts, hits, rate: attempts > 0 ? hits / attempts : 0 };
}

export interface BonusRate {
	gameModeId: string | "overall";
	achieved: number;
	total: number;
	rate: number;
}

// What share of individual player-games clear the upper-section bonus
// threshold, both overall and broken down per game mode (thresholds differ
// per mode, so an overall-only figure would be misleading to compare).
export function bonusAchievementRate(
	sessions: StatsSession[],
	gameModesById: GameModesById,
): BonusRate[] {
	const byGameMode = new Map<string, { achieved: number; total: number }>();
	let overallAchieved = 0;
	let overallTotal = 0;

	for (const session of sessions) {
		const gameMode = gameModesById[session.gameModeId];
		if (!gameMode) continue;

		const upperCategoryIds = new Set(
			session.categories.filter((c) => c.section === "upper").map((c) => c.id),
		);

		for (const player of session.players) {
			const upperSubtotal = session.scores
				.filter(
					(s) => s.playerId === player.id && upperCategoryIds.has(s.categoryId),
				)
				.reduce((sum, s) => sum + (s.value ?? 0), 0);

			const achieved = upperSubtotal >= gameMode.upperBonusThreshold ? 1 : 0;
			overallAchieved += achieved;
			overallTotal += 1;

			const entry = byGameMode.get(session.gameModeId) ?? {
				achieved: 0,
				total: 0,
			};
			entry.achieved += achieved;
			entry.total += 1;
			byGameMode.set(session.gameModeId, entry);
		}
	}

	return [
		{
			gameModeId: "overall" as const,
			achieved: overallAchieved,
			total: overallTotal,
			rate: overallTotal > 0 ? overallAchieved / overallTotal : 0,
		},
		...Array.from(byGameMode.entries()).map(([gameModeId, { achieved, total }]) => ({
			gameModeId,
			achieved,
			total,
			rate: total > 0 ? achieved / total : 0,
		})),
	];
}

export interface PlayerStanding {
	name: string;
	gamesPlayed: number;
	wins: number;
	winRate: number;
	avgTotal: number;
	bestTotal: number;
}

// Players have no durable identity across sessions (just a per-session name),
// so the leaderboard groups by name - two different people who both typed
// "Alex" will merge, which is an accepted tradeoff of the current data model.
export function playerLeaderboard(
	sessions: StatsSession[],
	gameModesById: GameModesById,
): PlayerStanding[] {
	const byName = new Map<
		string,
		{ gamesPlayed: number; wins: number; totals: number[] }
	>();

	for (const session of sessions) {
		const gameMode = gameModesById[session.gameModeId];
		const ranked = rankPlayers(session, gameMode);

		for (const player of ranked) {
			const entry = byName.get(player.name) ?? {
				gamesPlayed: 0,
				wins: 0,
				totals: [],
			};
			entry.gamesPlayed += 1;
			entry.wins += player.rank === 1 ? 1 : 0;
			entry.totals.push(player.total);
			byName.set(player.name, entry);
		}
	}

	return Array.from(byName.entries())
		.map(([name, { gamesPlayed, wins, totals }]) => ({
			name,
			gamesPlayed,
			wins,
			winRate: wins / gamesPlayed,
			avgTotal: totals.reduce((sum, t) => sum + t, 0) / totals.length,
			bestTotal: Math.max(...totals),
		}))
		.sort((a, b) => b.avgTotal - a.avgTotal);
}

export interface TurnOrderStat {
	orderIndex: number;
	gamesPlayed: number;
	winRate: number;
	avgRank: number;
}

// Does seat position (who went first, second, ...) correlate with how well
// you place? Keyed by orderIndex rather than player identity, so - unlike
// the leaderboard - this holds up even though names aren't a reliable way to
// track the same real person across sessions.
export function turnOrderAdvantage(
	sessions: StatsSession[],
	gameModesById: GameModesById,
): TurnOrderStat[] {
	const bySeat = new Map<
		number,
		{ gamesPlayed: number; wins: number; rankSum: number }
	>();

	for (const session of sessions) {
		const gameMode = gameModesById[session.gameModeId];
		const ranked = rankPlayers(session, gameMode);
		const orderIndexById = new Map(
			session.players.map((p) => [p.id, p.orderIndex]),
		);

		for (const player of ranked) {
			const orderIndex = orderIndexById.get(player.id);
			if (orderIndex === undefined) continue;

			const entry = bySeat.get(orderIndex) ?? {
				gamesPlayed: 0,
				wins: 0,
				rankSum: 0,
			};
			entry.gamesPlayed += 1;
			entry.wins += player.rank === 1 ? 1 : 0;
			entry.rankSum += player.rank;
			bySeat.set(orderIndex, entry);
		}
	}

	return Array.from(bySeat.entries())
		.map(([orderIndex, { gamesPlayed, wins, rankSum }]) => ({
			orderIndex,
			gamesPlayed,
			winRate: wins / gamesPlayed,
			avgRank: rankSum / gamesPlayed,
		}))
		.sort((a, b) => a.orderIndex - b.orderIndex);
}

// Per player name, their average score in each category they've played -
// feeds a radar/comparison chart of playstyle across the most active players.
export function categoryAveragesByPlayer(
	sessions: StatsSession[],
): Record<string, Record<string, number>> {
	const sums = new Map<string, Map<string, { sum: number; count: number }>>();

	for (const session of sessions) {
		for (const player of session.players) {
			const playerScores = session.scores.filter(
				(s) => s.playerId === player.id && s.value !== null,
			);
			const categoryMap = sums.get(player.name) ?? new Map();
			for (const score of playerScores) {
				const entry = categoryMap.get(score.categoryId) ?? {
					sum: 0,
					count: 0,
				};
				entry.sum += score.value ?? 0;
				entry.count += 1;
				categoryMap.set(score.categoryId, entry);
			}
			sums.set(player.name, categoryMap);
		}
	}

	return Object.fromEntries(
		Array.from(sums.entries()).map(([name, categoryMap]) => [
			name,
			Object.fromEntries(
				Array.from(categoryMap.entries()).map(([categoryId, { sum, count }]) => [
					categoryId,
					sum / count,
				]),
			),
		]),
	);
}

export interface GamesOnDay {
	date: string;
	count: number;
}

// Finished-game counts bucketed by calendar day (UTC date part of
// finishedAt), sorted ascending - a simple "growth over time" trend line.
export function gamesOverTime(sessions: StatsSession[]): GamesOnDay[] {
	const counts = new Map<string, number>();

	for (const session of sessions) {
		if (!session.finishedAt) continue;
		const date = new Date(session.finishedAt).toISOString().slice(0, 10);
		counts.set(date, (counts.get(date) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([date, count]) => ({ date, count }))
		.sort((a, b) => a.date.localeCompare(b.date));
}

export interface Overview {
	totalGames: number;
	totalScoreEntries: number;
	totalRollsRecorded: number;
	avgDurationMs: number | undefined;
	longestDurationMs: number | undefined;
	shortestDurationMs: number | undefined;
	totalDurationMs: number | undefined;
}

export function overview(sessions: StatsSession[]): Overview {
	const durations = sessions
		.filter((s) => s.finishedAt)
		.map(
			(s) =>
				new Date(s.finishedAt as string | Date).getTime() -
				new Date(s.createdAt).getTime(),
		)
		.filter((ms) => ms >= 0);

	return {
		totalGames: sessions.length,
		totalScoreEntries: sessions.reduce((sum, s) => sum + s.scores.length, 0),
		totalRollsRecorded: sessions.reduce(
			(sum, s) => sum + s.scores.filter((score) => score.dice).length,
			0,
		),
		avgDurationMs:
			durations.length > 0
				? durations.reduce((sum, ms) => sum + ms, 0) / durations.length
				: undefined,
		longestDurationMs: durations.length > 0 ? Math.max(...durations) : undefined,
		shortestDurationMs: durations.length > 0 ? Math.min(...durations) : undefined,
		totalDurationMs:
			durations.length > 0
				? durations.reduce((sum, ms) => sum + ms, 0)
				: undefined,
	};
}
