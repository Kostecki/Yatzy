import type { categoriesData } from "server/src/db/categories";
import type { gameModesData } from "server/src/db/game-modes";

type CategoryId = (typeof categoriesData)[number]["id"];
type GameModeId = (typeof gameModesData)[number]["id"];

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "common";
		resources: {
			common: CommonMessages;
			content: ContentMessages;
		};
	}
}

export interface CommonMessages {
	shared: {
		appTitle: string;
		roundStatus: string;
		sessionCode: string;
	};
	createGame: {
		addPlayer: string;
		continueAsHost: string;
		continueAsPlayer: string;
		continueHeading: string;
		continueSubheading: string;
		dragToReorder: string;
		gameModeLabel: string;
		gameModePlaceholder: string;
		heading: string;
		historyHeading: string;
		historySubheading: string;
		joinCodePlaceholder: string;
		joinHeading: string;
		joinSubheading: string;
		joinSubmit: string;
		playerCount_one: string;
		playerCount_other: string;
		playerNamePlaceholder: string;
		playersLabel: string;
		removePlayer: string;
		subheading: string;
		submit: string;
	};
	host: {
		addPlayerPlaceholder: string;
		addPlayerSubmit: string;
		extraEyesBonus: string;
		finishGame: string;
		gameFinished: string;
		gotIt: string;
		missingHostAccess: string;
		offTurnWarning: string;
		reset: string;
		score: string;
		strike: string;
		submit: string;
		turn: string;
	};
	playerView: {
		becomeHost: string;
		becomeHostConfirm: string;
		becomeHostSubmit: string;
		waitingFor: string;
		yourTurn: string;
	};
	view: {
		whoAreYou: string;
	};
	standings: {
		diceDistribution: string;
		diceDistributionSubheading: string;
		diceDistributionSeriesLabel: string;
		diceDistributionAxisLabel: string;
	};
	scoreTable: {
		bonus: string;
		category: string;
		hideTotals: string;
		remove: string;
		save: string;
		showTotals: string;
		sum: string;
		total: string;
	};
	inviteQr: {
		instructions: string;
		showQr: string;
	};
	stats: {
		heading: string;
		subheading: string;
		noData: string;
		noDataForMode: string;
		allModes: string;
		navLabel: string;
		overviewGames: string;
		overviewRolls: string;
		overviewBonusYatzyRate: string;
		overviewAvgDuration: string;
		overviewHighestScore: string;
		overviewLowestScore: string;
		overviewLongestGame: string;
		overviewShortestGame: string;
		overviewTotalPlaytime: string;
		diceFrequencyHeading: string;
		diceFrequencySubheading: string;
		diceFrequencySeriesLabel: string;
		diceFrequencyAxisLabel: string;
		scoreDistributionHeading: string;
		scoreDistributionSubheading: string;
		scoreDistributionSeriesLabel: string;
		scoreDistributionAxisLabel: string;
		categoryStatsHeading: string;
		categoryStatsSubheading: string;
		categoryColumn: string;
		attemptsColumn: string;
		averageColumn: string;
		scratchRateColumn: string;
		maxColumn: string;
		leaderboardHeading: string;
		leaderboardSubheading: string;
		playerColumn: string;
		gamesColumn: string;
		winsColumn: string;
		winRateColumn: string;
		avgTotalColumn: string;
		bestTotalColumn: string;
		turnOrderHeading: string;
		turnOrderSubheading: string;
		turnColumn: string;
		avgRankColumn: string;
		radarHeading: string;
		radarSubheading: string;
		gamesOverTimeHeading: string;
		gamesOverTimeSubheading: string;
		gamesOverTimeSeriesLabel: string;
		tableViewToggle: string;
	};
}

export interface ContentMessages {
	categories: Record<CategoryId, { label: string; description: string }>;
	gameModes: Record<GameModeId, { name: string; description: string }>;
}
