import {
	ActionIcon,
	Button,
	Card,
	Divider,
	Group,
	Loader,
	Modal,
	Popover,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { getRouteApi } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

import { trpc } from "$lib/api/trpc";
import { useSessionState } from "$lib/api/useSessionState";
import { DieFace } from "$lib/components/DieFace";
import { InviteQr } from "$lib/components/InviteQr";
import { ScoreTable } from "$lib/components/ScoreTable";
import {
	exampleDiceGroups,
	fixedValue,
	roundProgress,
	targetDiceCount,
	upperBonusPace,
} from "$lib/scoring";

const route = getRouteApi("/s/$code/host");

export default function Host() {
	const { t } = useTranslation();

	const { code: sessionCode } = route.useParams();
	const hostToken = localStorage.getItem(`yatzy:host:${sessionCode}`);

	const { t: tc } = useTranslation("content");

	const { sessionState, subscriptionError, gameMode } =
		useSessionState(sessionCode);

	const players = sessionState?.players ?? [];
	const { currentRound, totalRounds, isComplete, currentPlayerId } =
		sessionState
			? roundProgress(sessionState)
			: {
					currentRound: 0,
					totalRounds: 0,
					isComplete: false,
					currentPlayerId: undefined,
				};
	const currentPlayerName = players.find((p) => p.id === currentPlayerId)?.name;

	const [selected, setSelected] = useState<
		{ playerId: string; categoryId: string } | undefined
	>(undefined);
	const [diceCounts, setDiceCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
	const [newPlayerName, setNewPlayerName] = useState("");
	const [addPlayerOpened, setAddPlayerOpened] = useState(false);

	const diceTotal = diceCounts.reduce((a, b) => a + b, 0);
	const selectedDice = diceCounts.flatMap((count, i) =>
		Array(count).fill(i + 1),
	);

	const selectedCategory = sessionState?.categories.find(
		(c) => c.id === selected?.categoryId,
	);
	const selectedPlayerName =
		players.find((p) => p.id === selected?.playerId)?.name ?? "";
	const selectedCategoryLabel = selectedCategory
		? (selectedCategory.labelOverride ??
			tc(`categories.${selectedCategory.id}.label`))
		: "";

	const selectedFixedValue = selectedCategory
		? fixedValue(selectedCategory)
		: undefined;
	const fixedDiceGroups = selectedCategory
		? exampleDiceGroups(selectedCategory, gameMode?.diceCount)
		: undefined;
	// Some Yatzy variants (Family/Giant) add the face value on top of the flat
	// bonus, so unlike Normal's Yatzy, which face you roll actually matters.
	const includesEyesBonus =
		selectedCategory?.primitive === "yatzy" &&
		(selectedCategory.params as { includeEyesBonus: boolean }).includeEyesBonus;
	// Upper-section categories only score dice showing one specific face — the
	// other faces don't affect the result, so there's nothing to enter for them.
	const relevantFace =
		selectedCategory?.primitive === "sum_of_face"
			? (selectedCategory.params as { face: number }).face
			: undefined;
	// Most categories only need a handful of dice to determine the score (e.g.
	// Three of a Kind needs 3, not all 5/6/12) — shown as a divider in the dice
	// row rather than a hard cap, since you can still physically have rolled
	// more. undefined means there's no fixed target (Ones-Sixes: more matching
	// dice keep helping the upper bonus, so let the host enter as many as they
	// rolled).
	const target = selectedCategory
		? targetDiceCount(selectedCategory, gameMode?.diceCount)
		: undefined;
	const diceCapacity = gameMode?.diceCount;
	// Most categories are ready to preview/submit once the target is reached,
	// even if more dice could still be entered. A relevant-face category only
	// needs that one count, so it's always ready.
	const diceComplete =
		relevantFace !== undefined
			? true
			: target !== undefined
				? diceTotal >= target
				: diceCapacity !== undefined && diceTotal === diceCapacity;
	// Ones-Sixes has no hard target (see above), but it still has a "you're on
	// pace for the bonus" marker worth showing in the dice row.
	const diceRowDivider =
		relevantFace !== undefined
			? gameMode
				? upperBonusPace(gameMode.upperBonusThreshold)
				: undefined
			: target;

	function resetDice() {
		setDiceCounts([0, 0, 0, 0, 0, 0]);
	}

	function selectCell(playerId: string, categoryId: string) {
		setSelected({ playerId, categoryId });
		resetDice();
	}

	function closePanel() {
		setSelected(undefined);
		resetDice();
	}

	function incrementFace(face: number) {
		if (relevantFace !== undefined && face !== relevantFace) return;
		if (diceTotal >= (diceCapacity ?? 0)) return;
		setDiceCounts((counts) =>
			counts.map((c, i) => (i === face - 1 ? c + 1 : c)),
		);
	}

	function decrementFace(face: number) {
		setDiceCounts((counts) =>
			counts.map((c, i) => (i === face - 1 && c > 0 ? c - 1 : c)),
		);
	}

	const preview = trpc.session.previewScores.useQuery(
		{ sessionCode, diceCounts },
		{ enabled: diceComplete },
	);

	const previewValue = preview.data?.find(
		(p) => p.categoryId === selected?.categoryId,
	)?.value;

	const submitScore = trpc.session.submitScore.useMutation({
		onSuccess: () => closePanel(),
	});

	function submit(value: number) {
		if (!selected || !hostToken) return;
		submitScore.mutate({
			sessionCode,
			hostToken,
			playerId: selected.playerId,
			categoryId: selected.categoryId,
			value,
		});
	}

	function handleSubmit() {
		if (previewValue !== undefined) {
			submit(previewValue);
		}
	}

	const canReset = diceTotal > 0;
	const canSubmit =
		diceComplete && previewValue !== undefined && !submitScore.isPending;

	const endGame = trpc.session.endGame.useMutation();
	const addPlayer = trpc.session.addPlayer.useMutation({
		onSuccess: () => {
			setNewPlayerName("");
			setAddPlayerOpened(false);
		},
	});
	const renamePlayer = trpc.session.renamePlayer.useMutation();
	const removePlayer = trpc.session.removePlayer.useMutation();

	function handleAddPlayer() {
		const name = newPlayerName.trim();
		if (!name || !hostToken) return;
		addPlayer.mutate({ sessionCode, hostToken, name });
	}

	function finishGame() {
		if (!hostToken) return;
		endGame.mutate({ sessionCode, hostToken });
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

	if (!hostToken) {
		return (
			<Text c="red" size="sm">
				{t("host.missingHostAccess")}
			</Text>
		);
	}

	const rosterLocked = sessionState.scores.length > 0;

	return (
		<Stack align="center" gap="xl" w="100%" maw={720}>
			<Stack align="center" gap={4}>
				<Title order={1} tt="uppercase">
					{gameMode && tc(`gameModes.${gameMode.id}.name`)}
				</Title>
				<Text c="dimmed" size="sm" ta="center">
					{gameMode && tc(`gameModes.${gameMode.id}.description`)}
				</Text>
			</Stack>
			<Stack align="center" gap={8}>
				<Text c="dimmed" size="sm">
					{t("shared.roundStatus", { round: currentRound, total: totalRounds })}
					{currentPlayerName &&
						` — ${t("host.turn", { player: currentPlayerName })}`}
				</Text>
				{sessionState.session.finishedAt ? (
					<Text size="sm" fw={600} c="green">
						{t("host.gameFinished")}
					</Text>
				) : (
					<Button
						variant="outline"
						color="green"
						size="compact-sm"
						disabled={!isComplete}
						loading={endGame.isPending}
						onClick={finishGame}
					>
						{t("host.finishGame")}
					</Button>
				)}
			</Stack>

			<ScoreTable
				sessionState={sessionState}
				gameMode={gameMode}
				onCellClick={selectCell}
				currentPlayerId={currentPlayerId}
				onRenamePlayer={
					rosterLocked
						? undefined
						: (playerId, name) =>
								renamePlayer.mutate({ sessionCode, hostToken, playerId, name })
				}
				onRemovePlayer={
					rosterLocked
						? undefined
						: (playerId) =>
								removePlayer.mutate({ sessionCode, hostToken, playerId })
				}
			/>

			<Card withBorder radius="md" p="lg" w="100%">
				<Group justify="space-between" wrap="nowrap" align="center">
					<div>
						<Text size="sm" fw={500}>
							{t("host.invitePlayers")}
						</Text>
						<Text c="dimmed" size="sm">
							{t("shared.sessionCode")}{" "}
							<Text span fw={700} ff="monospace">
								{sessionCode}
							</Text>
						</Text>
					</div>
					<Group gap="xs" wrap="nowrap">
						{!rosterLocked && (
							<Popover
								opened={addPlayerOpened}
								onChange={setAddPlayerOpened}
								withArrow
								shadow="md"
								position="bottom-end"
							>
								<Popover.Target>
									<ActionIcon
										variant="outline"
										color="gray"
										size="lg"
										aria-label={t("host.addPlayerSubmit")}
										onClick={() => setAddPlayerOpened((o) => !o)}
									>
										<IconUserPlus size={20} />
									</ActionIcon>
								</Popover.Target>
								<Popover.Dropdown>
									<Group gap="xs" wrap="nowrap">
										<TextInput
											placeholder={t("host.addPlayerPlaceholder")}
											value={newPlayerName}
											onChange={(e) => setNewPlayerName(e.currentTarget.value)}
											size="sm"
										/>
										<Button
											size="sm"
											disabled={!newPlayerName.trim() || addPlayer.isPending}
											loading={addPlayer.isPending}
											onClick={handleAddPlayer}
										>
											{t("host.addPlayerSubmit")}
										</Button>
									</Group>
								</Popover.Dropdown>
							</Popover>
						)}
						<InviteQr sessionCode={sessionCode} />
					</Group>
				</Group>
			</Card>

			<Modal
				opened={Boolean(selected)}
				onClose={closePanel}
				title={
					<Title order={3}>
						{selectedCategoryLabel} &middot; {selectedPlayerName}
					</Title>
				}
				centered
			>
				<Stack gap="md">
					<Stack gap={2}>
						<Text c="dimmed" size="sm">
							{selectedCategory &&
								tc(`categories.${selectedCategory.id}.description`)}
						</Text>
						{includesEyesBonus && (
							<Text c="dimmed" size="sm" fs="italic">
								{t("host.extraEyesBonus")}
							</Text>
						)}
					</Stack>

					<Group justify="center" gap="sm" wrap="wrap" mih={44} mt="sm" mb="md">
						{selectedFixedValue !== undefined ? (
							fixedDiceGroups?.map((group, groupIndex) => (
								<Group
									// biome-ignore lint/suspicious/noArrayIndexKey: groups are indistinguishable
									key={groupIndex}
									gap={4}
									wrap="nowrap"
								>
									{group.map((face, i) => (
										<DieFace
											// biome-ignore lint/suspicious/noArrayIndexKey: dice are indistinguishable
											key={i}
											value={face}
											size={36}
											active
										/>
									))}
								</Group>
							))
						) : relevantFace !== undefined ? (
							Array.from({ length: gameMode?.diceCount ?? 0 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: dice slots are indistinguishable
								<Fragment key={i}>
									{diceRowDivider !== undefined && i === diceRowDivider && (
										<Divider
											orientation="vertical"
											mx={2}
											style={{ height: 36, alignSelf: "center" }}
										/>
									)}
									<DieFace
										value={selectedDice[i] ?? 0}
										size={36}
										active={i < selectedDice.length}
									/>
								</Fragment>
							))
						) : (
							<>
								{selectedDice.map((face, i) => (
									<DieFace
										// biome-ignore lint/suspicious/noArrayIndexKey: dice are indistinguishable
										key={`filled-${i}`}
										value={face}
										size={36}
										active
									/>
								))}
								{target !== undefined &&
									Array.from({
										length: Math.max(0, target - selectedDice.length),
									}).map((_, i) => (
										<DieFace
											// biome-ignore lint/suspicious/noArrayIndexKey: placeholders are indistinguishable
											key={`empty-${i}`}
											value={0}
											size={36}
										/>
									))}
							</>
						)}
					</Group>

					{selectedFixedValue === undefined &&
						(() => {
							const faces =
								relevantFace !== undefined
									? [relevantFace]
									: [1, 2, 3, 4, 5, 6];
							const steppers = faces.map((face) => (
								<Stack key={face} align="center" gap={4}>
									<DieFace
										value={face}
										size={36}
										active={diceCounts[face - 1] > 0}
									/>
									<Group gap={4}>
										<ActionIcon
											variant="outline"
											color="gray"
											onClick={() => decrementFace(face)}
											disabled={diceCounts[face - 1] === 0}
										>
											&minus;
										</ActionIcon>
										<Text w={24} ta="center">
											{diceCounts[face - 1]}
										</Text>
										<ActionIcon
											variant="outline"
											color="gray"
											onClick={() => incrementFace(face)}
											disabled={diceTotal >= (diceCapacity ?? 0)}
										>
											+
										</ActionIcon>
									</Group>
								</Stack>
							));
							return relevantFace !== undefined ? (
								<Group justify="center">{steppers}</Group>
							) : (
								<SimpleGrid cols={3} spacing="sm">
									{steppers}
								</SimpleGrid>
							);
						})()}

					<Group justify="center" mt="md">
						<Button
							variant="outline"
							color="gray"
							size="compact-sm"
							loading={submitScore.isPending}
							onClick={() => submit(0)}
						>
							{t("host.strike")}
						</Button>
					</Group>

					{selectedFixedValue === undefined && (
						<Text ta="center" size="lg" fw={600} mb="md">
							{diceComplete && preview.isPending ? (
								<Loader size="sm" color="gray" mx="auto" />
							) : (
								t("host.score", { value: previewValue ?? 0 })
							)}
						</Text>
					)}

					<Group gap="sm">
						{selectedFixedValue === undefined && (
							<Button
								variant="outline"
								color="gray"
								style={{ flex: 1 }}
								disabled={!canReset}
								onClick={resetDice}
							>
								{t("host.reset")}
							</Button>
						)}
						{selectedFixedValue !== undefined ? (
							<Button
								style={{ flex: 1 }}
								loading={submitScore.isPending}
								onClick={() => submit(selectedFixedValue)}
							>
								{t("host.gotIt")}
							</Button>
						) : (
							<Button
								style={{ flex: 1 }}
								disabled={!canSubmit}
								loading={submitScore.isPending}
								onClick={handleSubmit}
							>
								{t("host.submit")}
							</Button>
						)}
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
