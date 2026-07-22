import {
	Button,
	Loader,
	Popover,
	Progress,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { trpc } from "$lib/api/trpc";
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

	const navigate = useNavigate();
	const [claimOpened, setClaimOpened] = useState(false);

	const claimHost = trpc.session.claimHost.useMutation({
		onSuccess: (data) => {
			localStorage.setItem(`yatzy:host:${sessionCode}`, data.hostToken);
			navigate({ to: "/s/$code/game", params: { code: sessionCode } });
		},
	});

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

	const { currentRound, totalRounds, currentPlayerId, isComplete } =
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
			<Stack gap={4}>
				<Text c="dimmed" size="sm">
					{t("shared.roundStatus", { round: currentRound, total: totalRounds })}
					{isMyTurn
						? ` - ${t("playerView.yourTurn")}`
						: currentPlayerName &&
							` - ${t("playerView.waitingFor", { player: currentPlayerName })}`}
				</Text>
				{!isComplete && (
					<Progress
						value={isComplete ? 100 : ((currentRound - 1) / totalRounds) * 100}
						transitionDuration={200}
						size="xs"
						radius="xl"
						w="100%"
						mb="sm"
					/>
				)}
			</Stack>

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

			{!sessionState.session.finishedAt &&
				!localStorage.getItem(`yatzy:host:${sessionCode}`) && (
					<Popover
						opened={claimOpened}
						onChange={setClaimOpened}
						withArrow
						shadow="md"
						position="top"
					>
						<Popover.Target>
							<Button
								variant="subtle"
								color="gray"
								size="compact-sm"
								onClick={() => setClaimOpened((o) => !o)}
							>
								{t("playerView.becomeHost")}
							</Button>
						</Popover.Target>
						<Popover.Dropdown maw={240}>
							<Stack gap="xs" ta="center">
								<Text size="sm" c="dimmed">
									{t("playerView.becomeHostConfirm")}
								</Text>
								<Button
									size="sm"
									loading={claimHost.isPending}
									onClick={() => claimHost.mutate({ sessionCode })}
								>
									{t("playerView.becomeHostSubmit")}
								</Button>
							</Stack>
						</Popover.Dropdown>
					</Popover>
				)}
		</Stack>
	);
}
