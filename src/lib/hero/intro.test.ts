import { describe, expect, it } from 'vitest';
import { clamp01, lerp, normalize, smoothstep } from './intro';

describe('clamp01', () => {
	it('clamps below, within, and above range', () => {
		expect(clamp01(-2)).toBe(0);
		expect(clamp01(0.42)).toBe(0.42);
		expect(clamp01(5)).toBe(1);
	});

	it('treats NaN as 0', () => {
		expect(clamp01(Number.NaN)).toBe(0);
	});
});

describe('lerp', () => {
	it('returns endpoints and midpoint', () => {
		expect(lerp(0, 10, 0)).toBe(0);
		expect(lerp(0, 10, 1)).toBe(10);
		expect(lerp(0, 10, 0.5)).toBe(5);
	});
});

describe('smoothstep', () => {
	it('pins endpoints and eases the middle', () => {
		expect(smoothstep(0)).toBe(0);
		expect(smoothstep(1)).toBe(1);
		expect(smoothstep(0.5)).toBeCloseTo(0.5, 5);
	});

	it('clamps out-of-range input', () => {
		expect(smoothstep(-1)).toBe(0);
		expect(smoothstep(2)).toBe(1);
	});
});

describe('normalize', () => {
	it('maps a window to 0..1 and clamps outside it', () => {
		expect(normalize(0.3, 0.3, 0.8)).toBe(0);
		expect(normalize(0.8, 0.3, 0.8)).toBe(1);
		expect(normalize(0.55, 0.3, 0.8)).toBeCloseTo(0.5, 5);
		expect(normalize(0.1, 0.3, 0.8)).toBe(0);
		expect(normalize(0.95, 0.3, 0.8)).toBe(1);
	});

	it('is safe when start equals end', () => {
		expect(normalize(5, 2, 2)).toBe(1);
		expect(normalize(1, 2, 2)).toBe(0);
	});
});
