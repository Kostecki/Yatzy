import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Divider,
	Flex,
	Group,
	Loader,
	Pagination,
	Select,
	type SelectProps,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconGripVertical, IconMinus } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { trpc } from "$lib/api/trpc";
import type { RouterOutputs } from "$lib/api/types";
import { formatDate, formatDateTime } from "$lib/formatDate";
import {
	forgetSession,
	getRememberedSessions,
	type RememberedSession,
} from "$lib/rememberedSessions";
import { rankPlayers } from "$lib/scoring";

function SortablePlayerRow({
	player,
	onNameChange,
	onRemove,
	removeDisabled,
}: {
	player: { id: string; name: string };
	onNameChange: (name: string) => void;
	onRemove: () => void;
	removeDisabled: boolean;
}) {
	const { t } = useTranslation();

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: player.id });

	return (
		<Group
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
			}}
			gap="xs"
			wrap="nowrap"
		>
			<ActionIcon
				variant="subtle"
				color="gray"
				style={{ cursor: "grab", touchAction: "none" }}
				aria-label={t("createGame.dragToReorder")}
				{...attributes}
				{...listeners}
			>
				<IconGripVertical size={16} />
			</ActionIcon>
			<TextInput
				placeholder={t("createGame.playerNamePlaceholder")}
				value={player.name}
				onChange={(e) => onNameChange(e.currentTarget.value)}
				style={{ flex: 1 }}
			/>
			<ActionIcon
				variant="outline"
				color="gray"
				onClick={onRemove}
				disabled={removeDisabled}
				aria-label={t("createGame.removePlayer")}
			>
				<IconMinus size={16} />
			</ActionIcon>
		</Group>
	);
}

function HistoryEntry({
	session,
	gameMode,
}: {
	session: RouterOutputs["session"]["listFinished"][number];
	gameMode: RouterOutputs["catalog"]["listGameModes"][number] | undefined;
}) {
	const { t: tc } = useTranslation("content");
	const winners = rankPlayers(session, gameMode).filter((p) => p.rank === 1);

	return (
		<Link
			to="/s/$code/game"
			params={{ code: session.sessionCode }}
			style={{ textDecoration: "none", color: "inherit" }}
		>
			<Group justify="space-between" wrap="nowrap" gap="xs" py={6}>
				<Group gap={6} wrap="nowrap">
					<Text size="sm" fw={600}>
						{winners.map((w) => w.name).join(" / ")}
					</Text>
					<Text size="sm" c="dimmed">
						· {winners[0]?.total}
					</Text>
				</Group>
				<Text size="xs" c="dimmed">
					{gameMode && tc(`gameModes.${gameMode.id}.name`)} ·{" "}
					{formatDate(new Date(session.finishedAt ?? session.createdAt))}
				</Text>
			</Group>
		</Link>
	);
}

function ContinueEntry({
	remembered,
	gameModes,
	showDividerAfter,
	onVisibilityChange,
}: {
	remembered: RememberedSession;
	gameModes: RouterOutputs["catalog"]["listGameModes"] | undefined;
	showDividerAfter: boolean;
	onVisibilityChange: (code: string, visible: boolean) => void;
}) {
	const { t } = useTranslation();
	const { t: tc } = useTranslation("content");
	const session = trpc.session.get.useQuery({ sessionCode: remembered.code });

	const isStale =
		session.isError ||
		(session.data &&
			(session.data.session.finishedAt ||
				(remembered.role === "player" &&
					!session.data.players.some((p) => p.id === remembered.playerId))));

	const isVisible = Boolean(session.data) && !isStale;

	useEffect(() => {
		onVisibilityChange(remembered.code, isVisible);
	}, [isVisible, remembered.code, onVisibilityChange]);

	useEffect(() => {
		if (isStale) forgetSession(remembered.code);
	}, [isStale, remembered.code]);

	if (!isVisible || !session.data) return null;

	const gameMode = gameModes?.find(
		(m) => m.id === session.data.session.gameModeId,
	);

	const createdAt = new Date(session.data.session.createdAt);

	const inner = (
		<Group justify="space-between" wrap="nowrap" py={6}>
			<Group gap={6} wrap="nowrap">
				<Text size="sm" fw={600}>
					{gameMode && tc(`gameModes.${gameMode.id}.name`)}{" "}
				</Text>
				<Text size="sm" c="dimmed">
					·{" "}
					{t("createGame.playerCount", { count: session.data.players.length })}
				</Text>
			</Group>
			<Text size="xs" c="dimmed">
				{formatDateTime(createdAt)}
			</Text>
		</Group>
	);

	const link =
		remembered.role === "host" ? (
			<Link
				to="/s/$code/game"
				params={{ code: remembered.code }}
				style={{ textDecoration: "none", color: "inherit" }}
			>
				{inner}
			</Link>
		) : (
			<Link
				to="/s/$code/view/$playerId"
				params={{ code: remembered.code, playerId: remembered.playerId }}
				style={{ textDecoration: "none", color: "inherit" }}
			>
				{inner}
			</Link>
		);

	return (
		<>
			{link}
			{showDividerAfter && <Divider />}
		</>
	);
}

export default function CreateGame() {
	const { t } = useTranslation();
	const { t: tc } = useTranslation("content");

	const HISTORY_PAGE_SIZE = 10;

	const navigate = useNavigate();
	const gameModes = trpc.catalog.listGameModes.useQuery();

	const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
	const [players, setPlayers] = useState([
		{ id: crypto.randomUUID(), name: "" },
	]);
	const [joinCode, setJoinCode] = useState("");
	const [rememberedSessions] = useState(() => getRememberedSessions());
	const [historyPage, setHistoryPage] = useState(1);

	const [visibleContinueCodes, setVisibleContinueCodes] = useState<Set<string>>(
		new Set(),
	);
	const handleContinueVisibilityChange = useCallback(
		(code: string, visible: boolean) => {
			setVisibleContinueCodes((prev) => {
				if (visible === prev.has(code)) return prev;
				const next = new Set(prev);
				if (visible) next.add(code);
				else next.delete(code);
				return next;
			});
		},
		[],
	);
	const visibleContinueOrder = rememberedSessions
		.map((r) => r.code)
		.filter((code) => visibleContinueCodes.has(code));

	useEffect(() => {
		if (selectedModeId !== null || !gameModes.data) return;
		const defaultMode = gameModes.data.find((mode) => mode.diceCount === 5);
		if (defaultMode) setSelectedModeId(defaultMode.id);
	}, [gameModes.data, selectedModeId]);

	const createSession = trpc.session.create.useMutation({
		onSuccess: (data) => {
			localStorage.setItem(`yatzy:host:${data.sessionCode}`, data.hostToken);
			navigate({ to: "/s/$code/game", params: { code: data.sessionCode } });
		},
	});

	const hasAnyPlayers = players.some((p) => p.name.trim() !== "");

	const finishedGames = trpc.session.listFinished.useQuery();
	const historyTotalPages = Math.ceil(
		(finishedGames.data?.length ?? 0) / HISTORY_PAGE_SIZE,
	);
	const historyPageItems = finishedGames.data?.slice(
		(historyPage - 1) * HISTORY_PAGE_SIZE,
		historyPage * HISTORY_PAGE_SIZE,
	);

	function addPlayer() {
		setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name: "" }]);
	}

	function removePlayer(id: string) {
		setPlayers((prev) => prev.filter((p) => p.id !== id));
	}

	function updatePlayerName(id: string, name: string) {
		setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
	}

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setPlayers((prev) => {
			const oldIndex = prev.findIndex((p) => p.id === active.id);
			const newIndex = prev.findIndex((p) => p.id === over.id);
			return arrayMove(prev, oldIndex, newIndex);
		});
	}

	function handleSubmit() {
		if (!selectedModeId) return;
		createSession.mutate({
			gameModeId: selectedModeId,
			playerNames: players
				.map((p) => p.name)
				.filter((name) => name.trim() !== ""),
		});
	}

	function handleJoin() {
		const code = joinCode.trim().toUpperCase();
		if (!code) return;
		navigate({ to: "/s/$code/view", params: { code } });
	}

	const modeOptions =
		gameModes.data?.map((mode) => ({
			value: mode.id,
			label: tc(`gameModes.${mode.id}.name`),
		})) ?? [];

	const renderModeOption: SelectProps["renderOption"] = ({ option }) => {
		const mode = gameModes.data?.find((m) => m.id === option.value);
		return (
			<Box>
				<Text size="sm">{option.label}</Text>
				{mode && (
					<Text size="xs" c="dimmed">
						{tc(`gameModes.${mode.id}.description`)}
					</Text>
				)}
			</Box>
		);
	};

	return (
		<Stack align="center" gap="xl" w="100%" maw={420}>
			<Title order={1} tt="uppercase">
				{t("shared.appTitle")}
			</Title>

			<Card withBorder radius="md" p="lg" w="100%">
				<Stack gap="lg">
					<Box>
						<Title order={3}>{t("createGame.heading")}</Title>
						<Text c="dimmed" size="sm">
							{t("createGame.subheading")}
						</Text>
					</Box>

					{gameModes.isPending ? (
						<Loader size="sm" color="gray" />
					) : (
						<Select
							label={t("createGame.gameModeLabel")}
							placeholder={t("createGame.gameModePlaceholder")}
							data={modeOptions}
							value={selectedModeId}
							onChange={setSelectedModeId}
							renderOption={renderModeOption}
						/>
					)}

					<Stack gap="xs">
						<Text size="sm" fw={500}>
							{t("createGame.playersLabel")}
						</Text>
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={players.map((p) => p.id)}
								strategy={verticalListSortingStrategy}
							>
								<Stack gap="xs">
									{players.map((player) => (
										<SortablePlayerRow
											key={player.id}
											player={player}
											onNameChange={(name) => updatePlayerName(player.id, name)}
											onRemove={() => removePlayer(player.id)}
											removeDisabled={players.length === 1}
										/>
									))}
								</Stack>
							</SortableContext>
						</DndContext>
						<Button variant="default" onClick={addPlayer}>
							{t("createGame.addPlayer")}
						</Button>
					</Stack>

					<Divider />

					{createSession.isError && (
						<Text c="red" size="sm">
							{createSession.error.message}
						</Text>
					)}

					<Button
						fullWidth
						onClick={handleSubmit}
						disabled={
							!selectedModeId || createSession.isPending || !hasAnyPlayers
						}
						loading={createSession.isPending}
					>
						{t("createGame.submit")}
					</Button>
				</Stack>
			</Card>

			<Card withBorder radius="md" p="lg" w="100%">
				<Stack gap="sm">
					<Box>
						<Title order={3}>{t("createGame.joinHeading")}</Title>
						<Text c="dimmed" size="sm">
							{t("createGame.joinSubheading")}
						</Text>
					</Box>
					<Group gap="xs" wrap="nowrap">
						<TextInput
							placeholder={t("createGame.joinCodePlaceholder")}
							value={joinCode}
							onChange={(e) => setJoinCode(e.currentTarget.value)}
							style={{ flex: 1 }}
						/>
						<Button
							variant="default"
							disabled={!joinCode.trim()}
							onClick={handleJoin}
						>
							{t("createGame.joinSubmit")}
						</Button>
					</Group>
				</Stack>
			</Card>

			{rememberedSessions.length > 0 && (
				<Card withBorder radius="md" p="lg" w="100%">
					<Stack gap="sm">
						<Box>
							<Title order={3}>{t("createGame.continueHeading")}</Title>
							<Text c="dimmed" size="sm">
								{t("createGame.continueSubheading")}
							</Text>
						</Box>
						<Stack gap={0}>
							{rememberedSessions.map((remembered) => (
								<ContinueEntry
									key={remembered.code}
									remembered={remembered}
									gameModes={gameModes.data}
									showDividerAfter={
										visibleContinueOrder.indexOf(remembered.code) <
											visibleContinueOrder.length - 1 &&
										visibleContinueOrder.includes(remembered.code)
									}
									onVisibilityChange={handleContinueVisibilityChange}
								/>
							))}
						</Stack>
					</Stack>
				</Card>
			)}

			{historyPageItems && historyPageItems.length > 0 && (
				<Card withBorder radius="md" p="lg" w="100%">
					<Stack gap="sm">
						<Box>
							<Title order={3}>{t("createGame.historyHeading")}</Title>
							<Text c="dimmed" size="sm">
								{t("createGame.historySubheading")}
							</Text>
						</Box>
						<Stack gap={0}>
							{historyPageItems.map((session, index) => (
								<Fragment key={session.sessionCode}>
									{index > 0 && <Divider />}
									<HistoryEntry
										session={session}
										gameMode={gameModes.data?.find(
											(m) => m.id === session.gameModeId,
										)}
									/>
								</Fragment>
							))}
						</Stack>
						{historyTotalPages > 1 && (
							<Flex justify="center" mt="sm">
								<Pagination
									value={historyPage}
									onChange={setHistoryPage}
									total={historyTotalPages}
									size="sm"
									mt="xs"
								/>
							</Flex>
						)}
					</Stack>
				</Card>
			)}
		</Stack>
	);
}
