import type { ContentMessages } from "../types";

// Descriptions below are copied straight from the DB seed data (already
// English) — see apps/server/src/db/categories.ts and game-modes.ts. Labels
// are left blank (Danish source shown as a comment) — per your call: keep
// the Danish proper name where there's no real English equivalent, use the
// standard international Yahtzee term where one exists (e.g. "house" -> "Full House").
export const content: ContentMessages = {
	categories: {
		ones: { label: "Ones", description: "Sum of all dice showing a 1" }, // da: "Enere"
		twos: { label: "Twos", description: "Sum of all dice showing a 2" }, // da: "Toere"
		threes: { label: "Threes", description: "Sum of all dice showing a 3" }, // da: "Treere"
		fours: { label: "Fours", description: "Sum of all dice showing a 4" }, // da: "Firere"
		fives: { label: "Fives", description: "Sum of all dice showing a 5" }, // da: "Femmere"
		sixes: { label: "Sixes", description: "Sum of all dice showing a 6" }, // da: "Seksere"
		one_pair: {
			label: "One Pair",
			description: "Two dice showing the same face",
		}, // da: "1 Par"
		two_pairs: {
			label: "Two Pairs",
			description: "Two different pairs of dice showing the same face",
		}, // da: "2 Par"
		three_pairs: {
			label: "Three Pairs",
			description: "Three different pairs of dice showing the same face",
		}, // da: "3 Par"
		four_pairs: {
			label: "Four Pairs",
			description: "Four different pairs of dice showing the same face",
		}, // da: "4 Par"
		five_pairs: {
			label: "Five Pairs",
			description: "Five different pairs of dice showing the same face",
		}, // da: "5 Par"
		six_pairs: {
			label: "Six Pairs",
			description: "Six different pairs of dice showing the same face",
		}, // da: "6 Par"
		three_of_a_kind: {
			label: "Three of a Kind",
			description: "Three dice showing the same face",
		}, // da: "3 Ens"
		four_of_a_kind: {
			label: "Four of a Kind",
			description: "Four dice showing the same face",
		}, // da: "4 Ens"
		five_of_a_kind: {
			label: "Five of a Kind",
			description: "Five dice showing the same face",
		}, // da: "5 Ens"
		six_of_a_kind: {
			label: "Six of a Kind",
			description: "Six dice showing the same face",
		}, // da: "6 Ens"
		seven_of_a_kind: {
			label: "Seven of a Kind",
			description: "Seven dice showing the same face",
		}, // da: "7 Ens"
		eight_of_a_kind: {
			label: "Eight of a Kind",
			description: "Eight dice showing the same face",
		}, // da: "8 Ens"
		nine_of_a_kind: {
			label: "Nine of a Kind",
			description: "Nine dice showing the same face",
		}, // da: "9 Ens"
		ten_of_a_kind: {
			label: "Ten of a Kind",
			description: "Ten dice showing the same face",
		}, // da: "10 Ens"
		eleven_of_a_kind: {
			label: "Eleven of a Kind",
			description: "Eleven dice showing the same face",
		}, // da: "11 Ens"
		two_by_three: {
			label: "Two by Three",
			description:
				"Two separate groups of three dice, each showing a different face",
		}, // da: "2x3 Ens"
		two_by_four: {
			label: "Two by Four",
			description:
				"Two separate groups of four dice, each showing a different face",
		}, // da: "2x4 Ens"
		two_by_five: {
			label: "Two by Five",
			description:
				"Two separate groups of five dice, each showing a different face",
		}, // da: "2x5 Ens"
		two_by_six: {
			label: "Two by Six",
			description:
				"Two separate groups of six dice, each showing a different face",
		}, // da: "2x6 Ens"
		three_by_three: {
			label: "Three by Three",
			description:
				"Three separate groups of three dice, each showing a different face",
		}, // da: "3x3 Ens"
		three_by_four: {
			label: "Three by Four",
			description:
				"Three separate groups of four dice, each showing a different face",
		}, // da: "3x4 Ens"
		low_straight: {
			label: "Low Straight",
			description: "A sequence of 1-2-3-4-5",
		}, // da: "Lille Straight"
		high_straight: {
			label: "High Straight",
			description: "A sequence of 2-3-4-5-6",
		}, // da: "Stor Straight"
		royal_straight: {
			label: "Royal Straight",
			description: "A sequence of 1-2-3-4-5-6",
		}, // da: "Royal Straight"
		lille_claus: {
			label: "Lille Claus",
			description: "A sequence of 1-2-3-4-5-6 with 2 extra sixes",
		}, // da: "Lille Claus"
		store_claus: {
			label: "Store Claus",
			description: "A sequence of 1-2-3-4-5-6 with 3 extra sixes",
		}, // da: "Store Claus"
		knold: {
			label: "Knold",
			description: "A sequence of 1-2-3-4-5-6 with 4 extra sixes",
		}, // da: "Knold"
		tot: {
			label: "Tot",
			description: "A sequence of 1-2-3-4-5-6 with 5 extra sixes",
		}, // da: "Tot"
		kaptajn_vom: {
			label: "Kaptajn Vom",
			description: "A sequence of 1-2-3-4-5-6 with 6 extra sixes",
		}, // da: "Kaptajn Vom"
		house: { label: "Full House", description: "Three of a kind and a pair" }, // da: "Hus" — international name: "Full House"
		poeten: { label: "Poeten", description: "Four of a kind and a pair" }, // da: "Poeten"
		momsemor: { label: "Momsemor", description: "Five of a kind and a pair" }, // da: "Momsemor"
		skipperskraek: {
			label: "Skipperskræk",
			description: "Six of a kind and a pair",
		}, // da: "Skipperskræk"
		radiserne: {
			label: "Radiserne",
			description: "Four of a kind and three of a kind",
		}, // da: "Radiserne"
		basserne: {
			label: "Basserne",
			description: "Five of a kind and three of a kind",
		}, // da: "Basserne"
		gyldenspjaet: {
			label: "Gyldenspjæt",
			description: "Six of a kind and three of a kind",
		}, // da: "Gyldenspjæt"
		kasket_karl: {
			label: "Kasket Karl",
			description: "Five of a kind and four of a kind",
		}, // da: "Kasket Karl"
		klaus_kludder: {
			label: "Klaus Kludder",
			description: "Six of a kind and four of a kind",
		}, // da: "Klaus Kludder"
		jens_lyn: {
			label: "Jens Lyn",
			description: "Six of a kind and five of a kind",
		}, // da: "Jens Lyn"
		chance: { label: "Chance", description: "Sum of all dice" }, // da: "Chance"
		yatzy_5: {
			label: "Yatzy",
			description: "All 5 dice showing the same face",
		}, // da: "Yatzy"
		yatzy_6: {
			label: "Yatzy",
			description: "All 6 dice showing the same face",
		}, // da: "Yatzy"
		yatzy_12: {
			label: "Yatzy",
			description: "All 12 dice showing the same face",
		}, // da: "Yatzy"
	},
	gameModes: {
		normal: {
			name: "Yatzy",
			description: "The classic game, played with 5 dice",
		}, // da: "Yatzy"
		family: {
			name: "Family Yatzy",
			description: "A bigger variant played with 6 dice",
		}, // da: "Familie-yatzy"
		giant: {
			name: "Giant Yatzy",
			description: "The largest variant, played with 12 dice",
		}, // da: "Gigant-yatzy"
	},
};
