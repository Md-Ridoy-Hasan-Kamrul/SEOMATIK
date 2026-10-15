import { describe, expect, it } from 'vitest';
import { LAST_FRAME, PLATE_SIZE, SECTION4_DWELL, SECTION4_START_FRAME, SECTION5_DWELL, SECTION5_START_FRAME } from './canyonPlates';
import {
	applyHomography,
	gridQuads,
	homography,
	matrix3d,
	nearnessAt,
	PANEL_LOCAL,
	panelQuadAt,
	RIBBON,
	SEARCH,
	SEARCH_PANELS,
	searchLayout,
	searchStateAt,
	STRANDS,
	type Quad,
} from './searchLandscape';

const S4 = SECTION4_START_FRAME;
const F11 = S4 + 1;
const F12 = S4 + 2;
const F13 = SECTION5_START_FRAME;
const GRID = Array.from({ length: 401 }, (_, i) => S4 - 0.3 + (i / 400) * (F13 - S4 + 0.3));
const keys = SEARCH_PANELS.map((p) => p.key);

function expectQuad(actual: Quad, expected: Quad, digits = 6) {
	actual.forEach((pt, i) => {
		expect(pt[0]).toBeCloseTo(expected[i][0], digits);
		expect(pt[1]).toBeCloseTo(expected[i][1], digits);
	});
}

describe('data', () => {
	it('has the four search disciplines of the brief, old → new', () => {
		expect(SEARCH_PANELS.map((p) => [p.label, p.sub.join(' ')])).toEqual([
			['SEO', 'Organic Search'],
			['SEA', 'Paid Search'],
			['GEO', 'Organic AI Discovery'],
			['GEA', 'Paid AI Discovery'],
		]);
	});

	it('every panel quad is convex, inside the canvas and wider at the front', () => {
		for (const p of SEARCH_PANELS) {
			for (const q of Object.values(p.frames)) {
				const [tl, tr, br, bl] = q;
				expect(tr[0]).toBeGreaterThan(tl[0]);
				expect(br[1]).toBeGreaterThan(tr[1]);
				expect(bl[1]).toBeGreaterThan(tl[1]);
				for (const [x, y] of q) {
					expect(x).toBeGreaterThan(0);
					expect(x).toBeLessThan(PLATE_SIZE.width);
					expect(y).toBeLessThan(PLATE_SIZE.height);
				}
			}
		}
	});

	it('keeps the panels in left-to-right order (old search on the left, AI discovery right)', () => {
		const xs = SEARCH_PANELS.map((p) => p.frames.f12[0][0]);
		expect([...xs].sort((a, b) => a - b)).toEqual(xs);
	});

	it('links the four realms with strands and one continuous ribbon', () => {
		expect(new Set(STRANDS.map((s) => s.link))).toEqual(new Set([0, 1, 2, 3]));
		for (let i = 1; i < RIBBON.length; i++) expect(RIBBON[i][0]).toEqual(RIBBON[i - 1][3]);
	});
});

describe('homography', () => {
	const quad: Quad = [[284, 282], [434.6, 339.7], [436.8, 645], [276.4, 627]];

	it('maps the four local corners exactly onto the quad', () => {
		const m = homography(PANEL_LOCAL.width, PANEL_LOCAL.height, quad);
		const corners: [number, number][] = [[0, 0], [PANEL_LOCAL.width, 0], [PANEL_LOCAL.width, PANEL_LOCAL.height], [0, PANEL_LOCAL.height]];
		corners.forEach(([x, y], i) => {
			const [X, Y] = applyHomography(m, x, y);
			expect(X).toBeCloseTo(quad[i][0], 6);
			expect(Y).toBeCloseTo(quad[i][1], 6);
		});
	});

	it('reduces to a pure scale for an axis-aligned rectangle', () => {
		const m = homography(100, 200, [[10, 20], [60, 20], [60, 120], [10, 120]]);
		expect(m[3]).toBeCloseTo(0, 12);
		expect(m[7]).toBeCloseTo(0, 12);
		expect(applyHomography(m, 50, 100)).toEqual([35, 70]);
	});

	it('formats a CSS matrix3d with 16 values', () => {
		const css = matrix3d(homography(100, 200, quad));
		expect(css.startsWith('matrix3d(')).toBe(true);
		expect(css.slice(9, -1).split(',')).toHaveLength(16);
	});
});

describe('nearnessAt (mirrors the shader depth proxy)', () => {
	it('is low in the middle distance and high on the floor and outer walls', () => {
		expect(nearnessAt(0.5, 0.4)).toBe(0);
		expect(nearnessAt(0.5, 1)).toBe(1);
		expect(nearnessAt(0.02, 0.4)).toBeCloseTo(0.7, 6);
	});
});

describe('panelQuadAt', () => {
	const seo = SEARCH_PANELS[0];
	const geo = SEARCH_PANELS[2];

	it('matches the measured quad at each reference frame', () => {
		expectQuad(panelQuadAt(seo, F11, 1), seo.frames.f11);
		expectQuad(panelQuadAt(seo, F12, 1), seo.frames.f12);
		expectQuad(panelQuadAt(seo, F13, 1), seo.frames.f13);
	});

	it('grows GEO from its Picture11 ghost to its Picture12 panel', () => {
		expectQuad(panelQuadAt(geo, F11 + 0.5, 0), geo.frames.f11);
		expectQuad(panelQuadAt(geo, F11 + 0.5, 1), geo.frames.f12, 4);
	});
});

describe('searchStateAt — choreography', () => {
	it('is absent before the section begins (including the Growth System dwell)', () => {
		expect(searchStateAt(S4 + SECTION4_DWELL).presence).toBe(0);
		const s = searchStateAt(S4 - 0.2);
		expect(s.presence).toBe(0);
		expect(keys.every((k) => s.panels[k].appear === 0)).toBe(true);
	});

	it('SEO appears first, then SEA', () => {
		expect(SEARCH.SEO_IN[0]).toBeLessThan(SEARCH.SEA_IN[0]);
		const mid = searchStateAt((SEARCH.SEO_IN[1] + SEARCH.SEA_IN[0]) / 2);
		expect(mid.panels.seo.appear).toBe(1);
		expect(mid.panels.sea.appear).toBe(0);
	});

	it('Picture11: SEO + SEA live, GEO/GEA only faint ghosts, no connections', () => {
		const s = searchStateAt(F11);
		expect(s.panels.seo.appear).toBe(1);
		expect(s.panels.sea.appear).toBe(1);
		expect(s.panels.geo.grow).toBe(0);
		expect(s.panels.gea.grow).toBe(0);
		expect(s.ghosts).toBe(1);
		expect(s.strands.every((d) => d === 0)).toBe(true);
		expect(s.ribbon).toBe(0);
	});

	it('then the scene expands to GEO and GEA before any connection is drawn', () => {
		for (const f of GRID) {
			const s = searchStateAt(f);
			if (s.strands.some((d) => d > 0)) {
				expect(s.panels.geo.grow, `f=${f.toFixed(3)}`).toBe(1);
				expect(s.panels.gea.grow, `f=${f.toFixed(3)}`).toBe(1);
			}
		}
	});

	it('Picture12: all four panels, strand connections fully drawn, ribbon not yet', () => {
		const s = searchStateAt(F12);
		expect(keys.every((k) => s.panels[k].appear === 1)).toBe(true);
		expect(s.strands.every((d) => d === 1)).toBe(true);
		expect(s.strandsAlpha).toBe(1);
		expect(s.ribbon).toBe(0);
		expect(s.cta).toBe(0);
		expect(s.interactive).toBe(true);
	});

	it('Picture13: strands have merged into the single ribbon, CTA shown', () => {
		const s = searchStateAt(F13);
		expect(s.ribbon).toBe(1);
		expect(s.strandsAlpha).toBe(0);
		expect(s.cta).toBe(1);
		expect(s.title).toBe(1);
	});

	it('never runs backwards while scrolling forward', () => {
		let prev = searchStateAt(GRID[0]);
		for (const f of GRID) {
			const s = searchStateAt(f);
			for (const k of keys) {
				expect(s.panels[k].appear).toBeGreaterThanOrEqual(prev.panels[k].appear);
				expect(s.panels[k].grow).toBeGreaterThanOrEqual(prev.panels[k].grow);
			}
			s.strands.forEach((d, i) => expect(d).toBeGreaterThanOrEqual(prev.strands[i]));
			expect(s.ribbon).toBeGreaterThanOrEqual(prev.ribbon);
			prev = s;
		}
	});

	it('holds Picture13 for a dwell, then exits as AI Tech (section 5) begins', () => {
		const held = searchStateAt(F13 + SECTION5_DWELL * 0.9);
		expect(held.presence).toBe(1);
		expect(held.interactive).toBe(true);
		const gone = searchStateAt(SEARCH.EXIT[1]);
		expect(gone.presence).toBe(0);
		expect(gone.interactive).toBe(false);
		expect(SEARCH.EXIT[0]).toBeCloseTo(F13 + SECTION5_DWELL, 10);
	});

	it('clamps beyond the last frame', () => {
		expect(searchStateAt(99)).toEqual(searchStateAt(LAST_FRAME));
	});
});

describe('layout', () => {
	it('anchors the glass panels to the rocks when all four fit on screen', () => {
		expect(searchLayout(1352, 968)).toBe('scene');
		expect(searchLayout(1440, 900)).toBe('scene');
		expect(searchLayout(1020, 760)).toBe('scene');
	});

	it('falls back to a 2×2 grid when the cover crop would cut panels off', () => {
		expect(searchLayout(768, 1024)).toBe('grid');
		expect(searchLayout(375, 812)).toBe('grid');
	});

	it('grid quads are on screen, non-overlapping and in reading order', () => {
		for (const [w, h] of [[320, 568], [375, 812], [768, 1024]]) {
			const q = gridQuads(w, h);
			for (const k of keys) {
				for (const [x, y] of q[k]) {
					expect(x).toBeGreaterThanOrEqual(0);
					expect(x).toBeLessThanOrEqual(w);
					expect(y).toBeGreaterThan(0);
					expect(y).toBeLessThan(h);
				}
			}
			expect(q.sea[0][0]).toBeGreaterThan(q.seo[1][0]);
			expect(q.geo[0][1]).toBeGreaterThan(q.seo[3][1]);
		}
	});
});
