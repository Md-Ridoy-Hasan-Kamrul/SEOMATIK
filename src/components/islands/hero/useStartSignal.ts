import { useEffect, useState } from 'react';

/** True once `ready` flips — or after `timeoutMs`, so a slow asset never blocks the entrance. */
export function useStartSignal(ready: boolean, timeoutMs: number): boolean {
	const [timedOut, setTimedOut] = useState(false);
	useEffect(() => {
		const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
		return () => window.clearTimeout(id);
	}, [timeoutMs]);
	return ready || timedOut;
}
