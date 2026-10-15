import { describe, expect, it } from 'vitest';
import { LAST_FRAME, SECTION2_START_FRAME, SECTION3_START_FRAME } from './canyonPlates';
import {
	BODY_SHIFT_FRAME7,
	HEADLINE_POSES,
	REVEAL,
	revealStateAt,
	type LinePose,
} from './revealTimeline';

const FRAME5 = SECTION2_START_FRAME;
const FRAME6 = SECTION2_START_FRAME + 1;
const FRAME7 = SECTION2_START_FRAME + 2;
const FRAME8 = SECTION3_START_FRAME;

function expectPose(actual: LinePose, expected: LinePose) {
	expect(actual.x).toBeCloseTo(expected.x, 6);
	expect(actual.y).toBeCloseTo(expected.y, 6);
	expect(actual.size).toBeCloseTo(expected.size, 6);
	expect(actual.track).toBeCloseTo(expected.track, 6);
}

describe('REVEAL windows', () => {
	it('every window is inside section 2 and runs forward', () => {
		for (const [name, [start, end]] of Object.entries(REVEAL)) {
			if (name === 'EXIT') continue;
			expect(start, name).toBeGreaterThanOrEqual(FRAME5);
			expect(end, name).toBeLessThanOrEqual(FRAME8);
			expect(end, name).toBeGreaterThan(start);
		}
	});

	it('headline appears line by line, then disciplines → explanation → CTAs', () => {
		expect(REVEAL.LINE1_WIPE[0]).toBeLessThan(REVEAL.LINE2_WIPE[0]);
		expect(REVEAL.LINE2_WIPE[0]).toBeLessThan(REVEAL.DISCIPLINES[0]);
		expect(REVEAL.DISCIPLINES[0]).toBeLessThan(REVEAL.EXPLANATION[0]);
		expect(REVEAL.EXPLANATION[0]).toBeLessThan(REVEAL.CTAS[0]);
	});
});

describe('revealStateAt', () => {
	it('shows nothing of section 2 while the canyon is opening (frames 1–5)', () => {
		for (const f of [0, 1.5, 3, FRAME5]) {
			const s = revealStateAt(f);
			expect(s.line1.wipe).toBe(0);
			expect(s.line2.wipe).toBe(0);
			expect(s.disciplines + s.explanation + s.ctas).toBe(0);
			expect(s.rule.draw).toBe(0);
		}
		expect(revealStateAt(0).tagline).toBe(1);
	});

	it('frame 6: "WE BUILD" mid-wipe at its left pose, rule drawn, nothing else yet', () => {
		const s = revealStateAt(FRAME6);
		expect(s.tagline).toBe(0);
		expect(s.line1.wipe).toBeGreaterThan(0.5);
		expect(s.line1.wipe).toBeLessThan(0.85);
		expectPose(s.line1, HEADLINE_POSES.line1.frame6);
		expect(s.rule.draw).toBe(1);
		expect(s.rule.opacity).toBe(1);
		expect(s.line2.wipe).toBe(0);
		expect(s.disciplines).toBe(0);
	});

	it('frame 7: both lines centred, everything revealed, body sits higher', () => {
		const s = revealStateAt(FRAME7);
		expectPose(s.line1, HEADLINE_POSES.line1.frame7);
		expectPose(s.line2, HEADLINE_POSES.line2.frame7);
		expect(s.line1.wipe).toBe(1);
		expect(s.line2.wipe).toBe(1);
		expect([s.disciplines, s.explanation, s.ctas]).toEqual([1, 1, 1]);
		expect(s.rule.opacity).toBe(0);
		expect(s.bodyShift).toBe(BODY_SHIFT_FRAME7);
	});

	it('frame 8: final resting layout', () => {
		const s = revealStateAt(FRAME8);
		expectPose(s.line1, HEADLINE_POSES.line1.frame8);
		expectPose(s.line2, HEADLINE_POSES.line2.frame8);
		expect(s.bodyShift).toBe(0);
		expect([s.disciplines, s.explanation, s.ctas]).toEqual([1, 1, 1]);
	});

	it('reveals never run backwards while scrolling forward', () => {
		let prev = revealStateAt(FRAME5);
		for (let f = FRAME5; f <= FRAME8 + 1e-9; f += 0.02) {
			const s = revealStateAt(f);
			for (const key of ['disciplines', 'explanation', 'ctas'] as const) expect(s[key]).toBeGreaterThanOrEqual(prev[key]);
			expect(s.line1.wipe).toBeGreaterThanOrEqual(prev.line1.wipe);
			expect(s.line2.wipe).toBeGreaterThanOrEqual(prev.line2.wipe);
			prev = s;
		}
	});

	it('line 1 has risen clear of line 2 before line 2 starts to appear', () => {
		const clearance = HEADLINE_POSES.line2.frame7.size * 0.8;
		for (let f = REVEAL.LINE2_WIPE[0]; f <= FRAME8; f += 0.01) {
			const s = revealStateAt(f);
			expect(s.line2.y - s.line1.y, `f=${f.toFixed(2)}`).toBeGreaterThan(clearance);
		}
	});

	it('moves the headline continuously (no jumps between frames)', () => {
		const step = 0.01;
		for (let f = FRAME5; f < FRAME8; f += step) {
			const a = revealStateAt(f).line1, b = revealStateAt(f + step).line1;
			expect(Math.abs(b.x - a.x)).toBeLessThan(15);
			expect(Math.abs(b.size - a.size)).toBeLessThan(2);
		}
	});

	it('stays fully present on frame 8, then exits as section 3 begins', () => {
		expect(revealStateAt(FRAME8).presence).toBe(1);
		expect(revealStateAt(REVEAL.EXIT[1]).presence).toBe(0);
		expect(REVEAL.EXIT[0]).toBeGreaterThanOrEqual(FRAME8);
	});

	it('clamps beyond the last frame', () => {
		expect(revealStateAt(99)).toEqual(revealStateAt(LAST_FRAME));
	});
});
