/** Framework-free easing/range helpers shared by the hero modules. */

/** Clamp any number into the inclusive [0, 1] range. */
export function clamp01(value: number): number {
	if (Number.isNaN(value) || value <= 0) return 0;
	if (value > 1) return 1;
	return value;
}

/** Linear interpolation between `from` and `to` at ratio `t` (unclamped). */
export function lerp(from: number, to: number, t: number): number {
	return from + (to - from) * t;
}

/** Smoothstep easing (C1-continuous) for 0..1 input. */
export function smoothstep(t: number): number {
	const clamped = clamp01(t);
	return clamped * clamped * (3 - 2 * clamped);
}

/** Normalize a value inside [start, end] to 0..1, clamped. */
export function normalize(value: number, start: number, end: number): number {
	if (end === start) return value >= end ? 1 : 0;
	return clamp01((value - start) / (end - start));
}
