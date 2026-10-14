import { useLayoutEffect, useRef } from 'react';

/** Ref that always holds the latest value, for long-lived loops that must not restart. */
export function useLatestRef<T>(value: T) {
	const ref = useRef(value);
	useLayoutEffect(() => {
		ref.current = value;
	});
	return ref;
}
