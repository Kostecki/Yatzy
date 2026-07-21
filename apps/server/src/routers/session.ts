import crypto from "node:crypto";
import { on } from "node:events";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

import { client } from "../db/db-client.js";
import {
	categories,
	gameModeCategories,
	hostTokens,
	players,
	scores,
	sessionCategories,
	sessions,
} from "../db/schema.js";
import { primitives } from "../scoring/primitives.js";
import { publicProcedure, router } from "../trpc.js";
import { broadcastSessionUpdate, sessionEvents } from "../ws-hub.js";

// Generate a random session code of the specified length using the defined character set
const CODE_ALPHABET = "0123456789";
function generateSessionCode(length = 6): string {
	let code = "";

	for (let i = 0; i < length; i++) {
		code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
	}

	return code;
}

// Generate a unique session code by checking against existing session codes in the database
function generateUniqueSessionCode(): string {
	const maxAttempts = 20;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const code = generateSessionCode();
		const existing = client
			.select({ sessionCode: sessions.sessionCode })
			.from(sessions)
			.where(eq(sessions.sessionCode, code))
			.get();

		if (!existing) {
			return code;
		}
	}

	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "Could not generate a unique session code",
	});
}

// Hash the provided token using SHA-256 and return the hexadecimal representation
function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

// Retrieve the full state of a session, including its details, players, categories, and scores
function getFullSessionState(sessionCode: string) {
	const session = client
		.select({
			sessionCode: sessions.sessionCode,
			gameModeId: sessions.gameModeId,
			createdAt: sessions.createdAt,
			finishedAt: sessions.finishedAt,
		})
		.from(sessions)
		.where(eq(sessions.sessionCode, sessionCode))
		.get();

	if (!session) {
		return undefined;
	}

	const sessionPlayers = client
		.select()
		.from(players)
		.where(eq(players.sessionCode, sessionCode))
		.orderBy(players.orderIndex)
		.all();

	const sessionCategoryList = client
		.select({
			id: categories.id,
			label: categories.label,
			labelOverride: sessionCategories.labelOverride,
			description: categories.description,
			primitive: categories.primitive,
			params: categories.params,
			exampleDice: categories.exampleDice,
			section: categories.section,
			orderIndex: sessionCategories.orderIndex,
		})
		.from(sessionCategories)
		.innerJoin(categories, eq(sessionCategories.categoryId, categories.id))
		.where(eq(sessionCategories.sessionCode, sessionCode))
		.orderBy(sessionCategories.orderIndex)
		.all();

	const sessionScores = client
		.select()
		.from(scores)
		.where(eq(scores.sessionCode, sessionCode))
		.all();

	return {
		session,
		players: sessionPlayers,
		categories: sessionCategoryList,
		scores: sessionScores,
	};
}

// Define a middleware to check if the provided host token is valid for the given session code
export const hostProcedure = publicProcedure
	.input(z.object({ sessionCode: z.string(), hostToken: z.string() }))
	.use(({ input, next }) => {
		const match = client
			.select({ tokenHash: hostTokens.tokenHash })
			.from(hostTokens)
			.where(
				and(
					eq(hostTokens.sessionCode, input.sessionCode),
					eq(hostTokens.tokenHash, hashToken(input.hostToken)),
				),
			)
			.get();

		if (!match) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message:
					"Invalid host token for the given session code or session does not exist",
			});
		}
		return next();
	});

export const sessionRouter = router({
	create: publicProcedure
		.input(
			z.object({ gameModeId: z.string(), playerNames: z.array(z.string()) }),
		)
		.mutation(async ({ input: { gameModeId, playerNames } }) => {
			const sessionCode = generateUniqueSessionCode();
			const hostToken = crypto.randomUUID();
			const hostTokenHash = hashToken(hostToken);

			client.transaction((tx) => {
				const modeCategories = tx
					.select()
					.from(gameModeCategories)
					.where(eq(gameModeCategories.gameModeId, gameModeId))
					.all();

				tx.insert(sessions)
					.values({
						sessionCode,
						gameModeId,
						createdAt: new Date(),
					})
					.run();

				tx.insert(hostTokens)
					.values({
						sessionCode,
						tokenHash: hostTokenHash,
						createdAt: new Date(),
					})
					.run();

				playerNames.forEach((name, index) => {
					tx.insert(players)
						.values({ sessionCode, name, orderIndex: index })
						.run();
				});

				tx.insert(sessionCategories)
					.values(
						modeCategories.map((mc) => ({
							sessionCode,
							categoryId: mc.categoryId,
							orderIndex: mc.orderIndex,
							labelOverride: mc.labelOverride,
						})),
					)
					.run();
			});

			return { sessionCode, hostToken };
		}),

	get: publicProcedure
		.input(z.object({ sessionCode: z.string() }))
		.query(async ({ input: { sessionCode } }) => {
			const state = getFullSessionState(sessionCode);
			if (!state) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			return state;
		}),

	onUpdate: publicProcedure
		.input(z.object({ sessionCode: z.string() }))
		.subscription(async function* ({ input: { sessionCode }, signal }) {
			yield getFullSessionState(sessionCode);

			for await (const _ of on(sessionEvents, `update:${sessionCode}`, {
				signal,
			})) {
				yield getFullSessionState(sessionCode);
			}
		}),

	previewScores: publicProcedure
		.input(
			z.object({
				sessionCode: z.string(),
				diceCounts: z.array(z.number()).length(6),
			}),
		)
		.query(async ({ input: { sessionCode, diceCounts } }) => {
			const dice = diceCounts.flatMap((count, index) =>
				Array(count).fill(index + 1),
			);

			const sessionCategoryList = client
				.select({
					id: categories.id,
					primitive: categories.primitive,
					params: categories.params,
				})
				.from(sessionCategories)
				.innerJoin(categories, eq(sessionCategories.categoryId, categories.id))
				.where(eq(sessionCategories.sessionCode, sessionCode))
				.all();

			return sessionCategoryList.map((category) => ({
				categoryId: category.id,
				value: primitives[category.primitive](dice, category.params as never),
			}));
		}),

	submitScore: hostProcedure
		.input(
			z.object({
				playerId: z.string(),
				categoryId: z.string(),
				value: z.number(),
				dice: z.array(z.number()).optional(),
			}),
		)
		.mutation(
			async ({ input: { sessionCode, playerId, categoryId, value, dice } }) => {
				client
					.insert(scores)
					.values({
						sessionCode,
						playerId,
						categoryId,
						value,
						dice: dice ?? null,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: [scores.sessionCode, scores.playerId, scores.categoryId],
						set: { value, dice: dice ?? null, updatedAt: new Date() },
					})
					.run();

				broadcastSessionUpdate(sessionCode);
			},
		),

	addPlayer: hostProcedure
		.input(z.object({ name: z.string() }))
		.mutation(async ({ input: { sessionCode, name } }) => {
			const existingPlayers = client
				.select()
				.from(players)
				.where(eq(players.sessionCode, sessionCode))
				.all();

			client
				.insert(players)
				.values({ sessionCode, name, orderIndex: existingPlayers.length })
				.run();

			broadcastSessionUpdate(sessionCode);
		}),

	renamePlayer: hostProcedure
		.input(z.object({ playerId: z.string(), name: z.string() }))
		.mutation(async ({ input: { sessionCode, playerId, name } }) => {
			client
				.update(players)
				.set({ name })
				.where(
					and(eq(players.id, playerId), eq(players.sessionCode, sessionCode)),
				)
				.run();

			broadcastSessionUpdate(sessionCode);
		}),

	removePlayer: hostProcedure
		.input(z.object({ playerId: z.string() }))
		.mutation(async ({ input: { sessionCode, playerId } }) => {
			client
				.delete(players)
				.where(
					and(eq(players.id, playerId), eq(players.sessionCode, sessionCode)),
				)
				.run();

			broadcastSessionUpdate(sessionCode);
		}),

	endGame: hostProcedure.mutation(async ({ input: { sessionCode } }) => {
		client
			.update(sessions)
			.set({ finishedAt: new Date() })
			.where(eq(sessions.sessionCode, sessionCode))
			.run();

		broadcastSessionUpdate(sessionCode);
	}),

	listFinished: publicProcedure.query(async () => {
		const finishedSessions = client
			.select({
				sessionCode: sessions.sessionCode,
				gameModeId: sessions.gameModeId,
				createdAt: sessions.createdAt,
				finishedAt: sessions.finishedAt,
			})
			.from(sessions)
			.where(isNotNull(sessions.finishedAt))
			.orderBy(desc(sessions.finishedAt))
			.all();

		return finishedSessions.map((session) => {
			const sessionPlayers = client
				.select()
				.from(players)
				.where(eq(players.sessionCode, session.sessionCode))
				.orderBy(players.orderIndex)
				.all();

			const sessionCategoryList = client
				.select({ id: categories.id, section: categories.section })
				.from(sessionCategories)
				.innerJoin(categories, eq(sessionCategories.categoryId, categories.id))
				.where(eq(sessionCategories.sessionCode, session.sessionCode))
				.all();

			const sessionScores = client
				.select()
				.from(scores)
				.where(eq(scores.sessionCode, session.sessionCode))
				.all();

			return {
				...session,
				players: sessionPlayers,
				categories: sessionCategoryList,
				scores: sessionScores,
			};
		});
	}),

	claimHost: publicProcedure
		.input(z.object({ sessionCode: z.string() }))
		.mutation(async ({ input: { sessionCode } }) => {
			const session = client
				.select({ sessionCode: sessions.sessionCode })
				.from(sessions)
				.where(eq(sessions.sessionCode, sessionCode))
				.get();

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			const hostToken = crypto.randomUUID();
			client
				.insert(hostTokens)
				.values({
					sessionCode,
					tokenHash: hashToken(hostToken),
					createdAt: new Date(),
				})
				.run();

			return { hostToken };
		}),
});
