import { describe, expect, it } from 'vitest';
import {
	CANYON_PLATES,
	EDGE_V_MAX,
	LAST_FRAME,
	SECTION2_START_FRAME,
	SECTION3_START_FRAME,
	SECTION4_DWELL,
	SECTION4_START_FRAME,
	WORDMARK_FADE_OUT_END,
	WORDMARK_POSES,
} from './canyonPlates';
import {
	CAMERA,
	cameraPushAt,
	catmullRom,
	crossfadeAt,
	warpAt,
	parallaxStrengthAt,
	coverScale,
	crossfadeWeight,
	damp,
	evalEdge,
	frameAnchorVh,
	frameSegment,
	framePosFromProgress,
	interpolateCurve,
	SCROLL,
	scrollProgress,
	warpX,
	wordmarkPoseAt,
} from './canyonMorph';

const LEFTS = CANYON_PLATES.map((p) => p.left);
const RIGHTS = CANYON_PLATES.map((p) => p.right);

describe('evalEdge', () => {
	it('evaluates x = a + b·v + c·v²', () => {
		expect(evalEdge([0.5, 0.1, -0.2], 0.5)).toBeCloseTo(0.5 + 0.05 - 0.05, 10);
	});

	it('holds the edge constant below EDGE_V_MAX (walls meet the floor there)', () => {
		const curve = CANYON_PLATES[3].left;
		expect(evalEdge(curve, 0.95)).toBeCloseTo(evalEdge(curve, EDGE_V_MAX), 10);
	});

	it('clamps negative v to the top row', () => {
		const curve = CANYON_PLATES[2].right;
		expect(evalEdge(curve, -0.4)).toBeCloseTo(evalEdge(curve, 0), 10);
	});
});

describe('frameSegment', () => {
	it('splits a frame position into neighbouring plates + fraction', () => {
		expect(frameSegment(0)).toEqual({ from: 0, to: 1, t: 0 });
		expect(frameSegment(1.25)).toEqual({ from: 1, to: 2, t: 0.25 });
	});

	it('lands exactly on the last plate at the end', () => {
		expect(frameSegment(LAST_FRAME)).toEqual({ from: LAST_FRAME - 1, to: LAST_FRAME, t: 1 });
	});

	it('clamps out-of-range and NaN input', () => {
		expect(frameSegment(-3)).toEqual({ from: 0, to: 1, t: 0 });
		expect(frameSegment(99)).toEqual({ from: LAST_FRAME - 1, to: LAST_FRAME, t: 1 });
		expect(frameSegment(Number.NaN)).toEqual({ from: 0, to: 1, t: 0 });
	});
});

describe('catmullRom', () => {
	it('passes through the inner control points', () => {
		expect(catmullRom(0, 1, 3, 4, 0)).toBe(1);
		expect(catmullRom(0, 1, 3, 4, 1)).toBe(3);
	});

	it('is linear for evenly spaced points', () => {
		expect(catmullRom(0, 1, 2, 3, 0.5)).toBeCloseTo(1.5, 10);
	});
});

describe('interpolateCurve', () => {
	it('returns each plate curve exactly at its keyframe', () => {
		for (let i = 0; i <= LAST_FRAME; i++) {
			const curve = interpolateCurve(LEFTS, i);
			LEFTS[i].forEach((coef, k) => expect(curve[k]).toBeCloseTo(coef, 10));
		}
	});

	it('never lets the edges cross while morphing between keyframes', () => {
		for (let f = 0; f <= LAST_FRAME; f += 0.05) {
			const l = interpolateCurve(LEFTS, f);
			const r = interpolateCurve(RIGHTS, f);
			for (let v = 0; v <= EDGE_V_MAX; v += 0.05) {
				expect(evalEdge(r, v) - evalEdge(l, v), `f=${f.toFixed(2)} v=${v.toFixed(2)}`).toBeGreaterThan(0);
			}
		}
	});
});

describe('warpX', () => {
	const src = { left: 0.45, right: 0.52 };
	const dst = { left: 0.4, right: 0.6 };

	it('is the identity when source and destination layouts match', () => {
		for (const x of [0, 0.2, 0.47, 0.8, 1]) expect(warpX(x, src, src)).toBeCloseTo(x, 10);
	});

	it('maps destination edges onto source edges and pins the screen borders', () => {
		expect(warpX(dst.left, src, dst)).toBeCloseTo(src.left, 10);
		expect(warpX(dst.right, src, dst)).toBeCloseTo(src.right, 10);
		expect(warpX(0, src, dst)).toBe(0);
		expect(warpX(1, src, dst)).toBeCloseTo(1, 10);
	});

	it('is monotonic (no folding or tearing)', () => {
		let prev = -1;
		for (let x = 0; x <= 1.0001; x += 0.01) {
			const w = warpX(x, src, dst);
			expect(w).toBeGreaterThanOrEqual(prev);
			prev = w;
		}
	});
});

describe('crossfadeWeight', () => {
	it('eases 0 → 1 with a symmetric midpoint', () => {
		expect(crossfadeWeight(0)).toBe(0);
		expect(crossfadeWeight(1)).toBe(1);
		expect(crossfadeWeight(0.5)).toBeCloseTo(0.5, 10);
		expect(crossfadeWeight(0.25)).toBeLessThan(0.25);
	});
});

describe('coverScale', () => {
	it('shows the full image at the design aspect', () => {
		expect(coverScale(1.4, 1.4)).toEqual({ x: 1, y: 1 });
	});

	it('crops vertically on wider screens and horizontally on taller ones', () => {
		const wide = coverScale(2.8, 1.4);
		expect(wide.x).toBe(1);
		expect(wide.y).toBeCloseTo(0.5, 10);
		const tall = coverScale(0.7, 1.4);
		expect(tall.x).toBeCloseTo(0.5, 10);
		expect(tall.y).toBe(1);
	});
});

describe('scrollProgress', () => {
	it('is 0 before the hero scrolls and 1 when its track is consumed', () => {
		expect(scrollProgress(0, 4000, 1000)).toBe(0);
		expect(scrollProgress(200, 4000, 1000)).toBe(0);
		expect(scrollProgress(-1500, 4000, 1000)).toBeCloseTo(0.5, 10);
		expect(scrollProgress(-3000, 4000, 1000)).toBe(1);
		expect(scrollProgress(-9000, 4000, 1000)).toBe(1);
	});

	it('is safe when the section is not taller than the viewport', () => {
		expect(scrollProgress(-10, 800, 1000)).toBe(0);
	});
});

describe('framePosFromProgress', () => {
	it('holds frame 1 at the start and frame 5 at the end of the track', () => {
		expect(framePosFromProgress(0)).toBe(0);
		expect(framePosFromProgress(SCROLL.HOLD_START)).toBe(0);
		expect(framePosFromProgress(SCROLL.HOLD_END)).toBe(LAST_FRAME);
		expect(framePosFromProgress(1)).toBe(LAST_FRAME);
	});

	it('is monotonic in between', () => {
		expect(framePosFromProgress(0.3)).toBeLessThan(framePosFromProgress(0.6));
	});
});

describe('cameraPushAt', () => {
	it('does not zoom while the canyon is still opening (frames 1–5)', () => {
		for (let f = 0; f <= SECTION2_START_FRAME; f += 0.25) expect(cameraPushAt(f)).toBe(1);
	});

	it('pushes the outgoing plate forward during section 2, exact at keyframes', () => {
		expect(cameraPushAt(SECTION2_START_FRAME + 0.5)).toBeGreaterThan(1);
		expect(cameraPushAt(SECTION2_START_FRAME + 0.5)).toBeLessThanOrEqual(1 + CAMERA.PUSH_MAX);
		expect(cameraPushAt(SECTION2_START_FRAME + 0.25)).toBeLessThan(cameraPushAt(SECTION2_START_FRAME + 0.75));
		expect(cameraPushAt(SECTION2_START_FRAME + 1)).toBe(1);
	});

	it('holds still once the search panels are live (they are anchored to the plates)', () => {
		for (let f = SECTION4_START_FRAME + 1; f <= LAST_FRAME; f += 0.1) expect(cameraPushAt(f)).toBe(1);
	});
});

describe('crossfadeAt', () => {
	it('dissolves across the whole segment while the canyon opens', () => {
		expect(crossfadeAt(2.5)).toBeCloseTo(crossfadeWeight(0.5), 10);
	});

	it('finishes the plate change early in section 3 so the scene is clean for the reveal', () => {
		const f = SECTION3_START_FRAME + CAMERA.S3_DISSOLVE_END;
		expect(crossfadeAt(f)).toBe(1);
		expect(crossfadeAt(SECTION3_START_FRAME + 0.9)).toBe(1);
		expect(crossfadeAt(SECTION3_START_FRAME)).toBe(0);
	});
});

describe('section 4 dissolve', () => {
	it('keeps Picture10 on screen during the dwell, then changes plates', () => {
		expect(crossfadeAt(SECTION4_START_FRAME + SECTION4_DWELL)).toBe(0);
		expect(crossfadeAt(SECTION4_START_FRAME + 0.9)).toBe(1);
	});
});

describe('warpAt', () => {
	it('warps the canyon edges up to frame 8, then switches off (plates 9/10 are not a canyon gap)', () => {
		expect(warpAt(3)).toBe(1);
		expect(warpAt(SECTION3_START_FRAME)).toBe(1);
		expect(warpAt(SECTION3_START_FRAME + 0.01)).toBe(0);
	});
});

describe('parallaxStrengthAt', () => {
	it('keeps the intro still and ramps in as the reveal starts', () => {
		expect(parallaxStrengthAt(0)).toBe(0);
		expect(parallaxStrengthAt(SECTION2_START_FRAME)).toBe(0);
		expect(parallaxStrengthAt(SECTION2_START_FRAME + 0.5)).toBeGreaterThan(0);
		expect(parallaxStrengthAt(SECTION2_START_FRAME + 1)).toBe(1);
		expect(parallaxStrengthAt(LAST_FRAME)).toBe(1);
	});
});

describe('frameAnchorVh', () => {
	it('is the scroll offset (vh into the track) at which a frame is reached', () => {
		expect(frameAnchorVh(LAST_FRAME)).toBeCloseTo(SCROLL.HOLD_END * (SCROLL.TRACK_VH - 100), 10);
		for (const f of [0, 3.5, SECTION4_START_FRAME]) {
			const progress = frameAnchorVh(f) / (SCROLL.TRACK_VH - 100);
			expect(framePosFromProgress(progress)).toBeCloseTo(f, 10);
		}
	});
});

describe('wordmarkPoseAt', () => {
	it('matches the measured pose at each keyframe', () => {
		WORDMARK_POSES.forEach((pose, i) => {
			const at = wordmarkPoseAt(i);
			expect(at.shiftYEm).toBeCloseTo(pose.shiftYEm, 10);
			expect(at.scale).toBeCloseTo(pose.scale, 10);
			expect(at.opacity).toBeCloseTo(pose.opacity, 10);
		});
	});

	it('fades the ghost out quickly after frame 6 instead of across the whole segment', () => {
		expect(wordmarkPoseAt(WORDMARK_FADE_OUT_END).opacity).toBe(0);
		expect(wordmarkPoseAt(SECTION2_START_FRAME + 1.5).opacity).toBe(0);
	});

	it('interpolates linearly between keyframes', () => {
		const mid = wordmarkPoseAt(2.5);
		expect(mid.shiftYEm).toBeCloseTo((WORDMARK_POSES[2].shiftYEm + WORDMARK_POSES[3].shiftYEm) / 2, 10);
	});
});

describe('damp', () => {
	it('moves toward the target without overshooting', () => {
		const next = damp(0, 10, 8, 1 / 60);
		expect(next).toBeGreaterThan(0);
		expect(next).toBeLessThan(10);
	});

	it('converges after enough time and is frame-rate independent', () => {
		expect(damp(0, 10, 8, 5)).toBeCloseTo(10, 5);
		let a = 0;
		for (let i = 0; i < 2; i++) a = damp(a, 1, 6, 1 / 30);
		let b = 0;
		for (let i = 0; i < 4; i++) b = damp(b, 1, 6, 1 / 60);
		expect(a).toBeCloseTo(b, 10);
	});
});
