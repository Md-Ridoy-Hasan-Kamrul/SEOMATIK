import { describe, expect, it } from 'vitest';
import {
	BEAM_MAX_WIDTH_VW,
	BEAM_MIN_WIDTH_VW,
	clamp01,
	getBeamWidthVw,
	getFloorOpacity,
	getSkyOpacity,
	getStageFromProgress,
	getWallShiftVw,
	getWordmarkScale,
	HERO_STAGES,
	lerp,
	normalize,
	smoothstep,
	STAGE_THRESHOLDS,
	WALL_MAX_SHIFT_VW,
	WORDMARK_MAX_SCALE,
	WORDMARK_MIN_SCALE,
} from './intro';

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

describe('getStageFromProgress', () => {
	it('returns the first stage at zero', () => {
		expect(getStageFromProgress(0)).toBe('sealed');
	});

	it('returns the last stage at one', () => {
		expect(getStageFromProgress(1)).toBe('revealed');
	});

	it('activates each stage exactly at its threshold', () => {
		for (const stage of HERO_STAGES) {
			expect(getStageFromProgress(STAGE_THRESHOLDS[stage])).toBe(stage);
		}
	});

	it('picks the correct stage mid-window', () => {
		expect(getStageFromProgress(0.2)).toBe('slit');
		expect(getStageFromProgress(0.5)).toBe('surfacing');
		expect(getStageFromProgress(0.7)).toBe('opening');
	});
});

describe('getWallShiftVw', () => {
	it('is sealed at 0 and fully open at 1', () => {
		expect(getWallShiftVw(0)).toBe(0);
		expect(getWallShiftVw(1)).toBeCloseTo(WALL_MAX_SHIFT_VW, 5);
	});

	it('increases monotonically', () => {
		expect(getWallShiftVw(0.25)).toBeLessThan(getWallShiftVw(0.75));
	});
});

describe('getBeamWidthVw', () => {
	it('spans the configured min..max', () => {
		expect(getBeamWidthVw(0)).toBeCloseTo(BEAM_MIN_WIDTH_VW, 5);
		expect(getBeamWidthVw(1)).toBeCloseTo(BEAM_MAX_WIDTH_VW, 5);
	});
});

describe('getSkyOpacity / getFloorOpacity', () => {
	it('stay hidden early and reach full open', () => {
		expect(getSkyOpacity(0)).toBe(0);
		expect(getSkyOpacity(1)).toBe(1);
		expect(getFloorOpacity(0)).toBe(0);
		expect(getFloorOpacity(1)).toBe(1);
	});

	it('reveals sky no later than floor', () => {
		expect(getSkyOpacity(0.6)).toBeGreaterThanOrEqual(getFloorOpacity(0.6));
	});
});

describe('getWordmarkScale', () => {
	it('scales gently across the open', () => {
		expect(getWordmarkScale(0)).toBeCloseTo(WORDMARK_MIN_SCALE, 5);
		expect(getWordmarkScale(1)).toBeCloseTo(WORDMARK_MAX_SCALE, 5);
	});
});
