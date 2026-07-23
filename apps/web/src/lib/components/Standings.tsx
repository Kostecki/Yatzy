import { BarChart } from "@mantine/charts";
import { Box, Card, Divider, Group, Stack, Text } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { GameMode, SessionState } from "$lib/api/useSessionState";
import { formatDuration } from "$lib/formatDuration";
import { type RankedPlayer, rankPlayers } from "$lib/scoring";

// Face counts for every die recorded in this game (the final dice each
// category was scored with) - a per-game glance, not a claim about fairness,
// since a single game's sample is far too small for that.
function diceFaceCounts(
	scores: { dice: number[] | null }[],
): { face: number; count: number }[] {
	const counts = [0, 0, 0, 0, 0, 0];
	for (const score of scores) {
		if (!score.dice) continue;
		for (const face of score.dice) counts[face - 1]++;
	}
	return counts.map((count, i) => ({ face: i + 1, count }));
}

// Gold/silver/bronze - keyed by a player's actual rank, not their position in
// the array, so a tie (two players both rank 1) renders both as gold rather
// than one being visually demoted to silver.
const MEDAL_COLOR: Record<number, string> = {
	1: "yellow.6",
	2: "gray.5",
	3: "orange.7",
};

const PODIUM_HEIGHT: Record<number, number> = {
	1: 88,
	2: 64,
	3: 48,
};

// Visual left-to-right podium order (2nd, 1st, 3rd), applied via CSS `order`
// so flex placement doesn't depend on array position.
function podiumOrder(rank: number): number {
	if (rank === 1) return 2;
	if (rank === 2) return 1;
	return 3;
}

interface PodiumGroup {
	rank: number;
	players: RankedPlayer[];
}

// A corner is square only where this pedestal touches a neighbor at least as
// tall as itself (so the top edges actually meet flush); a taller pedestal's
// corner stays exposed above a shorter neighbor and should stay rounded
// regardless of position - gold is always taller than its neighbors, so it
// always gets both corners rounded, not because it's "the middle one".
function pedestalRadius(rank: number, groups: PodiumGroup[]): string {
	const visualOrder = [...groups].sort(
		(a, b) => podiumOrder(a.rank) - podiumOrder(b.rank),
	);
	const index = visualOrder.findIndex((g) => g.rank === rank);
	const height = PODIUM_HEIGHT[rank] ?? 40;
	const leftHeight =
		index > 0 ? (PODIUM_HEIGHT[visualOrder[index - 1].rank] ?? 40) : 0;
	const rightHeight =
		index < visualOrder.length - 1
			? (PODIUM_HEIGHT[visualOrder[index + 1].rank] ?? 40)
			: 0;

	const left = leftHeight < height ? "6px" : "0";
	const right = rightHeight < height ? "6px" : "0";
	return `${left} ${right} 0 0`;
}

// Tied players share one pedestal, the way an actual podium works - two
// golds stand together on the gold block rather than getting a pedestal
// each. All players in a group share the same total by definition of a tie.
function groupPodiumByRank(players: RankedPlayer[]): PodiumGroup[] {
	const byRank = new Map<number, RankedPlayer[]>();
	for (const player of players) {
		const group = byRank.get(player.rank) ?? [];
		group.push(player);
		byRank.set(player.rank, group);
	}
	return Array.from(byRank.entries())
		.map(([rank, groupPlayers]) => ({
			rank,
			// Alphabetical, not join/arrival order - no reason one tied
			// player should read as "before" another.
			players: [...groupPlayers].sort((a, b) => a.name.localeCompare(b.name)),
		}))
		.sort((a, b) => a.rank - b.rank);
}

export function Standings({
	sessionState,
	gameMode,
}: {
	sessionState: SessionState;
	gameMode: GameMode | undefined;
}) {
	const { t } = useTranslation();
	const ranked = rankPlayers(sessionState, gameMode);
	const podium = groupPodiumByRank(ranked.filter((player) => player.rank <= 3));
	const rest = ranked.filter((player) => player.rank > 3);
	const diceCounts = diceFaceCounts(sessionState.scores);
	const hasDice = diceCounts.some(({ count }) => count > 0);
	const duration =
		sessionState.session.finishedAt &&
		new Date(sessionState.session.finishedAt).getTime() -
			new Date(sessionState.session.createdAt).getTime();

	return (
		<Card withBorder radius="md" p="lg" w="100%">
			<Stack gap="xs">
				<Group align="flex-end" justify="center" gap={0} wrap="nowrap">
					{podium.map((group) => (
						<Stack
							key={group.rank}
							align="center"
							gap={4}
							style={{
								flex: "1 1 0",
								minWidth: 0,
								order: podiumOrder(group.rank),
							}}
						>
							<Text fw={700} size="sm" ta="center" w="100%" truncate>
								{group.players.map((player) => player.name).join(" · ")}
							</Text>
							<Text fw={700}>{group.players[0].total}</Text>
							<Box
								w="100%"
								h={PODIUM_HEIGHT[group.rank] ?? 40}
								bg={MEDAL_COLOR[group.rank] ?? "gray.4"}
								style={{
									borderRadius: pedestalRadius(group.rank, podium),
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text fw={900} size="xl" c="white">
									{group.rank}
								</Text>
							</Box>
						</Stack>
					))}
				</Group>

				{rest.length > 0 && (
					<Stack gap="xs" mt="xs">
						{rest.map((player) => (
							<Group key={player.id} justify="space-between" wrap="nowrap">
								<Text size="sm" c="dimmed">
									{player.rank}. {player.name}
								</Text>
								<Text fw={600} c="dimmed">
									{player.total}
								</Text>
							</Group>
						))}
					</Stack>
				)}

				{duration && !hasDice && (
					<>
						<Divider />
						<Group
							gap={4}
							c="dimmed"
							wrap="nowrap"
							justify="flex-end"
							align="center"
						>
							<IconClock size={14} style={{ display: "block" }} />
							<Text size="xs" lh={1}>
								{formatDuration(duration)}
							</Text>
						</Group>
					</>
				)}

				{hasDice && (
					<>
						<Divider />
						<Box>
							<Group justify="space-between" align="center" wrap="nowrap">
								<Text size="sm" fw={600}>
									{t("standings.diceDistribution")}
								</Text>
								{duration && (
									<Group gap={4} c="dimmed" wrap="nowrap" align="center">
										<IconClock
											size={14}
											style={{
												display: "block",
											}}
										/>
										<Text size="xs" lh={1}>
											{formatDuration(duration)}
										</Text>
									</Group>
								)}
							</Group>
							<Text size="xs" c="dimmed" mb="xs">
								{t("standings.diceDistributionSubheading")}
							</Text>
							<BarChart
								h={160}
								data={diceCounts.map(({ face, count }) => ({
									face: String(face),
									count,
								}))}
								dataKey="face"
								series={[
									{
										name: "count",
										color: "blue.6",
										label: t("standings.diceDistributionSeriesLabel"),
									},
								]}
								xAxisLabel={t("standings.diceDistributionAxisLabel")}
								withLegend={false}
							/>
						</Box>
					</>
				)}
			</Stack>
		</Card>
	);
}
