import { Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useSessionState } from "$lib/api/useSessionState";
import { InviteQr } from "$lib/components/InviteQr";

const route = getRouteApi("/s/$code/view");

export default function View() {
	const { t } = useTranslation();

	const { code: sessionCode } = route.useParams();
	const navigate = useNavigate();
	const { sessionState, subscriptionError } = useSessionState(sessionCode);

	function pickPlayer(playerId: string) {
		localStorage.setItem(`yatzy:player:${sessionCode}`, playerId);
		navigate({
			to: "/s/$code/view/$playerId",
			params: { code: sessionCode, playerId },
		});
	}

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

	return (
		<Stack align="center" gap="xl" w="100%" maw={420}>
			<Title order={1} tt="uppercase">
				{t("shared.appTitle")}
			</Title>

			<Card withBorder radius="md" p="lg" w="100%">
				<Stack gap="lg">
					<Group justify="space-between" wrap="nowrap" align="center">
						<div>
							<Title order={3}>{t("view.whoAreYou")}</Title>
							<Text c="dimmed" size="sm">
								{t("shared.sessionCode")}{" "}
								<Text span fw={600} ff="monospace">
									{sessionCode}
								</Text>
							</Text>
						</div>
						<InviteQr sessionCode={sessionCode} />
					</Group>

					<Stack gap="xs">
						{sessionState.players.map((player) => (
							<Button
								key={player.id}
								variant="default"
								onClick={() => pickPlayer(player.id)}
							>
								{player.name}
							</Button>
						))}
					</Stack>
				</Stack>
			</Card>
		</Stack>
	);
}
