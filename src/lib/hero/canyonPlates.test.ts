import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	CANYON_PLATES,
	EDGE_V_MAX,
	LAST_FRAME,
	PLATE_ASPECT,
	PLATE_SIZE,
	WORDMARK_LETTER_CENTERS_EM,
	WORDMARK_POSES,
} from './canyonPlates';
import { evalEdge } from './canyonMorph';

const PUBLIC_DIR = fileURLToPath(new URL('../../../public', import.meta.url));
const SAMPLE_VS = Array.from({ length: 13 }, (_, i) => (i / 12) * EDGE_V_MAX);
const gapWidth = (index: number, v: number) =>
	evalEdge(CANYON_PLATES[index].right, v) - evalEdge(CANYON_PLATES[index].left, v);

describe('CANYON_PLATES data', () => {
	it('has one plate per reference frame (Picture1..5)', () => {
		expect(CANYON_PLATES).toHaveLength(5);
		expect(LAST_FRAME).toBe(4);
	});

	it('points at plate files that exist in /public', () => {
		for (const plate of CANYON_PLATES) {
			expect(existsSync(`${PUBLIC_DIR}${plate.src}`), plate.src).toBe(true);
		}
	});

	it('keeps the design aspect ratio of the cropped reference frames', () => {
		expect(PLATE_ASPECT).toBeCloseTo(PLATE_SIZE.width / PLATE_SIZE.height, 10);
	});

	it('every gap edge stays inside the image and left < right', () => {
		CANYON_PLATES.forEach((_, i) => {
			for (const v of SAMPLE_VS) {
				const l = evalEdge(CANYON_PLATES[i].left, v);
				const r = evalEdge(CANYON_PLATES[i].right, v);
				expect(l).toBeGreaterThan(0);
				expect(r).toBeLessThan(1);
				expect(r - l, `plate ${i + 1} at v=${v}`).toBeGreaterThan(0);
			}
		});
	});

	it('the light gap widens frame by frame (canyon opening)', () => {
		for (let i = 1; i < CANYON_PLATES.length; i++) {
			expect(gapWidth(i, 0.3)).toBeGreaterThan(gapWidth(i - 1, 0.3));
		}
	});

	it('frame 1 is a narrow sliver of light (< 2% of the width)', () => {
		for (const v of SAMPLE_VS) expect(gapWidth(0, v)).toBeLessThan(0.02);
	});
});

describe('WORDMARK_LETTER_CENTERS_EM', () => {
	it('has one centre per SEOMATIK letter', () => {
		expect(WORDMARK_LETTER_CENTERS_EM).toHaveLength(8);
	});

	it('runs strictly left to right with room between neighbours', () => {
		for (let i = 1; i < WORDMARK_LETTER_CENTERS_EM.length; i++) {
			expect(WORDMARK_LETTER_CENTERS_EM[i] - WORDMARK_LETTER_CENTERS_EM[i - 1]).toBeGreaterThan(0.75);
		}
	});

	it('is centred on the page within a few design px', () => {
		const first = WORDMARK_LETTER_CENTERS_EM[0];
		const last = WORDMARK_LETTER_CENTERS_EM[WORDMARK_LETTER_CENTERS_EM.length - 1];
		expect(Math.abs(first + last)).toBeLessThan(0.05);
	});
});

describe('WORDMARK_POSES', () => {
	it('has one pose per frame and starts at the resting pose', () => {
		expect(WORDMARK_POSES).toHaveLength(CANYON_PLATES.length);
		expect(WORDMARK_POSES[0]).toEqual({ shiftYEm: 0, scale: 1 });
	});

	it('only drifts subtly (< 0.25em, < 3% scale)', () => {
		for (const pose of WORDMARK_POSES) {
			expect(Math.abs(pose.shiftYEm)).toBeLessThan(0.25);
			expect(Math.abs(pose.scale - 1)).toBeLessThan(0.03);
		}
	});
});
