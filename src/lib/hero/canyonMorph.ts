/**
 * Pure maths for the canyon morph. The fragment shader mirrors `evalEdge` and
 * `warpX`; everything else runs on the CPU once per frame.
 */
import {
	CANYON_PLATES,
	EDGE_V_MAX,
	LAST_FRAME,
	SECTION2_START_FRAME,
	SECTION3_START_FRAME,
	WORDMARK_FADE_OUT_END,
	WORDMARK_POSES,
} from './canyonPlates';
import type { EdgeCurve, WordmarkPose } from './canyonPlates';
import { clamp01, lerp, normalize, smoothstep } from './intro';

export const SCROLL = {
	/** Track height in vh: one sticky screen + the scrub distance for frames 1→10. */
	TRACK_VH: 960,
	/** Progress kept on frame 1 before the canyon starts to open. */
	HOLD_START: 0.03,
	/** Progress at which frame 10 is reached; the rest of the track holds the final layout. */
	HOLD_END: 0.92,
	/** Per-second smoothing toward the scroll target (higher = snappier). */
	DAMPING: 9,
} as const;

export const CAMERA = {
	/** Extra zoom of the outgoing plate across one section-2 segment ("camera pushes forward"). */
	PUSH_MAX: 0.06,
	/** Mouse parallax amplitude on the foreground rocks, as a fraction of the image width. */
	PARALLAX_MAX: 0.006,
	/** Section 3 plate changes finish this far into their segment, leaving room for the reveal. */
	S3_DISSOLVE_END: 0.45,
} as const;

export interface FrameSegment {
	from: number;
	to: number;
	t: number;
}

export interface GapEdges {
	left: number;
	right: number;
}

export function evalEdge(curve: EdgeCurve, v: number): number {
	const vv = Math.min(Math.max(v, 0), EDGE_V_MAX);
	return curve[0] + curve[1] * vv + curve[2] * vv * vv;
}

export function frameSegment(framePos: number): FrameSegment {
	const pos = Number.isNaN(framePos) ? 0 : Math.min(Math.max(framePos, 0), LAST_FRAME);
	const from = Math.min(Math.floor(pos), LAST_FRAME - 1);
	return { from, to: from + 1, t: pos - from };
}

export function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
	const t2 = t * t;
	const t3 = t2 * t;
	return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t3);
}

/** Smooth (C1) path through every keyframe curve, coefficient by coefficient. */
export function interpolateCurve(curves: readonly EdgeCurve[], framePos: number): EdgeCurve {
	const { from, to, t } = frameSegment(framePos);
	const before = curves[Math.max(from - 1, 0)];
	const after = curves[Math.min(to + 1, curves.length - 1)];
	const coef = (k: number) => catmullRom(before[k], curves[from][k], curves[to][k], after[k], t);
	return [coef(0), coef(1), coef(2)];
}

/**
 * Piecewise-linear x warp: for a pixel laid out with `dst` gap edges, return
 * where to sample an image whose gap edges are `src`. Screen borders stay pinned.
 */
export function warpX(x: number, src: GapEdges, dst: GapEdges): number {
	if (x < dst.left) return (x * src.left) / dst.left;
	if (x > dst.right) return src.right + ((x - dst.right) * (1 - src.right)) / (1 - dst.right);
	return src.left + ((x - dst.left) * (src.right - src.left)) / (dst.right - dst.left);
}

export function crossfadeWeight(t: number): number {
	return smoothstep(t);
}

/** Fraction of the image visible on each axis when it covers the viewport. */
export function coverScale(viewAspect: number, imageAspect: number): { x: number; y: number } {
	if (viewAspect >= imageAspect) return { x: 1, y: imageAspect / viewAspect };
	return { x: viewAspect / imageAspect, y: 1 };
}

/** 0 → 1 as the sticky hero track scrolls past (from `getBoundingClientRect`). */
export function scrollProgress(sectionTop: number, sectionHeight: number, viewportHeight: number): number {
	const scrollable = sectionHeight - viewportHeight;
	if (scrollable <= 0) return 0;
	return clamp01(-sectionTop / scrollable);
}

export function framePosFromProgress(progress: number): number {
	return normalize(progress, SCROLL.HOLD_START, SCROLL.HOLD_END) * LAST_FRAME;
}

/** Opacity follows the keyframes, except the frame-6 ghost leaves early (by WORDMARK_FADE_OUT_END). */
function wordmarkOpacityAt(framePos: number): number {
	const ghostFrame = SECTION2_START_FRAME + 1;
	if (framePos > ghostFrame) {
		return lerp(WORDMARK_POSES[ghostFrame].opacity, 0, normalize(framePos, ghostFrame, WORDMARK_FADE_OUT_END));
	}
	const { from, to, t } = frameSegment(framePos);
	return lerp(WORDMARK_POSES[from].opacity, WORDMARK_POSES[to].opacity, t);
}

export function wordmarkPoseAt(framePos: number): WordmarkPose {
	const { from, to, t } = frameSegment(framePos);
	return {
		shiftYEm: lerp(WORDMARK_POSES[from].shiftYEm, WORDMARK_POSES[to].shiftYEm, t),
		scale: lerp(WORDMARK_POSES[from].scale, WORDMARK_POSES[to].scale, t),
		opacity: wordmarkOpacityAt(framePos),
	};
}

/**
 * Zoom applied to the outgoing plate while it dissolves into the next one. Only
 * in section 2, and 1 at every keyframe so each reference frame stays exact.
 */
/** Segment fraction driving the plate change: whole segment in sections 1–2, early window in section 3. */
function dissolveT(framePos: number): { from: number; t: number } {
	const { from, t } = frameSegment(framePos);
	return { from, t: from >= SECTION3_START_FRAME ? normalize(t, 0, CAMERA.S3_DISSOLVE_END) : t };
}

/** Weight of the incoming plate. */
export function crossfadeAt(framePos: number): number {
	return crossfadeWeight(dissolveT(framePos).t);
}

export function cameraPushAt(framePos: number): number {
	const { from, t } = dissolveT(framePos);
	if (from < SECTION2_START_FRAME || t >= 1) return 1;
	return 1 + CAMERA.PUSH_MAX * smoothstep(t);
}

/** Canyon edge warp applies while the gap opens; plates 9/10 are a new composition. */
export function warpAt(framePos: number): number {
	return framePos <= SECTION3_START_FRAME ? 1 : 0;
}

/** Mouse parallax fades in with the reveal; the intro stays perfectly still. */
export function parallaxStrengthAt(framePos: number): number {
	return smoothstep(normalize(framePos, SECTION2_START_FRAME, SECTION2_START_FRAME + 1));
}

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dtSeconds: number): number {
	return lerp(current, target, 1 - Math.exp(-lambda * dtSeconds));
}

export const PLATE_LEFT_EDGES: readonly EdgeCurve[] = CANYON_PLATES.map((p) => p.left);
export const PLATE_RIGHT_EDGES: readonly EdgeCurve[] = CANYON_PLATES.map((p) => p.right);
