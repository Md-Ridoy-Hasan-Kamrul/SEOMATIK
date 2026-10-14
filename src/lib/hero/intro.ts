/**
 * Hero "canyon opening" intro — pure, framework-free math.
 *
 * Reference frames (public/assets/hero/Picture1..5.png) map to a single
 * normalized `progress` in [0, 1]:
 *   0.00  sealed     — walls touching, only a hairline light slit
 *   0.12  slit       — slit glows, SEOMATIK fades in
 *   0.35  surfacing  — rock surface detail resolves, fog begins to drift
 *   0.65  opening    — gorge widens, sky + reflection appear
 *   0.90  revealed   — canyon fully open, bright sky, spires
 *
 * Every tunable lives here as a named constant so islands stay magic-number free.
 */

export const HERO_STAGES = [
	'sealed',
	'slit',
	'surfacing',
	'opening',
	'revealed',
] as const;

export type HeroStage = (typeof HERO_STAGES)[number];

/** Lower progress bound at which each stage becomes active. */
export const STAGE_THRESHOLDS: Record<HeroStage, number> = {
	sealed: 0,
	slit: 0.12,
	surfacing: 0.35,
	opening: 0.65,
	revealed: 0.9,
};

/** Layer limits, expressed in viewport units, tuned against the 5 frames. */
export const WALL_MAX_SHIFT_VW = 55;
export const BEAM_MIN_WIDTH_VW = 0.6;
export const BEAM_MAX_WIDTH_VW = 42;
export const WORDMARK_MIN_SCALE = 1;
export const WORDMARK_MAX_SCALE = 1.06;

/** Progress window over which the sky/reflection cross-fades in. */
export const SKY_FADE_START = 0.3;
export const SKY_FADE_END = 0.85;
/** The wet-floor reflection trails the sky reveal by this much progress. */
export const FLOOR_TRAIL_OFFSET = 0.1;

/** Clamp any number into the inclusive [0, 1] range. */
export function clamp01(value: number): number {
	if (Number.isNaN(value)) return 0;
	if (value < 0) return 0;
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

/** Resolve the active stage label for a given progress. */
export function getStageFromProgress(progress: number): HeroStage {
	const p = clamp01(progress);
	let active: HeroStage = HERO_STAGES[0];
	for (const stage of HERO_STAGES) {
		if (p >= STAGE_THRESHOLDS[stage]) active = stage;
	}
	return active;
}

/** Outward shift (vw) applied to each wall; 0 when sealed, max when revealed. */
export function getWallShiftVw(progress: number): number {
	return lerp(0, WALL_MAX_SHIFT_VW, smoothstep(clamp01(progress)));
}

/** Width (vw) of the central light beam as the gorge opens. */
export function getBeamWidthVw(progress: number): number {
	return lerp(BEAM_MIN_WIDTH_VW, BEAM_MAX_WIDTH_VW, smoothstep(clamp01(progress)));
}

/** Opacity 0..1 of the revealed sky + spires layer. */
export function getSkyOpacity(progress: number): number {
	return smoothstep(normalize(clamp01(progress), SKY_FADE_START, SKY_FADE_END));
}

/** Opacity 0..1 of the wet-floor reflection, trailing the sky slightly. */
export function getFloorOpacity(progress: number): number {
	const start = SKY_FADE_START + FLOOR_TRAIL_OFFSET;
	return smoothstep(normalize(clamp01(progress), start, 1));
}

/** Subtle scale applied to the SEOMATIK wordmark across the open. */
export function getWordmarkScale(progress: number): number {
	return lerp(WORDMARK_MIN_SCALE, WORDMARK_MAX_SCALE, smoothstep(clamp01(progress)));
}
