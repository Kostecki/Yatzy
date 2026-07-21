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
}

export interface ContentMessages {
	categories: Record<CategoryId, { label: string; description: string }>;
	gameModes: Record<GameModeId, { name: string; description: string }>;
}
