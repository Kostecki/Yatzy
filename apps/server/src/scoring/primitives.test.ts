import { describe, expect, it } from "vitest";

import {
	chance,
	countByFace,
	nGroupsOfSize,
	nOfAKindSum,
	straight,
	straightPlusExtra,
	sumOfFace,
	twoGroupsSizes,
	yatzy,
} from "./primitives.js";

// Shared helper, not a category itself - used internally by every primitive below.
describe("countByFace", () => {
	it("counts each face value", () => {
		expect(countByFace([1, 1, 2, 3, 3, 3])).toEqual([0, 2, 1, 3, 0, 0, 0]);
	});

	it("returns all zeros for an empty roll", () => {
		expect(countByFace([])).toEqual([0, 0, 0, 0, 0, 0, 0]);
	});
});

// Category: the upper section (Ones-Sixes) in every mode.
describe("sumOfFace", () => {
	it("sums only the dice matching the target face", () => {
		expect(sumOfFace([5, 5, 5, 2, 6], { face: 5 })).toBe(15);
	});

	it("returns 0 when the face doesn't appear", () => {
		expect(sumOfFace([1, 2, 3, 4, 6], { face: 5 })).toBe(0);
	});
});

// Category: Normal/Family's Three/Four of a Kind, Giant's Three through Eleven of a Kind.
describe("nOfAKindSum", () => {
	it("scores exactly requiredCount dice, not every matching die", () => {
		// Five 6s scored as "3 of a kind" must be 3x6=18, not 5x6=30
		expect(nOfAKindSum([6, 6, 6, 6, 6], { requiredCount: 3 })).toBe(18);
	});

	it("picks the highest qualifying face when multiple qualify", () => {
		expect(nOfAKindSum([6, 6, 6, 5, 5, 5], { requiredCount: 3 })).toBe(18); // 3x6, not 3x5
	});

	it("returns 0 when no face meets the required count", () => {
		expect(nOfAKindSum([1, 2, 3, 4, 5], { requiredCount: 3 })).toBe(0);
	});
});

// Category: Pairs (size: 2) in every mode - Normal's 1/2 Pair, Family's 1/2/3 Pairs, Giant's 1-6 Pairs.
// Also Family's "2x3 of the same" and Giant's 2x3/2x4/2x5/2x6/3x3/3x4 of the same (larger sizes).
describe("nGroupsOfSize", () => {
	it("sums the highest qualifying groups", () => {
		// "2 pairs": groups=2, size=2
		expect(nGroupsOfSize([6, 6, 5, 5, 3, 3], { groups: 2, size: 2 })).toBe(22); // 2x6 + 2x5
	});

	it("does not inflate the score when a face has more than the required size", () => {
		// three 6s still only count as one size-2 group worth 2x6, not 3x6
		expect(nGroupsOfSize([6, 6, 6, 5, 5], { groups: 2, size: 2 })).toBe(22);
	});

	it("returns 0 when there aren't enough distinct qualifying faces", () => {
		expect(nGroupsOfSize([6, 6, 1, 2, 3], { groups: 2, size: 2 })).toBe(0);
	});

	it("supports Giant-style larger groups (e.g. 2x3 of the same)", () => {
		expect(
			nGroupsOfSize([6, 6, 6, 5, 5, 5, 1, 2, 3, 4, 1, 1], {
				groups: 2,
				size: 3,
			}),
		).toBe(33); // 3x6 + 3x5
	});
});

// Category: Normal's Lille/Stor, Family's Lille/Stor/Royal, Giant's Lav/Hoj/Cameron.
describe("straight", () => {
	it("scores the fixed value when every face in range is present", () => {
		expect(
			straight([1, 2, 3, 4, 5], {
				straightLow: 1,
				straightHigh: 5,
				fixedScore: 15,
			}),
		).toBe(15);
	});

	it("returns 0 when a face in range is missing", () => {
		expect(
			straight([1, 2, 3, 4, 4], {
				straightLow: 1,
				straightHigh: 5,
				fixedScore: 15,
			}),
		).toBe(0);
	});

	it("only checks presence, ignoring extra dice outside the range (Giant-style subset)", () => {
		expect(
			straight([1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6], {
				straightLow: 1,
				straightHigh: 5,
				fixedScore: 15,
			}),
		).toBe(15);
	});
});

// Category: Giant only - Lille Claus, Store Claus, Knold, Tot, Kaptajn Vom.
describe("straightPlusExtra", () => {
	it("scores the fixed value when the straight and all extras are present (Kaptajn Vom)", () => {
		// straight 1-6 plus 6 extra sixes = 7 sixes total
		expect(
			straightPlusExtra([1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6], {
				straightLow: 1,
				straightHigh: 6,
				extraFace: 6,
				extraCount: 6,
				fixedScore: 200,
			}),
		).toBe(200);
	});

	it("returns 0 when one short on the extra count, even with the straight present", () => {
		// only 6 sixes total instead of the required 7
		expect(
			straightPlusExtra([1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6], {
				straightLow: 1,
				straightHigh: 6,
				extraFace: 6,
				extraCount: 6,
				fixedScore: 200,
			}),
		).toBe(0);
	});

	it("returns 0 when the straight itself is missing, regardless of extras", () => {
		expect(
			straightPlusExtra([1, 2, 3, 4, 4, 6, 6, 6, 6, 6, 6, 6], {
				straightLow: 1,
				straightHigh: 6,
				extraFace: 6,
				extraCount: 6,
				fixedScore: 200,
			}),
		).toBe(0);
	});

	it("does not add the +1 overlap adjustment when extraFace falls outside the straight range", () => {
		// straight 1-5, extra face is 6 (outside the range) - no die is "shared", so
		// only extraCount (not extraCount+1) sixes are required
		expect(
			straightPlusExtra([1, 2, 3, 4, 5, 6, 6], {
				straightLow: 1,
				straightHigh: 5,
				extraFace: 6,
				extraCount: 2,
				fixedScore: 50,
			}),
		).toBe(50);
	});
});

// Category: Normal/Family's House, and Giant's Lillemor, Posten, Momsemor, Skipperskraek, Radiserne,
// Basserne, Gyldenspjaet, Kasket Karl, Klaus Kludder, Jens Lyn - each just a different sizeA/sizeB pair.
describe("twoGroupsSizes", () => {
	it("scores the best valid pair of distinct faces (House)", () => {
		expect(twoGroupsSizes([3, 3, 3, 5, 5], { sizeA: 3, sizeB: 2 })).toBe(19); // 3x3 + 2x5
	});

	it("finds the correct assignment when a naive greedy would fail", () => {
		// Only one face (6) can satisfy sizeB=6; a naive "fill sizeA first" pass
		// could consume the only face capable of filling sizeB.
		expect(
			twoGroupsSizes([6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5], { sizeA: 1, sizeB: 6 }),
		).toBe(41); // 1x5 + 6x6
	});

	it("returns 0 when no valid pair of distinct faces exists", () => {
		expect(twoGroupsSizes([6, 6, 6, 1, 2], { sizeA: 3, sizeB: 3 })).toBe(0);
	});
});

// Category: Chance, every mode.
describe("chance", () => {
	it("sums every die regardless of face", () => {
		expect(chance([1, 2, 3, 4, 5])).toBe(15);
	});

	it("works for any dice count", () => {
		expect(chance([6, 6, 6, 6, 6, 6])).toBe(36);
	});
});

// Category: Yatzy, every mode (with/without the eyes bonus, depending on the mode's params).
describe("yatzy", () => {
	it("awards the flat bonus when all dice match", () => {
		expect(
			yatzy([6, 6, 6, 6, 6], {
				flatBonus: 50,
				includeEyesBonus: false,
				requiredCount: 5,
			}),
		).toBe(50);
	});

	it("adds the eyes bonus on top when enabled", () => {
		expect(
			yatzy([6, 6, 6, 6, 6], {
				flatBonus: 50,
				includeEyesBonus: true,
				requiredCount: 5,
			}),
		).toBe(80); // 50 + 5x6
	});

	it("returns 0 when not all dice match", () => {
		expect(
			yatzy([6, 6, 6, 6, 5], {
				flatBonus: 50,
				includeEyesBonus: false,
				requiredCount: 5,
			}),
		).toBe(0);
	});

	it("scales to Giant's 12-dice Yatzy", () => {
		expect(
			yatzy(Array(12).fill(6), {
				flatBonus: 250,
				includeEyesBonus: false,
				requiredCount: 12,
			}),
		).toBe(250);
	});
});
