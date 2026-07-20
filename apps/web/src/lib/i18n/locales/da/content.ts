import type { ContentMessages } from "../types";

// Labels below are copied straight from the DB seed data (already Danish) —
// see apps/server/src/db/categories.ts and game-modes.ts. Descriptions are
// still the English source text (as a comment) and need translating.
export const content: ContentMessages = {
	categories: {
		ones: {
			label: "Enere",
			description: "Summen af alle terninger der viser 1",
		}, // "Sum of all dice showing a 1"
		twos: {
			label: "Toere",
			description: "Summen af alle terninger der viser 2",
		}, // "Sum of all dice showing a 2"
		threes: {
			label: "Treere",
			description: "Summen af alle terninger der viser 3",
		}, // "Sum of all dice showing a 3"
		fours: {
			label: "Firere",
			description: "Summen af alle terninger der viser 4",
		}, // "Sum of all dice showing a 4"
		fives: {
			label: "Femmere",
			description: "Summen af alle terninger der viser 5",
		}, // "Sum of all dice showing a 5"
		sixes: {
			label: "Seksere",
			description: "Summen af alle terninger der viser 6",
		}, // "Sum of all dice showing a 6"
		one_pair: {
			label: "1 Par",
			description: "To terninger der viser samme tal",
		}, // "Two dice showing the same face"
		two_pairs: {
			label: "2 Par",
			description: "To forskellige par af terninger der viser samme tal",
		}, // "Two different pairs of dice showing the same face"
		three_pairs: {
			label: "3 Par",
			description: "Tre forskellige par af terninger der viser samme tal",
		}, // "Three different pairs of dice showing the same face"
		four_pairs: {
			label: "4 Par",
			description: "Fire forskellige par af terninger der viser samme tal",
		}, // "Four different pairs of dice showing the same face"
		five_pairs: {
			label: "5 Par",
			description: "Fem forskellige par af terninger der viser samme tal",
		}, // "Five different pairs of dice showing the same face"
		six_pairs: {
			label: "6 Par",
			description: "Seks forskellige par af terninger der viser samme tal",
		}, // "Six different pairs of dice showing the same face"
		three_of_a_kind: {
			label: "3 Ens",
			description: "Tre terninger der viser samme tal",
		}, // "Three dice showing the same face"
		four_of_a_kind: {
			label: "4 Ens",
			description: "Fire terninger der viser samme tal",
		}, // "Four dice showing the same face"
		five_of_a_kind: {
			label: "5 Ens",
			description: "Fem terninger der viser samme tal",
		}, // "Five dice showing the same face"
		six_of_a_kind: {
			label: "6 Ens",
			description: "Seks terninger der viser samme tal",
		}, // "Six dice showing the same face"
		seven_of_a_kind: {
			label: "7 Ens",
			description: "Syv terninger der viser samme tal",
		}, // "Seven dice showing the same face"
		eight_of_a_kind: {
			label: "8 Ens",
			description: "Otte terninger der viser samme tal",
		}, // "Eight dice showing the same face"
		nine_of_a_kind: {
			label: "9 Ens",
			description: "Ni terninger der viser samme tal",
		}, // "Nine dice showing the same face"
		ten_of_a_kind: {
			label: "10 Ens",
			description: "Ti terninger der viser samme tal",
		}, // "Ten dice showing the same face"
		eleven_of_a_kind: {
			label: "11 Ens",
			description: "Elleve terninger der viser samme tal",
		}, // "Eleven dice showing the same face"
		two_by_three: {
			label: "2x3 Ens",
			description:
				"To separate grupper af tre terninger, der hver viser et forskelligt tal",
		}, // "Two separate groups of three dice, each showing a different face"
		two_by_four: {
			label: "2x4 Ens",
			description:
				"To separate grupper af fire terninger, der hver viser et forskelligt tal",
		}, // "Two separate groups of four dice, each showing a different face"
		two_by_five: {
			label: "2x5 Ens",
			description:
				"To separate grupper af fem terninger, der hver viser et forskelligt tal",
		}, // "Two separate groups of five dice, each showing a different face"
		two_by_six: {
			label: "2x6 Ens",
			description:
				"To separate grupper af seks terninger, der hver viser et forskelligt tal",
		}, // "Two separate groups of six dice, each showing a different face"
		three_by_three: {
			label: "3x3 Ens",
			description:
				"Tre separate grupper af tre terninger, der hver viser et forskelligt tal",
		}, // "Three separate groups of three dice, each showing a different face"
		three_by_four: {
			label: "3x4 Ens",
			description:
				"Tre separate grupper af fire terninger, der hver viser et forskelligt tal",
		}, // "Three separate groups of four dice, each showing a different face"
		low_straight: {
			label: "Lille Straight",
			description: "Sekvensen 1-2-3-4-5",
		}, // "A sequence of 1-2-3-4-5"
		high_straight: {
			label: "Stor Straight",
			description: "Sekvensen 2-3-4-5-6",
		}, // "A sequence of 2-3-4-5-6"
		royal_straight: {
			label: "Royal Straight",
			description: "Sekvensen 1-2-3-4-5-6",
		}, // "A sequence of 1-2-3-4-5-6"
		lille_claus: {
			label: "Lille Claus",
			description: "Sekvensen 1-2-3-4-5-6 + 2 ekstra seksere",
		}, // "A sequence of 1-2-3-4-5-6 with 2 extra sixes"
		store_claus: {
			label: "Store Claus",
			description: "Sekvensen 1-2-3-4-5-6 + 3 ekstra seksere",
		}, // "A sequence of 1-2-3-4-5-6 with 3 extra sixes"
		knold: {
			label: "Knold",
			description: "Sekvensen 1-2-3-4-5-6 + 4 ekstra seksere",
		}, // "A sequence of 1-2-3-4-5-6 with 4 extra sixes"
		tot: {
			label: "Tot",
			description: "Sekvensen 1-2-3-4-5-6 + 5 ekstra seksere",
		}, // "A sequence of 1-2-3-4-5-6 with 5 extra sixes"
		kaptajn_vom: {
			label: "Kaptajn Vom",
			description: "Sekvensen 1-2-3-4-5-6 + 6 ekstra seksere",
		}, // "A sequence of 1-2-3-4-5-6 with 6 extra sixes"
		house: { label: "Hus", description: "3 ens + et par" }, // "Three of a kind and a pair"
		poeten: { label: "Poeten", description: "4 ens + et par" }, // "Four of a kind and a pair"
		momsemor: { label: "Momsemor", description: "5 ens + et par" }, // "Five of a kind and a pair"
		skipperskraek: { label: "Skipperskræk", description: "6 ens + et par" }, // "Six of a kind and a pair"
		radiserne: { label: "Radiserne", description: "4 ens + 3 ens" }, // "Four of a kind and three of a kind"
		basserne: { label: "Basserne", description: "5 ens + 3 ens" }, // "Five of a kind and three of a kind"
		gyldenspjaet: { label: "Gyldenspjæt", description: "6 ens + 3 ens" }, // "Six of a kind and three of a kind"
		kasket_karl: { label: "Kasket Karl", description: "5 ens + 4 ens" }, // "Five of a kind and four of a kind"
		klaus_kludder: { label: "Klaus Kludder", description: "6 ens + 4 ens" }, // "Six of a kind and four of a kind"
		jens_lyn: { label: "Jens Lyn", description: "6 ens + 5 ens" }, // "Six of a kind and five of a kind"
		chance: { label: "Chance", description: "Summen af alle terninger" }, // "Sum of all dice"
		yatzy_5: {
			label: "Yatzy",
			description: "Alle 5 terninger viser samme tal",
		}, // "All 5 dice showing the same face"
		yatzy_6: {
			label: "Yatzy",
			description: "Alle 6 terninger viser samme tal",
		}, // "All 6 dice showing the same face"
		yatzy_12: {
			label: "Yatzy",
			description: "Alle 12 terninger viser samme tal",
		}, // "All 12 dice showing the same face"
	},
	gameModes: {
		normal: {
			name: "Yatzy",
			description: "Det klassiske spil - spillet med 5 terninger",
		}, // "The classic game, played with 5 dice"
		family: {
			name: "Familie-yatzy",
			description: "En større variant - spillet med 6 terninger",
		}, // "A bigger variant played with 6 dice"
		giant: {
			name: "Gigant-yatzy",
			description: "Den største variant - spillet med 12 terninger",
		}, // "The largest variant, played with 12 dice"
	},
};
