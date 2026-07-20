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
		sessionCode: string;
		roundStatus: string;
	};
	createGame: {
		heading: string;
		subheading: string;
		gameModeLabel: string;
		gameModePlaceholder: string;
		playersLabel: string;
		dragToReorder: string;
		playerNamePlaceholder: string;
		removePlayer: string;
		addPlayer: string;
		submit: string;
		joinHeading: string;
		joinSubheading: string;
		joinCodePlaceholder: string;
		joinSubmit: string;
	};
	host: {
		missingHostAccess: string;
		turn: string;
		gameFinished: string;
		finishGame: string;
		invitePlayers: string;
		extraEyesBonus: string;
		strike: string;
		score: string;
		reset: string;
		gotIt: string;
		submit: string;
		addPlayerPlaceholder: string;
		addPlayerSubmit: string;
	};
	playerView: {
		yourTurn: string;
		waitingFor: string;
	};
	view: {
		whoAreYou: string;
	};
	scoreTable: {
		category: string;
		sum: string;
		bonus: string;
		total: string;
		showTotals: string;
		hideTotals: string;
		save: string;
		remove: string;
	};
	inviteQr: {
		showQr: string;
		instructions: string;
	};
}

export interface ContentMessages {
	categories: Record<CategoryId, { label: string; description: string }>;
	gameModes: Record<GameModeId, { name: string; description: string }>;
}
