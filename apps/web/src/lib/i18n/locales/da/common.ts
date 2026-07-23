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
		joinSubheading: "Indtast pinkoden og deltag i spillet", // "Enter the session code to join the game"
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
	standings: {
		diceDistribution: "Terningfordeling", // "Dice distribution"
		diceDistributionSubheading:
			"Hvor ofte hvert øje-antal er kommet op i de terninger, der blev brugt til at score dette spil", // "How often each face came up in the dice used to score this game"
		diceDistributionSeriesLabel: "Gange vist", // "Times shown"
		diceDistributionAxisLabel: "Øjne", // "Face"
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
	stats: {
		heading: "Statistik & tendenser", // "Stats & Trends"
		subheading: "Sjove tal fra alle afsluttede spil", // "Fun numbers gatherede from every finished game"
		noData:
			"Ingen afsluttede spil endnu — statistikken vises her, når et par spil er færdige.", // "No finished games yet — stats will show up here once a game or two wraps up."
		noDataForMode: "Ingen afsluttede spil for denne spiltype endnu.", // "No finished games for this mode yet."
		allModes: "Alle spiltyper", // "All modes"
		navLabel: "Statistik", // "Stats"
		overviewGames: "Spillede spil", // "Games played"
		overviewRolls: "Registrerede terningresultater", // "Dice results recorded"
		overviewBonusYatzyRate: "Bonus- & Yatzy-rate", // "Bonus & Yatzy rate"
		overviewAvgDuration: "Gns. spilletid", // "Avg. game length"
		overviewHighestScore: "Højeste score", // "Highest score"
		overviewLowestScore: "Laveste score", // "Lowest score"
		overviewLongestGame: "Længste spil", // "Longest game"
		overviewShortestGame: "Korteste spil", // "Shortest game"
		overviewTotalPlaytime: "Samlet spilletid", // "Total playtime"
		diceFrequencyHeading: "Terningfordeling", // "Dice distribution"
		diceFrequencySubheading:
			"Hvor ofte hvert øje-antal er kommet op i de terninger, der blev scoret med", // "How often each face has come up in the dice each category was scored with"
		diceFrequencySeriesLabel: "Gange vist", // "Times shown"
		diceFrequencyAxisLabel: "Øjne", // "Face"
		scoreDistributionHeading: "Scorefordeling", // "Score distribution"
		scoreDistributionSubheading:
			"Alle spilleres endelige total, på tværs af alle afsluttede spil", // "Every player's final total, across all finished games"
		scoreDistributionSeriesLabel: "Spillerresultater", // "Player games"
		scoreDistributionAxisLabel: "Samlet score", // "Total score"
		categoryStatsHeading: "Kategorisværhedsgrad", // "Category difficulty"
		categoryStatsSubheading: "Gennemsnitlig score og stregrate pr. kategori", // "Average score and scratch rate per category"
		categoryColumn: "Kategori", // "Category"
		attemptsColumn: "Forsøg", // "Attempts"
		averageColumn: "Gennemsnit", // "Average"
		scratchRateColumn: "Stregrate", // "Scratch rate"
		maxColumn: "Bedste", // "Best"
		leaderboardHeading: "Resultattavle", // "Leaderboard"
		leaderboardSubheading: "Rangeret efter gennemsnitlig total", // "Ranked by average total score"
		playerColumn: "Spiller", // "Player"
		gamesColumn: "Spil", // "Games"
		winsColumn: "Sejre", // "Wins"
		winRateColumn: "Sejrsrate", // "Win rate"
		avgTotalColumn: "Gns. total", // "Avg. total"
		bestTotalColumn: "Bedste total", // "Best total"
		turnOrderHeading: "Rækkefølgens betydning", // "Turn order advantage"
		turnOrderSubheading:
			"Sejrsrate og gennemsnitlig placering ud fra tur-rækkefølgen", // "Win rate and average finishing rank by seat position"
		turnColumn: "Tur", // "Turn"
		avgRankColumn: "Gns. placering", // "Avg. rank"
		radarHeading: "Spillestil-sammenligning", // "Playstyle comparison"
		radarSubheading:
			"Gennemsnitlig score pr. kategori — jo mørkere, jo stærkere i forhold til de andre spillere i rækken", // "Average score per category — darker means stronger relative to the other players in that row"
		gamesOverTimeHeading: "Spil over tid", // "Games over time"
		gamesOverTimeSubheading: "Afsluttede spil pr. dag", // "Finished games per day"
		gamesOverTimeSeriesLabel: "Afsluttede spil", // "Games finished"
		tableViewToggle: "Tabelvisning", // "Table view"
	},
};
