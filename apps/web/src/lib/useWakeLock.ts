import { useEffect } from "react";

// Screen Wake Lock API isn't supported everywhere (notably Firefox) and is
// released automatically whenever the tab loses visibility — best-effort
// only, re-acquired on return as long as this component stays mounted.
export function useWakeLock() {
	useEffect(() => {
		if (!("wakeLock" in navigator)) return;

		let sentinel: WakeLockSentinel | undefined;
		let cancelled = false;

		async function acquire() {
			try {
				sentinel = await navigator.wakeLock.request("screen");
			} catch {
				// Ignored: e.g. battery saver or an unsupported/insecure context —
				// nothing to recover from, the screen just locks normally.
			}
		}

		function handleVisibilityChange() {
			if (document.visibilityState === "visible" && !cancelled) {
				acquire();
			}
		}

		acquire();
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			cancelled = true;
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			sentinel?.release();
		};
	}, []);
}
