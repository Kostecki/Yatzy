export type RememberedSession =
	| { code: string; role: "host" }
	| { code: string; role: "player"; playerId: string };

const HOST_PREFIX = "yatzy:host:";
const PLAYER_PREFIX = "yatzy:player:";

export function getRememberedSessions(): RememberedSession[] {
	const byCode = new Map<string, RememberedSession>();

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key) continue;

		if (key.startsWith(HOST_PREFIX)) {
			const code = key.slice(HOST_PREFIX.length);
			byCode.set(code, { code, role: "host" });
		} else if (key.startsWith(PLAYER_PREFIX)) {
			const code = key.slice(PLAYER_PREFIX.length);
			if (!byCode.has(code)) continue;

			const playerId = localStorage.getItem(key);
			if (playerId) {
				byCode.set(code, { code, role: "player", playerId });
			}
		}
	}

	return Array.from(byCode.values());
}

export function forgetSession(code: string) {
	localStorage.removeItem(`${HOST_PREFIX}${code}`);
	localStorage.removeItem(`${PLAYER_PREFIX}${code}`);
}
