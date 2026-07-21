import type { CommonMessages } from "../types";

// comments for reference so you don't need to flip files while translating.
export const common: CommonMessages = {
	shared: {
		appTitle: "Yatzy", // "Yatzy"
		roundStatus: "Runde {{round}} af {{total}}", // "Round {{round}} of {{total}}"
		sessionCode: "Pin:", // "Session code:"
	},
	createGame: {
		addPlayer: "Tilføj ny spiller", // "Add new player"
		continueAsHost: "Fortsæt som vært", // "Continue as host"
		continueAsPlayer: "Fortsæt som spiller", // "Continue as player"
		continueHeading: "Igangværende spil", // "Remembered sessions"
		continueSubheading: "Vælg et spil for at fortsætte som vært", // "Pick a session to continue where you left off"
		dragToReorder: "Træk for at omarrangere", // "Drag to reorder"
		gameModeLabel: "Spiltype", // "Game mode"
		gameModePlaceholder: "Vælg en Yatzy-type", // "Choose a mode"
		heading: "Nyt spil", // "Create a game"
		historyHeading: "Tidligere spil", // "Game history"
		historySubheading: "Se resultaterne for tidligere spil", // "View the results of previous games"
		joinCodePlaceholder: "Pinkode", // "Session code"
		joinHeading: "Deltag i spil", // "Join a game"
		joinSubheading: "Har du allerede en pinkode?", // "Already have a session code?"
		joinSubmit: "Deltag", // "Join"
		playerCount_one: "{{count}} spiller", // "{{count}} player"
		playerCount_other: "{{count}} spillere", // "{{count}} players"
		playerNamePlaceholder: "Spillernavn", // "Player name"
		playersLabel: "Spillere", // "Players"
		removePlayer: "Fjern spiller", // "Remove player"
		subheading: "Vælg spiltype og tilføj spillere", // "Pick a mode and add your players."
		submit: "Opret spil", // "Create game"
	},
	host: {
		addPlayerPlaceholder: "Spillernavn", // "Player name"
		addPlayerSubmit: "Tilføj spiller", // "Add player"
		extraEyesBonus: "Bonus per øje inkluderet i scoren", // "Extra bonus per eye included in the score"
		finishGame: "Afslut Spil", // "Finish Game"
		gameFinished: "Spillet er slut", // "Game finished"
		gotIt: "Godkend", // "Got it"
		missingHostAccess:
			"Manglende værtadgang for denne session. Åbn denne side fra den enhed, der oprettede spillet.", // "Missing host access for this session. Open this page from the device that created the game."
		offTurnWarning: "Bemærk: det er {{player}}s tur", // It's {{players}}'s turn
		reset: "Nulstil", // "Reset"
		score: "Score: {{value}}", // "Score: {{value}}"
		strike: "Streg", // "Strike"
		submit: "Gem", // "Submit"
		turn: "{{player}}s tur", // "{{player}}'s turn"
	},
	playerView: {
		becomeHost: "Bliv vært", // "Become host"
		becomeHostConfirm: "Er du sikker på, at du vil være vært?", // "Are you sure you want to become the host?"
		becomeHostSubmit: "Bliv vært", // "Become host"
		waitingFor: "Venter på {{player}}", // "Waiting for {{player}}"
		yourTurn: "Din tur", // "Your turn"
	},
	view: {
		whoAreYou: "Hvem er du?", // "Who are you?"
	},
	scoreTable: {
		bonus: "Bonus", // "Bonus"
		category: "Kategori", // "Category"
		hideTotals: "Gem total", // "Hide totals"
		remove: "Fjern", // "Remove"
		save: "Gem", // "Save"
		showTotals: "Vis total", // "Show totals"
		sum: "Sum", // "Sum"
		total: "Total", // "Total"
	},
	inviteQr: {
		instructions:
			"Scan for at deltage, eller gå til {{host}} og indtast koden.", // "Scan to join, or go to {{host}} and enter the code."
		showQr: "Vis QR-kode", // "Show invite QR code"
	},
};
