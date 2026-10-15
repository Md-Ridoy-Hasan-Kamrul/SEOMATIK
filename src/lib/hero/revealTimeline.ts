/**
 * Section 2 "Canyon Opening / Hero Reveal" choreography, driven by the same
 * frame position (scroll) as the background. Poses are measured on the
 * reference frames (design px on the 1352×968 page):
 *   x    = ink centre relative to the page centre
 *   y    = cap-height centre from the top
 *   size = font-size, track = letter-spacing in em
 */
import { LAST_FRAME, SECTION2_START_FRAME } from './canyonPlates';
import { lerp, normalize, smoothstep } from './intro';

export interface LinePose {
	x: number;
	y: number;
	size: number;
	track: number;
}

export const HEADLINE_POSES = {
	line1: {
		frame6: { x: -228.5, y: 437.5, size: 76.6, track: 0.0578 },
		frame7: { x: 3.5, y: 297.5, size: 56.74, track: 0.418 },
		frame8: { x: -5, y: 385, size: 43.97, track: 0.2274 },
	},
	line2: {
		frame7: { x: 7.5, y: 371.5, size: 60.99, track: 0.267 },
		frame8: { x: 3, y: 450.5, size: 70.92, track: 0.2155 },
	},
} as const satisfies Record<string, Record<string, LinePose>>;

/** Disciplines, explanation and CTAs sit this much higher in frame 7 than in frame 8. */
export const BODY_SHIFT_FRAME7 = -77;

const F6 = SECTION2_START_FRAME + 1;
const F7 = SECTION2_START_FRAME + 2;

/** [start, end] frame positions of each reveal step (frame 6 = 5, frame 7 = 6). */
export const REVEAL = {
	TAGLINE_OUT: [4.0, 4.35],
	LINE1_WIPE: [4.45, 5.25],
	RULE_DRAW: [4.55, 4.95],
	/** "WE BUILD" travels from its left entrance pose to the centred frame-7 pose. */
	LINE1_MOVE: [5.2, 5.55],
	RULE_OUT: [5.05, 5.25],
	LINE2_WIPE: [5.5, 5.88],
	DISCIPLINES: [5.6, 5.9],
	EXPLANATION: [5.68, 5.95],
	CTAS: [5.76, 6.0],
	/** Section 2 lifts away as the Growth System (section 3) begins. */
	EXIT: [7.0, 7.3],
} as const satisfies Record<string, readonly [number, number]>;

export interface RevealState {
	/** 1 while section 2 is on screen, 0 once it has exited into section 3. */
	presence: number;
	tagline: number;
	line1: LinePose & { wipe: number };
	line2: LinePose & { wipe: number };
	rule: { draw: number; opacity: number };
	disciplines: number;
	explanation: number;
	ctas: number;
	bodyShift: number;
}

function progress(f: number, [start, end]: readonly [number, number]): number {
	return normalize(f, start, end);
}

function lerpPose(a: LinePose, b: LinePose, t: number): LinePose {
	return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), size: lerp(a.size, b.size, t), track: lerp(a.track, b.track, t) };
}

function line1PoseAt(f: number): LinePose {
	const { frame6, frame7, frame8 } = HEADLINE_POSES.line1;
	if (f <= F7) return lerpPose(frame6, frame7, smoothstep(progress(f, REVEAL.LINE1_MOVE)));
	return lerpPose(frame7, frame8, smoothstep(f - F7));
}

function line2PoseAt(f: number): LinePose {
	const { frame7, frame8 } = HEADLINE_POSES.line2;
	return f <= F7 ? frame7 : lerpPose(frame7, frame8, smoothstep(f - F7));
}

function bodyShiftAt(f: number): number {
	return f <= F7 ? BODY_SHIFT_FRAME7 : lerp(BODY_SHIFT_FRAME7, 0, smoothstep(f - F7));
}

export function revealStateAt(framePos: number): RevealState {
	const f = Math.min(Math.max(framePos, 0), LAST_FRAME);
	return {
		tagline: 1 - progress(f, REVEAL.TAGLINE_OUT),
		line1: { ...line1PoseAt(f), wipe: progress(f, REVEAL.LINE1_WIPE) },
		line2: { ...line2PoseAt(f), wipe: progress(f, REVEAL.LINE2_WIPE) },
		rule: { draw: progress(f, REVEAL.RULE_DRAW), opacity: 1 - progress(f, REVEAL.RULE_OUT) },
		disciplines: progress(f, REVEAL.DISCIPLINES),
		explanation: progress(f, REVEAL.EXPLANATION),
		ctas: progress(f, REVEAL.CTAS),
		bodyShift: bodyShiftAt(f),
		presence: 1 - progress(f, REVEAL.EXIT),
	};
}
