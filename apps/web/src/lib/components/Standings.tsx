import { Card, Group, Stack, Text } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";

import type { GameMode, SessionState } from "$lib/api/useSessionState";
import { rankPlayers } from "$lib/scoring";

export function Standings({
	sessionState,
	gameMode,
}: {
	sessionState: SessionState;
	gameMode: GameMode | undefined;
}) {
	const ranked = rankPlayers(sessionState, gameMode);

	return (
		<Card withBorder radius="md" p="lg" w="100%">
			<Stack gap="xs">
				{ranked.map((player) => (
					<Group key={player.id} justify="space-between" wrap="nowrap">
						<Group gap="xs" wrap="nowrap">
							{player.rank === 1 && (
								<IconTrophy size={20} color="var(--mantine-color-yellow-6)" />
							)}
							<Text
								fw={player.rank === 1 ? 700 : 500}
								size={player.rank === 1 ? "lg" : "sm"}
							>
								{player.rank}. {player.name}
							</Text>
						</Group>
						<Text fw={700}>{player.total}</Text>
					</Group>
				))}
			</Stack>
		</Card>
	);
}
