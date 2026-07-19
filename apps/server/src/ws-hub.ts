import { EventEmitter } from "node:events";

export const sessionEvents = new EventEmitter();

export function broadcastSessionUpdate(sessionCode: string) {
	sessionEvents.emit(`update:${sessionCode}`);
}
