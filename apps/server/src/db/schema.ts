import crypto from "node:crypto";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const gameModes = sqliteTable("game_modes", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	diceCount: integer("dice_count").notNull(),
	isBuiltin: integer("is_builtin", { mode: "boolean" })
		.notNull()
		.default(false),
	upperBonusThreshold: integer("upper_bonus_threshold").notNull(),
	upperBonusAmount: integer("upper_bonus_amount").notNull(),
});

export const categories = sqliteTable("categories", {
	id: text("id").primaryKey(),
	label: text("label"),
	description: text("description").notNull(),
	params: text("params", { mode: "json" }).notNull(),
	exampleDice: text("example_dice", { mode: "json" }),
	section: text("section", { enum: ["upper", "lower"] }).notNull(),
	primitive: text("primitive", {
		enum: [
			"sum_of_face",
			"n_of_a_kind_sum",
			"n_groups_of_size",
			"two_groups_sizes",
			"straight",
			"straight_plus_extra",
			"chance",
			"yatzy",
		],
	}).notNull(),
});

export const gameModeCategories = sqliteTable(
	"game_mode_categories",
	{
		gameModeId: text("game_mode_id")
			.references(() => gameModes.id, {
				onDelete: "cascade",
			})
			.notNull(),
		categoryId: text("category_id")
			.references(() => categories.id, { onDelete: "cascade" })
			.notNull(),
		labelOverride: text("label_override"),
		orderIndex: integer("order_index").notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.gameModeId, t.categoryId] }),
	}),
);

export const sessions = sqliteTable("sessions", {
	sessionCode: text("code").primaryKey(),
	gameModeId: text("game_mode_id")
		.references(() => gameModes.id, { onDelete: "cascade" })
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	finishedAt: integer("finished_at", { mode: "timestamp" }),
});

export const sessionCategories = sqliteTable(
	"session_categories",
	{
		sessionCode: text("session_code")
			.references(() => sessions.sessionCode, { onDelete: "cascade" })
			.notNull(),
		categoryId: text("category_id")
			.references(() => categories.id, { onDelete: "cascade" })
			.notNull(),
		labelOverride: text("label_override"),
		orderIndex: integer("order_index").notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.sessionCode, t.categoryId] }),
	}),
);

export const players = sqliteTable("players", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	sessionCode: text("session_code")
		.references(() => sessions.sessionCode, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull(),
	orderIndex: integer("order_index").notNull(),
});

export const scores = sqliteTable(
	"scores",
	{
		sessionCode: text("session_code")
			.references(() => sessions.sessionCode, { onDelete: "cascade" })
			.notNull(),
		playerId: text("player_id")
			.references(() => players.id, { onDelete: "cascade" })
			.notNull(),
		categoryId: text("category_id")
			.references(() => categories.id, { onDelete: "cascade" })
			.notNull(),
		value: integer("value"),
		updatedAt: integer("updated_at", { mode: "timestamp" }),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.sessionCode, t.playerId, t.categoryId] }),
	}),
);

export const hostTokens = sqliteTable(
	"host_tokens",
	{
		sessionCode: text("session_code")
			.references(() => sessions.sessionCode, { onDelete: "cascade" })
			.notNull(),
		tokenHash: text("token_hash").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => ({ pk: primaryKey({ columns: [t.sessionCode, t.tokenHash] }) }),
);
