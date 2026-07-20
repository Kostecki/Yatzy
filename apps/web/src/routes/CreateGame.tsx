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
	Button,
	Card,
	Group,
	Loader,
	Select,
	type SelectProps,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconGripVertical, IconMinus } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { trpc } from "$lib/api/trpc";

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

export default function CreateGame() {
	const { t } = useTranslation();
	const { t: tc } = useTranslation("content");

	const navigate = useNavigate();
	const gameModes = trpc.catalog.listGameModes.useQuery();

	const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
	const [players, setPlayers] = useState([
		{ id: crypto.randomUUID(), name: "" },
	]);
	const [joinCode, setJoinCode] = useState("");

	useEffect(() => {
		if (selectedModeId !== null || !gameModes.data) return;
		const defaultMode = gameModes.data.find((mode) => mode.diceCount === 5);
		if (defaultMode) setSelectedModeId(defaultMode.id);
	}, [gameModes.data, selectedModeId]);

	const createSession = trpc.session.create.useMutation({
		onSuccess: (data) => {
			localStorage.setItem(`yatzy:host:${data.sessionCode}`, data.hostToken);
			navigate({ to: "/s/$code/host", params: { code: data.sessionCode } });
		},
	});

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
			<div>
				<Text size="sm">{option.label}</Text>
				{mode && (
					<Text size="xs" c="dimmed">
						{tc(`gameModes.${mode.id}.description`)}
					</Text>
				)}
			</div>
		);
	};

	return (
		<Stack align="center" gap="xl" w="100%" maw={420}>
			<Title order={1} tt="uppercase">
				{t("shared.appTitle")}
			</Title>

			<Card withBorder radius="md" p="lg" w="100%">
				<Stack gap="lg">
					<div>
						<Title order={3}>{t("createGame.heading")}</Title>
						<Text c="dimmed" size="sm">
							{t("createGame.subheading")}
						</Text>
					</div>

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

					{createSession.isError && (
						<Text c="red" size="sm">
							{createSession.error.message}
						</Text>
					)}

					<Button
						fullWidth
						onClick={handleSubmit}
						disabled={!selectedModeId || createSession.isPending}
						loading={createSession.isPending}
					>
						{t("createGame.submit")}
					</Button>
				</Stack>
			</Card>

			<Card withBorder radius="md" p="lg" w="100%">
				<Stack gap="sm">
					<div>
						<Title order={3}>{t("createGame.joinHeading")}</Title>
						<Text c="dimmed" size="sm">
							{t("createGame.joinSubheading")}
						</Text>
					</div>
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
		</Stack>
	);
}
