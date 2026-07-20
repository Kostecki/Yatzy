import type { CommonMessages } from "../types";

export const common: CommonMessages = {
	shared: {
		appTitle: "Yatzy",
		sessionCode: "Session code:",
		roundStatus: "Round {{round}} of {{total}}",
	},
	createGame: {
		heading: "Create a game",
		subheading: "Pick a mode and add your players.",
		gameModeLabel: "Game mode",
		gameModePlaceholder: "Choose a mode",
		playersLabel: "Players",
		dragToReorder: "Drag to reorder",
		playerNamePlaceholder: "Player name",
		removePlayer: "Remove player",
		addPlayer: "Add new player",
		submit: "Create game",
		joinHeading: "Join a game",
		joinSubheading: "Already have a session code?",
		joinCodePlaceholder: "Session code",
		joinSubmit: "Join",
	},
	host: {
		missingHostAccess:
			"Missing host access for this session. Open this page from the device that created the game.",
		turn: "{{player}}'s turn",
		gameFinished: "Game finished",
		finishGame: "Finish Game",
		invitePlayers: "Invite players",
		extraEyesBonus: "Extra bonus per eye included in the score",
		strike: "Strike",
		score: "Score: {{value}}",
		reset: "Reset",
		gotIt: "Got it",
		submit: "Submit",
		addPlayerPlaceholder: "Player name",
		addPlayerSubmit: "Add player",
	},
	playerView: {
		yourTurn: "Your turn",
		waitingFor: "Waiting for {{player}}",
	},
	view: {
		whoAreYou: "Who are you?",
	},
	scoreTable: {
		category: "Category",
		sum: "Sum",
		bonus: "Bonus",
		total: "Total",
		showTotals: "Show totals",
		hideTotals: "Hide totals",
		save: "Save",
		remove: "Remove",
	},
	inviteQr: {
		showQr: "Show invite QR code",
		instructions: "Scan to join, or go to {{host}} and enter the code.",
	},
};
