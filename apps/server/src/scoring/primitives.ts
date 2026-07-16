export type Dice = number[];

/*
  Returns an array of counts for each face value (1-6) in the given dice.
  Uses a 7-element array where index 0 is unused, and indices 1-6 correspond to the actual face values.
  For example, if the input dice are [1, 2, 2, 3], the output will be [0, 1, 2, 1, 0, 0, 0].
*/
export function countByFace(dice: Dice): number[] {
	const counts = [0, 0, 0, 0, 0, 0, 0];
	for (const face of dice) {
		counts[face]++;
	}
	return counts;
}

/*
  Returns the sum of all dice that match the given face value.
  Category: the upper section (Ones-Sixes) in every mode.
*/
export function sumOfFace(dice: Dice, params: { face: number }): number {
	return countByFace(dice)[params.face] * params.face;
}

/*
  Returns the score for the "n groups of size" category.
  "n groups of size" is the sum of the n highest groups of dice that have at least the specified size.
  Category: Pairs (size: 2) in every mode - Normal's 1/2 Pair, Family's 1/2/3 Pairs, Giant's 1-6 Pairs.
  Also Family's "2x3 of the same" and Giant's 2x3/2x4/2x5/2x6/3x3/3x4 of the same (larger sizes).
*/
export function nGroupsOfSize(
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

/*
  Returns the score for the "n of a kind" category
  "n of a kind" is the sum of the n highest dice if there are at least n dice of the same face.
  Category: Normal/Family's Three/Four of a Kind, Giant's Three through Eleven of a Kind.
*/
export function nOfAKindSum(
	dice: Dice,
	params: { requiredCount: number },
): number {
	const counts = countByFace(dice);

	for (let face = 6; face >= 1; face--) {
		if (counts[face] >= params.requiredCount) {
			return params.requiredCount * face;
		}
	}

	return 0;
}

/*
  Returns the score for a straight (sequence) of dice.
  Category: Normal's Lille/Stor, Family's Lille/Stor/Royal, Giant's Lav/Hoj/Cameron.
*/
export function straight(
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

/*
  Returns the score for a straight (sequence) of dice with an extra requirement.
  Category: Giant only - Lille Claus, Store Claus, Knold, Tot, Kaptajn Vom.
*/
export function straightPlusExtra(
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

	// Check if the extra face is within the straight range and adjust the required extra count accordingly
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

/*
  Returns the score for the "two groups of size" category.
  "two groups of size" is the sum of the two highest groups of dice that have at least the specified sizes.
  Category: Normal/Family's House, and Giant's Lillemor, Posten, Momsemor, Skipperskraek, Radiserne,
  Basserne, Gyldenspjaet, Kasket Karl, Klaus Kludder, Jens Lyn - each just a different sizeA/sizeB pair.
*/
export function twoGroupsSizes(
	dice: Dice,
	params: { sizeA: number; sizeB: number },
): number {
	const counts = countByFace(dice);
	let best = 0;

	for (let faceA = 6; faceA >= 1; faceA--) {
		for (let faceB = 6; faceB >= 1; faceB--) {
			if (faceA === faceB) continue; // Skip if both faces are the same

			if (counts[faceA] >= params.sizeA && counts[faceB] >= params.sizeB) {
				const candidate = params.sizeA * faceA + params.sizeB * faceB;
				best = Math.max(best, candidate);
			}
		}
	}
	return best;
}

/*
  Returns the sum of all dice, which is the score for the "Chance" category.
  Category: Chance, every mode.
*/
export function chance(dice: Dice): number {
	return dice.reduce((sum, face) => sum + face, 0);
}

/*
  Returns the score for the "Yatzy" category.
  "Yatzy" is a flat bonus if there are at least the required number of dice of the same face.
  Optionally including a bonus for the face value.
  Category: Yatzy, every mode (with/without the eyes bonus, depending on the mode's params).
*/
export function yatzy(
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
