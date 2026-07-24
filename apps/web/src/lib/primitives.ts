// Mirrors apps/server/src/scoring/primitives.ts. Duplicated (not imported)
// because the server and web apps aren't set up as a pnpm workspace sharing
// packages, and these are pure functions of dice + params, cheap to keep
// in sync — this lets the host's score preview compute instantly on every
// dice click instead of round-tripping to the server on each one.

export type Dice = number[];

function countByFace(dice: Dice): number[] {
	const counts = [0, 0, 0, 0, 0, 0, 0];
	for (const face of dice) {
		counts[face]++;
	}
	return counts;
}

function sumOfFace(dice: Dice, params: { face: number }): number {
	return countByFace(dice)[params.face] * params.face;
}

function nGroupsOfSize(
	dice: Dice,
	params: { groups: number; size: number },
): number {
	const counts = countByFace(dice);
	const qualifyingFaces: number[] = [];

	for (let face = 6; face >= 1; face--) {
		if (counts[face] >= params.size) {
			qualifyingFaces.push(face);
		}

		if (qualifyingFaces.length >= params.groups) {
			return qualifyingFaces.reduce((sum, face) => sum + params.size * face, 0);
		}
	}

	return 0;
}

function nOfAKindSum(dice: Dice, params: { requiredCount: number }): number {
	const counts = countByFace(dice);

	for (let face = 6; face >= 1; face--) {
		if (counts[face] >= params.requiredCount) {
			return params.requiredCount * face;
		}
	}

	return 0;
}

function straight(
	dice: Dice,
	params: { straightLow: number; straightHigh: number; fixedScore: number },
): number {
	const counts = countByFace(dice);

	for (let face = params.straightLow; face <= params.straightHigh; face++) {
		if (counts[face] === 0) {
			return 0;
		}
	}

	return params.fixedScore;
}

function straightPlusExtra(
	dice: Dice,
	params: {
		straightLow: number;
		straightHigh: number;
		extraFace: number;
		extraCount: number;
		fixedScore: number;
	},
): number {
	const counts = countByFace(dice);

	const straightConsumesExtraFace =
		params.straightLow <= params.extraFace &&
		params.extraFace <= params.straightHigh;
	const requiredExtraCount =
		params.extraCount + (straightConsumesExtraFace ? 1 : 0);

	if (counts[params.extraFace] < requiredExtraCount) {
		return 0;
	}

	for (let face = params.straightLow; face <= params.straightHigh; face++) {
		if (counts[face] === 0) {
			return 0;
		}
	}

	return params.fixedScore;
}

function twoGroupsSizes(
	dice: Dice,
	params: { sizeA: number; sizeB: number },
): number {
	const counts = countByFace(dice);
	let best = 0;

	for (let faceA = 6; faceA >= 1; faceA--) {
		for (let faceB = 6; faceB >= 1; faceB--) {
			if (faceA === faceB) continue;

			if (counts[faceA] >= params.sizeA && counts[faceB] >= params.sizeB) {
				const candidate = params.sizeA * faceA + params.sizeB * faceB;
				best = Math.max(best, candidate);
			}
		}
	}
	return best;
}

function chance(dice: Dice): number {
	return dice.reduce((sum, face) => sum + face, 0);
}

function yatzy(
	dice: Dice,
	params: {
		flatBonus: number;
		includeEyesBonus: boolean;
		requiredCount: number;
	},
): number {
	const counts = countByFace(dice);
	let score = 0;

	for (let face = 1; face <= 6; face++) {
		if (counts[face] >= params.requiredCount) {
			score += params.flatBonus;

			if (params.includeEyesBonus) {
				score += face * params.requiredCount;
			}

			return score;
		}
	}

	return score;
}

export const primitives = {
	sum_of_face: sumOfFace,
	n_of_a_kind_sum: nOfAKindSum,
	n_groups_of_size: nGroupsOfSize,
	straight: straight,
	straight_plus_extra: straightPlusExtra,
	two_groups_sizes: twoGroupsSizes,
	chance: chance,
	yatzy: yatzy,
};

// Scores a category directly from face counts (as entered in the host's dice
// row), rather than a flat dice array.
export function scoreCategory(
	category: { primitive: string; params?: unknown },
	diceCounts: number[],
): number {
	const dice = diceCounts.flatMap((count, index) =>
		Array(count).fill(index + 1),
	);
	return primitives[category.primitive as keyof typeof primitives](
		dice,
		category.params as never,
	);
}
