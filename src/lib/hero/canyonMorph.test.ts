import { describe, expect, it } from 'vitest';
import { CANYON_PLATES, EDGE_V_MAX, LAST_FRAME, WORDMARK_POSES } from './canyonPlates';
import {
	catmullRom,
	coverScale,
	crossfadeWeight,
	damp,
	evalEdge,
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

describe('wordmarkPoseAt', () => {
	it('matches the measured pose at each keyframe', () => {
		WORDMARK_POSES.forEach((pose, i) => {
			const at = wordmarkPoseAt(i);
			expect(at.shiftYEm).toBeCloseTo(pose.shiftYEm, 10);
			expect(at.scale).toBeCloseTo(pose.scale, 10);
		});
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
