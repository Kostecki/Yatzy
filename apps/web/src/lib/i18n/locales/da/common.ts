import type { CommonMessages } from "../types";

// comments for reference so you don't need to flip files while translating.
export const common: CommonMessages = {
	shared: {
		appTitle: "Yatzy", // "Yatzy"
		sessionCode: "Pin:", // "Session code:"
		roundStatus: "Runde {{round}} af {{total}}", // "Round {{round}} of {{total}}"
	},
	createGame: {
		heading: "Nyt Spil", // "Create a game"
		subheading: "Vælg spiltype og tilføj spillere", // "Pick a mode and add your players."
		gameModeLabel: "Spiltype", // "Game mode"
		gameModePlaceholder: "Vælg en Yatzy-type", // "Choose a mode"
		playersLabel: "Spillere", // "Players"
		dragToReorder: "Træk for at omarrangere", // "Drag to reorder"
		playerNamePlaceholder: "Spillernavn", // "Player name"
		removePlayer: "Fjern spiller", // "Remove player"
		addPlayer: "Tilføj ny spiller", // "Add new player"
		submit: "Opret spil", // "Create game"
		joinHeading: "Deltag i spil", // "Join a game"
		joinSubheading: "Har du allerede en pinkode?", // "Already have a session code?"
		joinCodePlaceholder: "Pinkode", // "Session code"
		joinSubmit: "Deltag", // "Join"
	},
	host: {
		missingHostAccess:
			"Manglende værtadgang for denne session. Åbn denne side fra den enhed, der oprettede spillet.", // "Missing host access for this session. Open this page from the device that created the game."
		turn: "{{player}}s tur", // "{{player}}'s turn"
		gameFinished: "Spillet er slut", // "Game finished"
		finishGame: "Afslut Spil", // "Finish Game"
		invitePlayers: "Inviter spillere", // "Invite players"
		extraEyesBonus: "Bonus per øje inkluderet i scoren", // "Extra bonus per eye included in the score"
		strike: "Streg", // "Strike"
		score: "Score: {{value}}", // "Score: {{value}}"
		reset: "Nulstil", // "Reset"
		gotIt: "Godkend", // "Got it"
		submit: "Gem", // "Submit"
		addPlayerPlaceholder: "Spillernavn", // "Player name"
		addPlayerSubmit: "Tilføj spiller", // "Add player"
	},
	playerView: {
		yourTurn: "Din tur", // "Your turn"
		waitingFor: "Venter på {{player}}", // "Waiting for {{player}}"
	},
	view: {
		whoAreYou: "Hvem er du?", // "Who are you?"
	},
	scoreTable: {
		category: "Kategori", // "Category"
		sum: "Sum", // "Sum"
		bonus: "Bonus", // "Bonus"
		total: "Total", // "Total"
		showTotals: "Vis total", // "Show totals"
		hideTotals: "Gem total", // "Hide totals"
		save: "Gem", // "Save"
		remove: "Fjern", // "Remove"
	},
	inviteQr: {
		showQr: "Vis QR-kode", // "Show invite QR code"
		instructions:
			"Scan for at deltage, eller gå til {{host}} og indtast koden.", // "Scan to join, or go to {{host}} and enter the code."
	},
};
