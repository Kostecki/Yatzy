import { BarChart, LineChart } from "@mantine/charts";
import {
	Box,
	Card,
	Loader,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { trpc } from "$lib/api/trpc";
import { formatDuration } from "$lib/formatDuration";
import {
	bonusAchievementRate,
	bucketize,
	categoryAveragesByPlayer,
	categoryStats,
	diceFaceFrequency,
	type GameModesById,
	gamesOverTime,
	overview,
	playerLeaderboard,
	scoreDistribution,
	scoreExtremes,
	turnOrderAdvantage,
	yatzyHitRate,
} from "$lib/stats";

// Shades a cell by where its value falls within its row's min-max range,
// using Mantine's own blue ramp so it stays theme-aware in both color
// schemes without hardcoding hex values or a separate contrast check.
function heatCellStyle(
	value: number | undefined,
	min: number,
	max: number,
): CSSProperties {
	if (value === undefined) return {};
	const ratio = max > min ? (value - min) / (max - min) : 0.5;
	const alpha = Math.round((0.12 + ratio * 0.43) * 100);
	return {
		backgroundColor: `color-mix(in srgb, var(--mantine-color-blue-6) ${alpha}%, transparent)`,
	};
}

function StatTile({ label, value }: { label: string; value: string | number }) {
	return (
		<Card withBorder radius="md" p="md">
			<Stack gap={2} align="center">
				<Text size="xl" fw={700}>
					{value}
				</Text>
				<Text size="xs" c="dimmed" ta="center">
					{label}
				</Text>
			</Stack>
		</Card>
	);
}

function ChartCard({
	heading,
	subheading,
	children,
}: {
	heading: string;
	subheading: string;
	children: ReactNode;
}) {
	return (
		<Card withBorder radius="md" p="lg" w="100%">
			<Stack gap="md">
				<Box>
					<Title order={3}>{heading}</Title>
					<Text c="dimmed" size="sm">
						{subheading}
					</Text>
				</Box>
				{children}
			</Stack>
		</Card>
	);
}

export default function Stats() {
	const { t } = useTranslation();
	const { t: tc } = useTranslation("content");
	// Game modes differ hugely (5 vs 6 vs 12 dice, very different category
	// sets, very different game length), so combining them averages apples
	// with oranges - even a shared category like "Ones" caps out differently
	// per mode. Default to "all" for a quick overview, but let the user pick
	// one mode for an apples-to-apples view.
	const [selectedModeId, setSelectedModeId] = useState<string>("all");

	const finishedGames = trpc.session.listFinished.useQuery();
	const gameModes = trpc.catalog.listGameModes.useQuery();

	if (finishedGames.isLoading || gameModes.isLoading) {
		return <Loader size="sm" color="gray" />;
	}

	const allSessions = finishedGames.data ?? [];
	const gameModesById: GameModesById = Object.fromEntries(
		(gameModes.data ?? []).map((gameMode) => [gameMode.id, gameMode]),
	);

	if (allSessions.length === 0) {
		return (
			<Stack align="center" gap="md" maw={480}>
				<Title order={1} tt="uppercase">
					{t("shared.appTitle")}
				</Title>
				<Text c="dimmed" ta="center">
					{t("stats.noData")}
				</Text>
			</Stack>
		);
	}

	const sessions =
		selectedModeId === "all"
			? allSessions
			: allSessions.filter((s) => s.gameModeId === selectedModeId);

	const modeOptions = [
		{ value: "all", label: t("stats.allModes") },
		...(gameModes.data ?? []).map((gameMode) => ({
			value: gameMode.id,
			label: tc(`gameModes.${gameMode.id}.name`),
		})),
	];
	const modeFilter = (
		<SegmentedControl
			value={selectedModeId}
			onChange={setSelectedModeId}
			data={modeOptions}
			size="xs"
			mt="sm"
		/>
	);

	if (sessions.length === 0) {
		return (
			<Stack align="center" gap="md" maw={480}>
				<Title order={1} tt="uppercase">
					{t("shared.appTitle")}
				</Title>
				{modeFilter}
				<Text c="dimmed" ta="center">
					{t("stats.noDataForMode")}
				</Text>
			</Stack>
		);
	}

	const summary = overview(sessions);
	const dice = diceFaceFrequency(sessions);
	const totals = scoreDistribution(sessions, gameModesById);
	const histogram = bucketize(
		totals.map((playerGame) => playerGame.total),
		20,
	);
	const categories = [...categoryStats(sessions)].sort(
		(a, b) => a.average - b.average,
	);
	const extremes = scoreExtremes(totals);
	const yatzy = yatzyHitRate(sessions);
	const bonusRates = bonusAchievementRate(sessions, gameModesById);
	const overallBonusRate = bonusRates.find((r) => r.gameModeId === "overall");
	const leaderboard = playerLeaderboard(sessions, gameModesById);
	const turnOrder = turnOrderAdvantage(sessions, gameModesById);
	const trend = gamesOverTime(sessions);
	const playerAverages = categoryAveragesByPlayer(sessions);

	// A category x player heatmap table, rather than a chart per category or
	// one combined chart - this is the form that scales to both directions
	// that break other layouts: many more categories (Giant Yatzy has far more
	// lower-section categories than Normal/Family) becomes more table rows,
	// and many more players becomes more (horizontally scrollable) columns.
	// Lower-section categories differ a lot between game modes, so merging
	// every mode's categories would leave most rows empty for most players -
	// only keep a row where at least two players actually have a real average
	// to compare.
	const comparisonPlayers = leaderboard.map((p) => p.name);
	const lowerCategoryIds = new Set(
		categories.filter((c) => c.section === "lower").map((c) => c.categoryId),
	);
	const comparisonRows = Array.from(lowerCategoryIds)
		.filter(
			(categoryId) =>
				comparisonPlayers.filter(
					(name) => playerAverages[name]?.[categoryId] !== undefined,
				).length >= 2,
		)
		.map((categoryId) => {
			const valuesByPlayer = Object.fromEntries(
				comparisonPlayers.map((name) => [
					name,
					playerAverages[name]?.[categoryId],
				]),
			);
			const values = Object.values(valuesByPlayer).filter(
				(v): v is number => v !== undefined,
			);
			return {
				categoryId,
				label: tc(`categories.${categoryId}.label`),
				min: Math.min(...values),
				max: Math.max(...values),
				valuesByPlayer,
			};
		});

	return (
		<Stack w="100%" maw={900} gap="lg">
			<Stack gap={4} align="center">
				<Title order={1} tt="uppercase">
					{t("shared.appTitle")}
				</Title>
				<Title order={2}>{t("stats.heading")}</Title>
				<Text c="dimmed" size="sm">
					{t("stats.subheading")}
				</Text>
				{modeFilter}
			</Stack>

			<SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
				<StatTile label={t("stats.overviewGames")} value={summary.totalGames} />
				<StatTile
					label={t("stats.overviewBonusYatzyRate")}
					value={`${
						overallBonusRate
							? `${Math.round(overallBonusRate.rate * 100)}%`
							: "—"
					} · ${yatzy.attempts > 0 ? `${Math.round(yatzy.rate * 100)}%` : "—"}`}
				/>
				<StatTile
					label={t("stats.overviewHighestScore")}
					value={
						extremes.highest
							? `${extremes.highest.total} (${extremes.highest.playerName})`
							: "—"
					}
				/>
				<StatTile
					label={t("stats.overviewLowestScore")}
					value={
						extremes.lowest
							? `${extremes.lowest.total} (${extremes.lowest.playerName})`
							: "—"
					}
				/>
				<StatTile
					label={t("stats.overviewAvgDuration")}
					value={
						summary.avgDurationMs !== undefined
							? formatDuration(summary.avgDurationMs)
							: "—"
					}
				/>
				<StatTile
					label={t("stats.overviewLongestGame")}
					value={
						summary.longestDurationMs !== undefined
							? formatDuration(summary.longestDurationMs)
							: "—"
					}
				/>
				<StatTile
					label={t("stats.overviewShortestGame")}
					value={
						summary.shortestDurationMs !== undefined
							? formatDuration(summary.shortestDurationMs)
							: "—"
					}
				/>
				<StatTile
					label={t("stats.overviewTotalPlaytime")}
					value={
						summary.totalDurationMs !== undefined
							? formatDuration(summary.totalDurationMs)
							: "—"
					}
				/>
			</SimpleGrid>

			<ChartCard
				heading={t("stats.diceFrequencyHeading")}
				subheading={t("stats.diceFrequencySubheading")}
			>
				<BarChart
					h={220}
					data={dice.overall.map((f) => ({
						face: String(f.face),
						count: f.count,
					}))}
					dataKey="face"
					series={[
						{
							name: "count",
							color: "blue.6",
							label: t("stats.diceFrequencySeriesLabel"),
						},
					]}
					xAxisLabel={t("stats.diceFrequencyAxisLabel")}
					withLegend={false}
				/>
			</ChartCard>

			<ChartCard
				heading={t("stats.scoreDistributionHeading")}
				subheading={t("stats.scoreDistributionSubheading")}
			>
				<BarChart
					h={220}
					data={histogram}
					dataKey="label"
					series={[
						{
							name: "count",
							color: "orange.6",
							label: t("stats.scoreDistributionSeriesLabel"),
						},
					]}
					xAxisLabel={t("stats.scoreDistributionAxisLabel")}
					withLegend={false}
				/>
			</ChartCard>

			<ChartCard
				heading={t("stats.categoryStatsHeading")}
				subheading={t("stats.categoryStatsSubheading")}
			>
				<Table.ScrollContainer minWidth={480}>
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>{t("stats.categoryColumn")}</Table.Th>
								<Table.Th>{t("stats.attemptsColumn")}</Table.Th>
								<Table.Th>{t("stats.averageColumn")}</Table.Th>
								<Table.Th>{t("stats.scratchRateColumn")}</Table.Th>
								<Table.Th>{t("stats.maxColumn")}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{categories.map((category) => (
								<Table.Tr key={category.categoryId}>
									<Table.Td>
										{tc(`categories.${category.categoryId}.label`)}
									</Table.Td>
									<Table.Td>{category.attempts}</Table.Td>
									<Table.Td>{category.average.toFixed(1)}</Table.Td>
									<Table.Td>{Math.round(category.scratchRate * 100)}%</Table.Td>
									<Table.Td>{category.max}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</ChartCard>

			<ChartCard
				heading={t("stats.leaderboardHeading")}
				subheading={t("stats.leaderboardSubheading")}
			>
				<Table.ScrollContainer minWidth={480}>
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>{t("stats.playerColumn")}</Table.Th>
								<Table.Th>{t("stats.gamesColumn")}</Table.Th>
								<Table.Th>{t("stats.winsColumn")}</Table.Th>
								<Table.Th>{t("stats.winRateColumn")}</Table.Th>
								<Table.Th>{t("stats.avgTotalColumn")}</Table.Th>
								<Table.Th>{t("stats.bestTotalColumn")}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{leaderboard.map((player) => (
								<Table.Tr key={player.name}>
									<Table.Td>{player.name}</Table.Td>
									<Table.Td>{player.gamesPlayed}</Table.Td>
									<Table.Td>{player.wins}</Table.Td>
									<Table.Td>{Math.round(player.winRate * 100)}%</Table.Td>
									<Table.Td>{player.avgTotal.toFixed(1)}</Table.Td>
									<Table.Td>{player.bestTotal}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</ChartCard>

			{turnOrder.length >= 2 && (
				<ChartCard
					heading={t("stats.turnOrderHeading")}
					subheading={t("stats.turnOrderSubheading")}
				>
					<Table.ScrollContainer minWidth={360}>
						<Table striped highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>{t("stats.turnColumn")}</Table.Th>
									<Table.Th>{t("stats.gamesColumn")}</Table.Th>
									<Table.Th>{t("stats.winRateColumn")}</Table.Th>
									<Table.Th>{t("stats.avgRankColumn")}</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{turnOrder.map((seat) => (
									<Table.Tr key={seat.orderIndex}>
										<Table.Td>{seat.orderIndex + 1}</Table.Td>
										<Table.Td>{seat.gamesPlayed}</Table.Td>
										<Table.Td>{Math.round(seat.winRate * 100)}%</Table.Td>
										<Table.Td>{seat.avgRank.toFixed(1)}</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				</ChartCard>
			)}

			{comparisonPlayers.length >= 2 && comparisonRows.length > 0 && (
				<ChartCard
					heading={t("stats.radarHeading")}
					subheading={t("stats.radarSubheading")}
				>
					<Table.ScrollContainer minWidth={480}>
						<Table withColumnBorders>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>{t("stats.categoryColumn")}</Table.Th>
									{comparisonPlayers.map((name) => (
										<Table.Th key={name}>{name}</Table.Th>
									))}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{comparisonRows.map((row) => (
									<Table.Tr key={row.categoryId}>
										<Table.Td>{row.label}</Table.Td>
										{comparisonPlayers.map((name) => {
											const value = row.valuesByPlayer[name];
											return (
												<Table.Td
													key={name}
													style={heatCellStyle(value, row.min, row.max)}
												>
													{value !== undefined ? value.toFixed(1) : "-"}
												</Table.Td>
											);
										})}
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				</ChartCard>
			)}

			{trend.length >= 2 && (
				<ChartCard
					heading={t("stats.gamesOverTimeHeading")}
					subheading={t("stats.gamesOverTimeSubheading")}
				>
					<LineChart
						h={220}
						data={trend}
						dataKey="date"
						series={[
							{
								name: "count",
								color: "teal.6",
								label: t("stats.gamesOverTimeSeriesLabel"),
							},
						]}
						withLegend={false}
					/>
				</ChartCard>
			)}
		</Stack>
	);
}
