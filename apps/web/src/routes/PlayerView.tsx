import { Loader, Stack, Text, Title } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useSessionState } from "$lib/api/useSessionState";
import { InviteQr } from "$lib/components/InviteQr";
import { ScoreTable } from "$lib/components/ScoreTable";
import { roundProgress } from "$lib/scoring";

const route = getRouteApi("/s/$code/view/$playerId");

export default function PlayerView() {
	const { t } = useTranslation();
	const { t: tc } = useTranslation("content");

	const { code: sessionCode, playerId } = route.useParams();
	const { sessionState, subscriptionError, gameMode } =
		useSessionState(sessionCode);

	if (subscriptionError) {
		return (
			<Text c="red" size="sm">
				{subscriptionError}
			</Text>
		);
	}

	if (!sessionState) {
		return <Loader size="sm" color="gray" />;
	}

	const { currentRound, totalRounds, currentPlayerId } =
		roundProgress(sessionState);
	const isMyTurn = currentPlayerId === playerId;
	const currentPlayerName = sessionState.players.find(
		(p) => p.id === currentPlayerId,
	)?.name;

	return (
		<Stack align="center" gap="xl" w="100%" maw={480}>
			<Stack align="center" gap={4}>
				<Title order={1} tt="uppercase">
					{gameMode && tc(`gameModes.${gameMode.id}.name`)}
				</Title>
				<Text c="dimmed" size="sm" ta="center">
					{gameMode && tc(`gameModes.${gameMode.id}.description`)}
				</Text>
			</Stack>
			<Text c="dimmed" size="sm">
				{t("shared.roundStatus", { round: currentRound, total: totalRounds })}
				{isMyTurn
					? ` — ${t("playerView.yourTurn")}`
					: currentPlayerName &&
						` — ${t("playerView.waitingFor", { player: currentPlayerName })}`}
			</Text>

			<ScoreTable
				sessionState={sessionState}
				gameMode={gameMode}
				onlyPlayerId={playerId}
				currentPlayerId={currentPlayerId}
			/>

			<Stack align="center" gap="xs">
				<Text c="dimmed" size="sm">
					{t("shared.sessionCode")}{" "}
					<Text span fw={600} ff="monospace">
						{sessionCode}
					</Text>
				</Text>
				<InviteQr sessionCode={sessionCode} position="bottom" />
			</Stack>
		</Stack>
	);
}
