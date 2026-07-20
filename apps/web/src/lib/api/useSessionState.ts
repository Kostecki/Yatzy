import { useState } from "react";

import { trpc } from "./trpc";
import type { RouterOutputs } from "./types";

export type SessionState = RouterOutputs["session"]["get"];
export type GameMode = RouterOutputs["catalog"]["listGameModes"][number];

export function useSessionState(sessionCode: string) {
	const [sessionState, setSessionState] = useState<SessionState | undefined>(
		undefined,
	);
	const [subscriptionError, setSubscriptionError] = useState<
		string | undefined
	>(undefined);

	trpc.session.onUpdate.useSubscription(
		{ sessionCode },
		{
			onData: (data) => setSessionState(data),
			onError: (err) => setSubscriptionError(err.message),
		},
	);

	const gameModes = trpc.catalog.listGameModes.useQuery();
	const gameMode = gameModes.data?.find(
		(mode) => mode.id === sessionState?.session.gameModeId,
	);

	return { sessionState, subscriptionError, gameMode };
}
