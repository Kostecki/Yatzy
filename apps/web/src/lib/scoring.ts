// Straights always award the same points if hit, regardless of which faces
// make it up — so they can be scored directly, the way you'd write a fixed
// number on a paper sheet, no dice entry needed. (Yatzy could work the same
// way when it has no eyes bonus, but entering the actual dice like every
// other category avoids needing a separate "which face doesn't matter" UI.)
export function fixedValue(category: {
	primitive: string;
	params?: unknown;
}): number | undefined {
	if (
		category.primitive === "straight" ||
		category.primitive === "straight_plus_extra"
	) {
		return (category.params as { fixedScore: number }).fixedScore;
	}
	return undefined;
}

// Most categories only need a subset of your dice to determine the score —
// e.g. Three of a Kind only cares about 3 matching dice, however many you
// actually rolled. Chance needs every die (it sums the whole roll). Ones-Sixes
// has no fixed target at all: extra matching dice keep adding points and help
// reach the upper section bonus, so there's no "enough" to cap entry at —
// callers should treat undefined as "let them enter as many as they rolled."
export function targetDiceCount(
	category: { primitive: string; params?: unknown },
	diceCount: number | undefined,
): number | undefined {
	switch (category.primitive) {
		case "n_of_a_kind_sum":
		case "yatzy":
			return (category.params as { requiredCount: number }).requiredCount;
		case "n_groups_of_size": {
			const { groups, size } = category.params as {
				groups: number;
				size: number;
			};
			return groups * size;
		}
		case "two_groups_sizes": {
			const { sizeA, sizeB } = category.params as {
				sizeA: number;
				sizeB: number;
			};
			return sizeA + sizeB;
		}
		case "straight": {
			const { straightLow, straightHigh } = category.params as {
				straightLow: number;
				straightHigh: number;
			};
			return straightHigh - straightLow + 1;
		}
		case "straight_plus_extra": {
			const { straightLow, straightHigh, extraCount } = category.params as {
				straightLow: number;
				straightHigh: number;
				extraCount: number;
			};
			return straightHigh - straightLow + 1 + extraCount;
		}
		case "chance":
			return diceCount;
		default:
			return undefined;
	}
}

// Classic Yatzy heuristic: the six upper faces sum to 21 (1+2+...+6), so
// rolling N of every face totals N*21 — meaning N = threshold/21 dice of a
// face is "on pace" for the upper bonus, the same N for every Ones-Sixes
// category regardless of which face it is.
export function upperBonusPace(upperBonusThreshold: number): number {
	return Math.round(upperBonusThreshold / 21);
}

// For most categories the score only depends on which faces repeat, not their
// identity — so remapping the seed's example roll to the highest available
// faces (sixes, then fives, ...) still qualifies and shows the best-looking
// version. Straights need an actual consecutive run, so their example is left
// untouched.
//
// The result is split into the category's natural sub-groups (e.g. a house's
// 3-of-a-kind and its pair, or two-pairs' two pairs) so the UI can display
// each group as an atomic unit — keeping a group together on one line and
// only breaking between groups, rather than wrapping mid-group. Groups larger
// than a row (e.g. 9-11 of a kind, or chance/yatzy in Giant mode) are further
// split into rows of at most MAX_ROW dice, since there's no sub-grouping left
// to break on.
const MAX_ROW = 6;

function toRows(group: number[]): number[][] {
	const rows: number[][] = [];
	for (let i = 0; i < group.length; i += MAX_ROW) {
		rows.push(group.slice(i, i + MAX_ROW));
	}
	return rows;
}

export function exampleDiceGroups(
	category: {
		primitive: string;
		exampleDice?: unknown;
		params?: unknown;
	},
	diceCount?: number,
): number[][] | undefined {
	// Chance is shared across every mode (5/6/12 dice), so a fixed-length
	// example in the DB can't be right for all of them — the best roll is
	// just "however many dice this mode has, all sixes."
	if (category.primitive === "chance") {
		return diceCount ? toRows(Array(diceCount).fill(6)) : undefined;
	}

	const dice = category.exampleDice as number[] | null | undefined;
	if (!dice || dice.length === 0) return undefined;

	if (category.primitive === "straight") {
		return [dice];
	}

	if (category.primitive === "straight_plus_extra") {
		const { straightLow, straightHigh } = category.params as {
			straightLow: number;
			straightHigh: number;
		};
		const straightLength = straightHigh - straightLow + 1;
		return [dice.slice(0, straightLength), dice.slice(straightLength)];
	}

	// Bigger groups get the higher face — that's what actually maximizes the
	// score (e.g. a house's 3-group outscores its 2-group more on a 6 than a 5).
	const counts = new Map<number, number>();
	for (const face of dice) {
		counts.set(face, (counts.get(face) ?? 0) + 1);
	}
	const groups = Array.from(counts.entries()).sort(
		(a, b) => b[1] - a[1] || b[0] - a[0],
	);
	const mapping = new Map<number, number>();
	groups.forEach(([face], i) => {
		mapping.set(face, 6 - i);
	});
	const mapped = dice.map((face) => mapping.get(face) ?? face);

	if (category.primitive === "two_groups_sizes") {
		const { sizeA, sizeB } = category.params as {
			sizeA: number;
			sizeB: number;
		};
		return [mapped.slice(0, sizeA), mapped.slice(sizeA, sizeA + sizeB)];
	}

	if (category.primitive === "n_groups_of_size") {
		const { groups: groupCount, size } = category.params as {
			groups: number;
			size: number;
		};
		return Array.from({ length: groupCount }, (_, i) =>
			mapped.slice(i * size, (i + 1) * size),
		);
	}

	// n_of_a_kind_sum, yatzy: a single group of same-face dice.
	return toRows(mapped);
}

// A "round" ends once every player has filled in one more category — so the
// current round tracks whoever's furthest behind, not whoever's furthest
// ahead. Once everyone has filled every category, the game is done. The
// player furthest behind (first such player, in seat order) is treated as
// "up next" — the host can still score anyone out of order, this is just a
// hint for who paper-Yatzy turn order would expect to go now.
export function roundProgress(sessionState: {
	players: { id: string }[];
	categories: { id: string }[];
	scores: { playerId: string }[];
}): {
	currentRound: number;
	totalRounds: number;
	isComplete: boolean;
	currentPlayerId: string | undefined;
} {
	const totalRounds = sessionState.categories.length;

	if (sessionState.players.length === 0) {
		return {
			currentRound: 0,
			totalRounds,
			isComplete: false,
			currentPlayerId: undefined,
		};
	}

	const filledCounts = sessionState.players.map(
		(player) =>
			sessionState.scores.filter((s) => s.playerId === player.id).length,
	);
	const minFilled = Math.min(...filledCounts);
	const currentRound = Math.min(minFilled + 1, totalRounds);
	const isComplete = minFilled >= totalRounds;
	const currentPlayerId = isComplete
		? undefined
		: sessionState.players[filledCounts.indexOf(minFilled)]?.id;

	return { currentRound, totalRounds, isComplete, currentPlayerId };
}
