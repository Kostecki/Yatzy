import {
	ActionIcon,
	Button,
	Flex,
	Group,
	Popover,
	Stack,
	Table,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { IconEye, IconEyeOff, IconPlus } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GameMode, SessionState } from "$lib/api/useSessionState";
import { DieFace } from "$lib/components/DieFace";
import { exampleDiceGroups, fixedValue } from "$lib/scoring";

type Category = SessionState["categories"][number];

function MaybeBlur({
	hidden,
	children,
}: {
	hidden?: boolean;
	children: ReactNode;
}) {
	if (!hidden) return <>{children}</>;
	return (
		<span style={{ filter: "blur(3px)", userSelect: "none" }}>{children}</span>
	);
}

function LabelWithHint({ label, hint }: { label: ReactNode; hint?: number }) {
	return (
		<Flex justify="space-between" align="center" gap={16} lh={1} fz="md">
			{label}
			{hint !== undefined && (
				<Text span size="sm" c="dimmed">
					{hint}
				</Text>
			)}
		</Flex>
	);
}

function CategoryLabel({
	category,
	diceCount,
}: {
	category: Category;
	diceCount?: number;
}) {
	const fixed = fixedValue(category);
	const showHint = fixed !== undefined && category.primitive !== "yatzy";
	const [opened, setOpened] = useState(false);

	const { t: tc } = useTranslation("content");

	const label = (
		<LabelWithHint
			label={category.labelOverride ?? tc(`categories.${category.id}.label`)}
			hint={showHint ? fixed : undefined}
		/>
	);

	// The upper section (Ones–Sixes) has no meaningful "what to roll" example —
	// any face works, you just add up how many dice show it — so skip the popover.
	if (category.section === "upper") {
		return label;
	}

	const diceGroups = exampleDiceGroups(category, diceCount);

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			withArrow
			shadow="md"
			position="bottom-start"
		>
			<Popover.Target>
				<UnstyledButton onClick={() => setOpened((o) => !o)} w="100%">
					{label}
				</UnstyledButton>
			</Popover.Target>
			<Popover.Dropdown maw={250}>
				<Stack gap="xs" ta="center">
					<Text size="sm">{tc(`categories.${category.id}.description`)}</Text>
					{diceGroups && diceGroups.length > 0 && (
						<Flex wrap="wrap" justify="center" gap="sm">
							{diceGroups.map((group, groupIndex) => (
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
											size={28}
											active
										/>
									))}
								</Group>
							))}
						</Flex>
					)}
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}

function PlayerNameHeader({
	player,
	isCurrent,
	onRename,
	onRemove,
	removeDisabled,
}: {
	player: { id: string; name: string };
	isCurrent: boolean;
	onRename?: (name: string) => void;
	onRemove?: () => void;
	removeDisabled: boolean;
}) {
	const { t } = useTranslation();
	const [opened, setOpened] = useState(false);
	const [name, setName] = useState(player.name);

	const label = (
		<Text span fw={700} c={isCurrent ? "green.8" : undefined}>
			{player.name}
		</Text>
	);

	if (!onRename) {
		return label;
	}

	function handleSave() {
		const trimmed = name.trim();
		if (trimmed && trimmed !== player.name) {
			onRename?.(trimmed);
		}
		setOpened(false);
	}

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			withArrow
			shadow="md"
			position="bottom"
		>
			<Popover.Target>
				<UnstyledButton
					onClick={() => {
						setName(player.name);
						setOpened((o) => !o);
					}}
				>
					{label}
				</UnstyledButton>
			</Popover.Target>
			<Popover.Dropdown maw={220}>
				<Stack gap="xs">
					<TextInput
						size="xs"
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
					/>
					<Group gap="xs" justify="space-between">
						<Button
							size="xs"
							variant="outline"
							color="red"
							disabled={removeDisabled}
							onClick={() => {
								onRemove?.();
								setOpened(false);
							}}
						>
							{t("scoreTable.remove")}
						</Button>
						<Button size="xs" onClick={handleSave}>
							{t("scoreTable.save")}
						</Button>
					</Group>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}

export function ScoreTable({
	sessionState,
	gameMode,
	onlyPlayerId,
	currentPlayerId,
	onCellClick,
	onRenamePlayer,
	onRemovePlayer,
}: {
	sessionState: SessionState;
	gameMode: GameMode | undefined;
	onlyPlayerId?: string;
	currentPlayerId?: string;
	onCellClick?: (playerId: string, categoryId: string) => void;
	onRenamePlayer?: (playerId: string, name: string) => void;
	onRemovePlayer?: (playerId: string) => void;
}) {
	const { t } = useTranslation();

	// Hiding is a host-only convenience (e.g. to avoid spoiling standings on a
	// shared screen) — companions (no onCellClick) always see their own total.
	const [totalsRevealed, setTotalsRevealed] = useState(false);
	const canToggleTotals = Boolean(onCellClick);
	const totalsHidden = canToggleTotals && !totalsRevealed;

	const players = onlyPlayerId
		? sessionState.players.filter((p) => p.id === onlyPlayerId)
		: sessionState.players;
	const upperCategories = sessionState.categories.filter(
		(c) => c.section === "upper",
	);
	const lowerCategories = sessionState.categories.filter(
		(c) => c.section === "lower",
	);

	function scoreFor(playerId: string, categoryId: string) {
		return sessionState.scores.find(
			(s) => s.playerId === playerId && s.categoryId === categoryId,
		);
	}

	function upperSubtotal(playerId: string) {
		return upperCategories.reduce(
			(sum, c) => sum + (scoreFor(playerId, c.id)?.value ?? 0),
			0,
		);
	}

	function bonusFor(playerId: string) {
		if (!gameMode) return 0;
		return upperSubtotal(playerId) >= gameMode.upperBonusThreshold
			? gameMode.upperBonusAmount
			: 0;
	}

	function lowerSubtotal(playerId: string) {
		return lowerCategories.reduce(
			(sum, c) => sum + (scoreFor(playerId, c.id)?.value ?? 0),
			0,
		);
	}

	function grandTotal(playerId: string) {
		return (
			upperSubtotal(playerId) + bonusFor(playerId) + lowerSubtotal(playerId)
		);
	}

	function ScoreDicePopover({
		dice,
		children,
	}: {
		dice: number[];
		children: ReactNode;
	}) {
		const [opened, setOpened] = useState(false);
		return (
			<Popover
				opened={opened}
				onChange={setOpened}
				withArrow
				shadow="md"
				position="bottom"
			>
				<Popover.Target>
					<UnstyledButton onClick={() => setOpened((o) => !o)}>
						{children}
					</UnstyledButton>
				</Popover.Target>
				<Popover.Dropdown>
					<Group gap={4} wrap="wrap" maw={200} justify="center">
						{dice.map((face, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: dice are indistinguishable
							<DieFace key={i} value={face} size={28} active />
						))}
					</Group>
				</Popover.Dropdown>
			</Popover>
		);
	}

	function renderCategoryRows(categories: Category[]) {
		return categories.map((category) => (
			<Table.Tr key={category.id}>
				<Table.Td w="1%" px="md" style={{ whiteSpace: "nowrap" }}>
					<CategoryLabel category={category} diceCount={gameMode?.diceCount} />
				</Table.Td>
				{players.map((player) => {
					const score = scoreFor(player.id, category.id);
					// Blank = not played yet. A dash marks a deliberate zero
					// (crossed out because nothing fit), matching paper sheets.
					const display =
						!score || score.value === null
							? ""
							: score.value === 0
								? "-"
								: score.value;
					return (
						<Table.Td key={player.id} ta="center">
							{onCellClick ? (
								<Button
									variant="subtle"
									color="gray"
									size="compact-sm"
									onClick={() => onCellClick(player.id, category.id)}
									style={{ userSelect: "none" }}
								>
									{display === "" ? (
										<IconPlus size={14} color="var(--mantine-color-gray-4)" />
									) : (
										display
									)}
								</Button>
							) : score?.dice && score.dice.length > 0 ? (
								<ScoreDicePopover dice={score.dice}>
									<Text span style={{ cursor: "pointer" }}>
										{display}
									</Text>
								</ScoreDicePopover>
							) : (
								display
							)}
						</Table.Td>
					);
				})}
			</Table.Tr>
		));
	}

	return (
		<Table withTableBorder withColumnBorders w="100%">
			<Table.Thead>
				<Table.Tr>
					<Table.Th w="30%" px="md" style={{ whiteSpace: "nowrap" }}>
						{t("scoreTable.category")}
					</Table.Th>
					{players.map((player) => (
						<Table.Th key={player.id} ta="center">
							<PlayerNameHeader
								player={player}
								isCurrent={player.id === currentPlayerId}
								onRename={
									onRenamePlayer
										? (name) => onRenamePlayer(player.id, name)
										: undefined
								}
								onRemove={
									onRemovePlayer ? () => onRemovePlayer(player.id) : undefined
								}
								removeDisabled={players.length === 1}
							/>
						</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{renderCategoryRows(upperCategories)}
				<Table.Tr bg="var(--mantine-color-gray-1)">
					<Table.Td w="1%" px="md" style={{ whiteSpace: "nowrap" }} fw={500}>
						<LabelWithHint
							label={t("scoreTable.sum")}
							hint={gameMode?.upperBonusThreshold}
						/>
					</Table.Td>
					{players.map((player) => (
						<Table.Td key={player.id} ta="center">
							{upperSubtotal(player.id)}
						</Table.Td>
					))}
				</Table.Tr>
				<Table.Tr bg="var(--mantine-color-gray-0)">
					<Table.Td w="1%" px="md" style={{ whiteSpace: "nowrap" }} c="dimmed">
						<LabelWithHint
							label={t("scoreTable.bonus")}
							hint={gameMode?.upperBonusAmount}
						/>
					</Table.Td>
					{players.map((player) => (
						<Table.Td key={player.id} ta="center">
							{bonusFor(player.id)}
						</Table.Td>
					))}
				</Table.Tr>

				{renderCategoryRows(lowerCategories)}

				<Table.Tr>
					<Table.Td w="1%" px="md" style={{ whiteSpace: "nowrap" }} fw={700}>
						<Flex justify="space-between" align="center" gap={16}>
							{t("scoreTable.total")}
							{canToggleTotals && (
								<ActionIcon
									variant="subtle"
									color="gray"
									size="sm"
									onClick={() => setTotalsRevealed((v) => !v)}
									aria-label={
										totalsHidden
											? t("scoreTable.showTotals")
											: t("scoreTable.hideTotals")
									}
								>
									{totalsHidden ? (
										<IconEye size={16} />
									) : (
										<IconEyeOff size={16} />
									)}
								</ActionIcon>
							)}
						</Flex>
					</Table.Td>
					{players.map((player) => (
						<Table.Td key={player.id} ta="center" fw={700}>
							<MaybeBlur hidden={totalsHidden}>
								{grandTotal(player.id)}
							</MaybeBlur>
						</Table.Td>
					))}
				</Table.Tr>
			</Table.Tbody>
		</Table>
	);
}
