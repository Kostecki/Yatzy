import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { client } from "../db/db-client.js";
import {
	categories,
	gameModeCategories,
	players,
	scores,
	sessionCategories,
	sessions,
} from "../db/schema.js";
import { publicProcedure, router } from "../trpc.js";

// Generate a random session code of the specified length using the defined alphabet
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateSessionCode(length = 6): string {
	let code = "";

	for (let i = 0; i < length; i++) {
		code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
	}

	return code;
}

function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

// Define a middleware to check if the provided host token is valid for the given session code
export const hostProcedure = publicProcedure
	.input(z.object({ sessionCode: z.string(), hostToken: z.string() }))
	.use(({ input, next }) => {
		const session = client
			.select({ hostTokenHash: sessions.hostTokenHash })
			.from(sessions)
			.where(eq(sessions.sessionCode, input.sessionCode))
			.get();

		if (!session || hashToken(input.hostToken) !== session.hostTokenHash) {
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
			const sessionCode = generateSessionCode();
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
						hostTokenHash,
						createdAt: new Date(),
					})
					.run();

				playerNames.forEach((name, index) => {
					tx.insert(players)
						.values({
							sessionCode,
							name,
							orderIndex: index,
						})
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
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
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
		}),

	// TODO: Implement
	// onUpdate: publicProcedure.subscription(async ({ input }) => {
	// 	// Implement your session update subscription logic here
	// }),

	submitScore: hostProcedure
		.input(
			z.object({
				playerId: z.string(),
				categoryId: z.string(),
				value: z.number(),
			}),
		)
		.mutation(
			async ({ input: { sessionCode, playerId, categoryId, value } }) => {
				client
					.insert(scores)
					.values({
						sessionCode,
						playerId,
						categoryId,
						value,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: [scores.sessionCode, scores.playerId, scores.categoryId],
						set: { value, updatedAt: new Date() },
					})
					.run();
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
		}),

	endGame: hostProcedure.mutation(async ({ input: { sessionCode } }) => {
		client
			.update(sessions)
			.set({ finishedAt: new Date() })
			.where(eq(sessions.sessionCode, sessionCode))
			.run();
	}),
});
