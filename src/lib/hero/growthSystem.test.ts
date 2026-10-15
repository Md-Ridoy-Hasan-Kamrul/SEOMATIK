import { describe, expect, it } from 'vitest';
import { LAST_FRAME, PLATE_SIZE, SECTION3_START_FRAME, SECTION4_DWELL, SECTION4_START_FRAME } from './canyonPlates';
import {
	chooseLayout,
	CONNECTIONS,
	DISCIPLINES,
	GROWTH,
	growthStateAt,
	HEADLINE_S3,
	hoveredRockAt,
	layoutPositions,
	orbitLayout,
	pathData,
	quadPoint,
	RISES,
	sceneAmountAt,
	sceneToScreen,
	sceneView,
	STRATEGY,
	viewportToImage,
	type MaskLike,
} from './growthSystem';

const F_START = SECTION3_START_FRAME;
const F9 = SECTION3_START_FRAME + 1;
const F10 = SECTION4_START_FRAME;
const GRID = Array.from({ length: 301 }, (_, i) => F_START - 0.5 + (i / 300) * (F10 - F_START + 0.5));

describe('data', () => {
	it('has the seven specialists of the brief, in brief order', () => {
		expect(DISCIPLINES.map((d) => d.label)).toEqual(['Social', 'SEA', 'SEO', 'AI Tech', 'GEO', 'GEA', 'Design']);
	});

	it('gives every rock a unique id; strategy is rock 1', () => {
		const ids = DISCIPLINES.map((d) => d.rockId);
		expect(new Set(ids).size).toBe(7);
		expect(ids).not.toContain(STRATEGY.rockId);
		expect(STRATEGY.rockId).toBe(1);
	});

	it('makes strategy the visual focal point: centred, biggest label', () => {
		expect(Math.abs(STRATEGY.active.x - PLATE_SIZE.width / 2)).toBeLessThan(20);
		for (const d of DISCIPLINES) expect(STRATEGY.labelActive.size).toBeGreaterThan(d.labelActive.size);
	});

	it('keeps every pin and label inside the design canvas', () => {
		for (const p of [STRATEGY, ...DISCIPLINES]) {
			for (const pose of [p.dormant, p.active]) {
				expect(pose.x).toBeGreaterThan(0);
				expect(pose.x).toBeLessThan(PLATE_SIZE.width);
				expect(pose.stemEnd).toBeGreaterThan(pose.y);
				expect(pose.stemEnd).toBeLessThan(PLATE_SIZE.height);
			}
		}
	});

	it('connects every specialist to strategy', () => {
		for (const d of DISCIPLINES) expect(CONNECTIONS.filter((c) => c.key === d.key).length).toBeGreaterThan(0);
	});

	it('has one rise per specialist rock', () => {
		expect(RISES.map((r) => r.rockId).sort()).toEqual(DISCIPLINES.map((d) => d.rockId).sort());
	});

	it('keeps the strategy headline larger than the kicker and sub', () => {
		expect(HEADLINE_S3.title9.size).toBeGreaterThan(HEADLINE_S3.kicker.frame9.size * 2);
		expect(HEADLINE_S3.title10.size).toBeGreaterThan(HEADLINE_S3.sub10.size * 2);
	});
});

describe('geometry helpers', () => {
	it('quadPoint hits both endpoints and the curve midpoint', () => {
		const c = { from: [0, 0], ctrl: [10, 10], to: [20, 0] } as const;
		expect(quadPoint(c.from, c.ctrl, c.to, 0)).toEqual([0, 0]);
		expect(quadPoint(c.from, c.ctrl, c.to, 1)).toEqual([20, 0]);
		expect(quadPoint(c.from, c.ctrl, c.to, 0.5)).toEqual([10, 5]);
	});

	it('pathData formats an SVG quadratic path', () => {
		expect(pathData([1, 2], [3.456, 4], [5, 6])).toBe('M1.0 2.0Q3.5 4.0 5.0 6.0');
	});

	it('viewportToImage maps the viewport centre to the image centre (cover)', () => {
		expect(viewportToImage(500, 400, 1000, 800)).toEqual([PLATE_SIZE.width / 2, PLATE_SIZE.height / 2]);
		const [x] = viewportToImage(0, 400, 2000, 800);
		expect(x).toBeCloseTo(PLATE_SIZE.width / 2 - 1000 / (2000 / PLATE_SIZE.width), 6);
	});

	it('hoveredRockAt reads the rock id from the mask red channel', () => {
		const mask: MaskLike = { width: 2, height: 1, data: new Uint8ClampedArray([16 * 4, 255, 0, 255, 0, 0, 0, 255]) };
		expect(hoveredRockAt(mask, 0, 0)).toBe(4);
		expect(hoveredRockAt(mask, 1, 0)).toBe(0);
		expect(hoveredRockAt(mask, -5, 0)).toBe(0);
	});

	it('orbitLayout keeps all points on screen and strategy in the middle', () => {
		for (const [w, h] of [[320, 568], [375, 812], [768, 1024]]) {
			const layout = orbitLayout(w, h);
			expect(layout.strategy[0]).toBeCloseTo(w / 2, 6);
			for (const [x, y] of Object.values(layout.points)) {
				expect(x).toBeGreaterThan(30);
				expect(x).toBeLessThan(w - 30);
				expect(y).toBeGreaterThan(h * 0.2);
				expect(y).toBeLessThan(h * 0.9);
			}
		}
	});
});

describe('layout + mapping', () => {
	it('uses the rock-anchored scene layout when every specialist fits on screen', () => {
		expect(chooseLayout(1352, 968)).toBe('scene');
		expect(chooseLayout(1440, 900)).toBe('scene');
		expect(chooseLayout(1020, 760)).toBe('scene');
	});

	it('switches to the orbit layout when the cover crop would cut specialists off', () => {
		expect(chooseLayout(768, 1024)).toBe('orbit');
		expect(chooseLayout(375, 812)).toBe('orbit');
		expect(chooseLayout(320, 568)).toBe('orbit');
	});

	it('sceneToScreen maps the design canvas onto the cover-fitted viewport', () => {
		const view = sceneView(1352, 968, 0, 0);
		expect(sceneToScreen([100, 200], 0.5, view)).toEqual([100, 200]);
		const wide = sceneView(2704, 968, 0, 0);
		expect(sceneToScreen([676, 484], 1, wide)).toEqual([1352, 484]);
	});

	it('sceneToScreen moves nearer points further with parallax (opposite to the shader sample offset)', () => {
		const view = sceneView(1352, 968, 0.01, 0);
		const far = sceneToScreen([600, 500], 0.2, view);
		const near = sceneToScreen([600, 500], 0.9, view);
		expect(near[0]).toBeLessThan(far[0]);
		expect(far[0]).toBeCloseTo(600 - 0.01 * 1352 * 0.2, 6);
	});

	it('sceneAmountAt ramps the section 3 scene in during the first dissolve', () => {
		expect(sceneAmountAt(F_START)).toBe(0);
		expect(sceneAmountAt(F_START + 0.2)).toBeGreaterThan(0);
		expect(sceneAmountAt(F9)).toBe(1);
		expect(sceneAmountAt(F10)).toBe(1);
	});
});

describe('layoutPositions', () => {
	it('scene layout at the design size puts pins exactly on the measured rock points', () => {
		const pos = layoutPositions('scene', sceneView(1352, 968, 0, 0));
		expect(pos.nodes.social.active.x).toBeCloseTo(311, 6);
		expect(pos.nodes.social.active.y).toBeCloseTo(374, 6);
		expect(pos.nodes.social.active.stem).toBeCloseTo(466 - 374, 6);
		expect(pos.strategy.core10.x).toBeCloseTo(STRATEGY.active.x, 6);
		expect(pos.links).toHaveLength(CONNECTIONS.length);
		expect(pos.links[0].from[0]).toBeCloseTo(STRATEGY.active.x, 6);
	});

	it('orbit layout runs every connection from the strategy centre to its specialist', () => {
		const view = sceneView(375, 812, 0, 0);
		const pos = layoutPositions('orbit', view);
		const orbit = orbitLayout(375, 812);
		CONNECTIONS.forEach((c, i) => {
			const link = pos.links[i];
			expect(link.to[0]).toBeCloseTo(orbit.points[c.key][0], 6);
			expect(link.to[1]).toBeCloseTo(orbit.points[c.key][1], 6);
		});
		expect(pos.strategy.core10.x).toBeCloseTo(375 / 2, 6);
	});
});

describe('growthStateAt — choreography', () => {
	it('shows nothing of section 3 before it starts', () => {
		const s = growthStateAt(F_START - 0.5);
		expect(s.presence).toBe(0);
		expect(s.strategy.label9).toBe(0);
		expect(Object.values(s.rises).every((r) => r === 0)).toBe(true);
	});

	it('strategy appears first: fully shown before any specialist rises', () => {
		const firstRiseStart = Math.min(...GROWTH.RISE_STARTS);
		expect(growthStateAt(firstRiseStart).strategy.label9).toBe(1);
		expect(Object.values(growthStateAt(firstRiseStart).rises).every((r) => r === 0)).toBe(true);
	});

	it('specialists emerge one by one, in brief order', () => {
		for (let i = 1; i < GROWTH.RISE_STARTS.length; i++) {
			expect(GROWTH.RISE_STARTS[i]).toBeGreaterThan(GROWTH.RISE_STARTS[i - 1]);
		}
		const mid = GROWTH.RISE_STARTS[3] + GROWTH.RISE_DURATION / 2;
		const s = growthStateAt(mid);
		const values = DISCIPLINES.map((d) => s.rises[d.key]);
		expect(values[0]).toBe(1);
		expect(values[3]).toBeGreaterThan(0);
		expect(values[3]).toBeLessThan(1);
		expect(values[6]).toBe(0);
	});

	it('connections only appear after all seven have emerged', () => {
		for (const f of GRID) {
			const s = growthStateAt(f);
			const anyLine = Object.values(s.connections).some((v) => v > 0);
			if (anyLine) {
				expect(Object.values(s.rises).every((r) => r === 1), `f=${f.toFixed(3)}`).toBe(true);
				expect(Object.values(s.active).every((a) => a === 1), `f=${f.toFixed(3)}`).toBe(true);
			}
		}
	});

	it('frame 9 (Picture9): strategy + seven dormant pins, first headline, no lines', () => {
		const s = growthStateAt(F9);
		expect(s.title9).toBe(1);
		expect(s.title10).toBe(0);
		expect(s.strategy.label9).toBe(1);
		for (const d of DISCIPLINES) {
			expect(s.rises[d.key]).toBe(1);
			expect(s.dormant[d.key]).toBe(1);
			expect(s.active[d.key]).toBe(0);
			expect(s.connections[d.key]).toBe(0);
		}
	});

	it('frame 10 (Picture10): active system with labels, lines, statement and CTA', () => {
		const s = growthStateAt(F10);
		expect(s.title9).toBe(0);
		expect(s.title10).toBe(1);
		expect(s.strategy.label10).toBe(1);
		expect(s.strategy.label9).toBe(0);
		for (const d of DISCIPLINES) {
			expect(s.dormant[d.key]).toBe(0);
			expect(s.active[d.key]).toBe(1);
			expect(s.connections[d.key]).toBe(1);
		}
		expect(s.statement).toBe(1);
		expect(s.cta).toBe(1);
		expect(s.interactive).toBe(true);
	});

	it('is not interactive until the system is complete', () => {
		expect(growthStateAt(F9).interactive).toBe(false);
		expect(growthStateAt(F9 + 0.5).interactive).toBe(false);
	});

	it('rises and connections never run backwards while scrolling forward', () => {
		let prev = growthStateAt(GRID[0]);
		for (const f of GRID) {
			const s = growthStateAt(f);
			for (const d of DISCIPLINES) {
				expect(s.rises[d.key]).toBeGreaterThanOrEqual(prev.rises[d.key]);
				expect(s.connections[d.key]).toBeGreaterThanOrEqual(prev.connections[d.key]);
			}
			prev = s;
		}
	});

	it('holds the finished system for a dwell before section 4 starts', () => {
		const s = growthStateAt(F10 + SECTION4_DWELL * 0.9);
		expect(s.presence).toBe(1);
		expect(s.interactive).toBe(true);
		expect(sceneAmountAt(F10 + SECTION4_DWELL * 0.9)).toBe(1);
	});

	it('exits as the search landscape (section 4) begins', () => {
		const after = growthStateAt(GROWTH.EXIT[1]);
		expect(after.presence).toBe(0);
		expect(after.interactive).toBe(false);
		expect(sceneAmountAt(GROWTH.EXIT[1])).toBe(0);
		expect(GROWTH.EXIT[0]).toBeGreaterThanOrEqual(F10);
		expect(growthStateAt(F10).presence).toBe(1);
	});

	it('clamps beyond the last frame', () => {
		expect(growthStateAt(99)).toEqual(growthStateAt(LAST_FRAME));
	});
});
