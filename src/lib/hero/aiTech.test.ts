import { describe, expect, it } from 'vitest';
import { LAST_FRAME, PLATE_SIZE, SECTION5_DWELL, SECTION5_START_FRAME } from './canyonPlates';
import {
	AI,
	AI_CORE,
	AI_LINKS,
	AI_MODULES,
	aiGridQuads,
	aiLayout,
	aiStateAt,
	EMERGE_FROM,
	headlinePoseAt,
	HEADLINE_S5,
	moduleQuadAt,
	type Quad,
} from './aiTech';

const S5 = SECTION5_START_FRAME;
const F14 = S5 + 1;
const F15 = LAST_FRAME;
const GRID = Array.from({ length: 401 }, (_, i) => S5 - 0.2 + (i / 400) * (F15 - S5 + 0.2));
const keys = AI_MODULES.map((m) => m.key);
const early = AI_MODULES.filter((m) => m.frames.f14);
const late = AI_MODULES.filter((m) => !m.frames.f14);

function expectQuad(actual: Quad, expected: Quad, digits = 6) {
	actual.forEach((pt, i) => {
		expect(pt[0]).toBeCloseTo(expected[i][0], digits);
		expect(pt[1]).toBeCloseTo(expected[i][1], digits);
	});
}

const centre = (q: Quad) => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];

describe('data', () => {
	it('has the six modules of Picture15, all with a short and a hover description', () => {
		expect(AI_MODULES.map((m) => m.title)).toEqual(['AI Consulting', 'Training', 'Automation', 'Agents', 'Knowledge Systems', 'Workflows']);
		for (const m of AI_MODULES) {
			expect(m.lines).toHaveLength(2);
			expect(m.info.length).toBeGreaterThan(40);
		}
	});

	it('emerges three modules first (Picture14), the other three join at the core', () => {
		expect(early.map((m) => m.key)).toEqual(['consulting', 'training', 'automation']);
		expect(late).toHaveLength(3);
	});

	it('arranges the six modules around the core: three left, three right', () => {
		const left = AI_MODULES.filter((m) => centre(m.frames.f15)[0] < AI_CORE.x);
		const right = AI_MODULES.filter((m) => centre(m.frames.f15)[0] > AI_CORE.x);
		expect(left).toHaveLength(3);
		expect(right).toHaveLength(3);
	});

	it('keeps every quad inside the canvas and correctly wound', () => {
		for (const m of AI_MODULES) {
			for (const q of [m.frames.f14, m.frames.f15].filter(Boolean) as Quad[]) {
				expect(q[1][0]).toBeGreaterThan(q[0][0]);
				expect(q[3][1]).toBeGreaterThan(q[0][1]);
				for (const [x, y] of q) {
					expect(x).toBeGreaterThan(0);
					expect(x).toBeLessThan(PLATE_SIZE.width);
					expect(y).toBeGreaterThan(0);
					expect(y).toBeLessThan(PLATE_SIZE.height);
				}
			}
		}
	});

	it('connects every module to the core network', () => {
		for (const k of keys) expect(AI_LINKS.some((l) => l.keys.includes(k)), k).toBe(true);
	});
});

describe('moduleQuadAt', () => {
	const consulting = AI_MODULES[0];
	const agents = AI_MODULES[3];

	it('rises out of the canyon depths: starts below and smaller, ends on the measured quad', () => {
		const start = moduleQuadAt(consulting, { emerge: 0, arrange: 0 });
		const end = moduleQuadAt(consulting, { emerge: 1, arrange: 0 });
		expectQuad(end, consulting.frames.f14!);
		expect(centre(start)[1]).toBeGreaterThan(centre(end)[1] + EMERGE_FROM.DROP * 0.5);
		expect(start[1][0] - start[0][0]).toBeLessThan(end[1][0] - end[0][0]);
	});

	it('travels from the Picture14 pose to the Picture15 pose while arranging', () => {
		expectQuad(moduleQuadAt(consulting, { emerge: 1, arrange: 1 }), consulting.frames.f15);
	});

	it('Automation travels beneath the core instead of cutting across it', () => {
		const automation = AI_MODULES[2];
		const [, top] = [0, Math.min(...moduleQuadAt(automation, { emerge: 1, arrange: 0.5 }).map((p) => p[1]))];
		expect(top).toBeGreaterThan(AI_CORE.y + AI_CORE.r * 0.5);
	});

	it('late modules emerge straight into their Picture15 place', () => {
		expectQuad(moduleQuadAt(agents, { emerge: 1, arrange: 1 }), agents.frames.f15);
	});
});

describe('headlinePoseAt', () => {
	it('matches Picture14 and Picture15 exactly', () => {
		expect(headlinePoseAt(0)).toEqual({ line1: HEADLINE_S5.f14.line1, line2: HEADLINE_S5.f14.line2 });
		expect(headlinePoseAt(1)).toEqual({ line1: HEADLINE_S5.f15.line1, line2: HEADLINE_S5.f15.line2 });
	});

	it('shrinks and rises in between', () => {
		const mid = headlinePoseAt(0.5);
		expect(mid.line1.size).toBeLessThan(HEADLINE_S5.f14.line1.size);
		expect(mid.line1.y).toBeLessThan(HEADLINE_S5.f14.line1.y);
	});
});

describe('aiStateAt — choreography', () => {
	it('is absent while Picture13 is held', () => {
		const s = aiStateAt(S5 + SECTION5_DWELL);
		expect(s.presence).toBe(0);
		expect(keys.every((k) => s.modules[k].emerge === 0)).toBe(true);
	});

	it('modules emerge one by one, early three before the late three', () => {
		const starts = AI_MODULES.map((m) => AI.EMERGE[m.key][0]);
		for (let i = 1; i < starts.length; i++) expect(starts[i]).toBeGreaterThan(starts[i - 1]);
	});

	it('Picture14: three modules risen at their canyon poses, nothing arranged yet', () => {
		const s = aiStateAt(F14);
		for (const m of early) {
			expect(s.modules[m.key].emerge).toBe(1);
			expect(s.modules[m.key].arrange).toBe(0);
		}
		for (const m of late) expect(s.modules[m.key].emerge).toBe(0);
		expect(s.links.every((d) => d === 0)).toBe(true);
		expect(s.headline).toBe(0);
		expect(s.sub14).toBe(1);
		expect(s.cta).toBe(0);
	});

	it('connections only draw once all six modules are in place around the core', () => {
		for (const f of GRID) {
			const s = aiStateAt(f);
			if (s.links.some((d) => d > 0)) {
				for (const k of keys) {
					expect(s.modules[k].emerge, `f=${f.toFixed(3)} ${k}`).toBe(1);
					expect(s.modules[k].arrange, `f=${f.toFixed(3)} ${k}`).toBe(1);
				}
			}
		}
	});

	it('Picture15: arranged around the core, connected, core label + CTA shown', () => {
		const s = aiStateAt(F15);
		for (const k of keys) {
			expect(s.modules[k].emerge).toBe(1);
			expect(s.modules[k].arrange).toBe(1);
		}
		expect(s.links.every((d) => d === 1)).toBe(true);
		expect(s.headline).toBe(1);
		expect(s.kicker).toBe(1);
		expect(s.sub15).toBe(1);
		expect(s.sub14).toBe(0);
		expect(s.core).toBe(1);
		expect(s.cta).toBe(1);
		expect(s.interactive).toBe(true);
	});

	it('never runs backwards while scrolling forward', () => {
		let prev = aiStateAt(GRID[0]);
		for (const f of GRID) {
			const s = aiStateAt(f);
			for (const k of keys) {
				expect(s.modules[k].emerge).toBeGreaterThanOrEqual(prev.modules[k].emerge);
				expect(s.modules[k].arrange).toBeGreaterThanOrEqual(prev.modules[k].arrange);
			}
			s.links.forEach((d, i) => expect(d).toBeGreaterThanOrEqual(prev.links[i]));
			prev = s;
		}
	});

	it('clamps beyond the last frame', () => {
		expect(aiStateAt(99)).toEqual(aiStateAt(F15));
	});
});

describe('layout', () => {
	it('uses the scene layout when every module fits on screen', () => {
		expect(aiLayout(1352, 968)).toBe('scene');
		expect(aiLayout(1440, 900)).toBe('scene');
		expect(aiLayout(1020, 760)).toBe('scene');
	});

	it('falls back to a 2×3 grid on narrow screens', () => {
		expect(aiLayout(768, 1024)).toBe('grid');
		expect(aiLayout(375, 812)).toBe('grid');
	});

	it('grid quads stay on screen in reading order', () => {
		for (const [w, h] of [[320, 568], [375, 812], [768, 1024]]) {
			const q = aiGridQuads(w, h);
			for (const k of keys) for (const [x, y] of q[k]) {
				expect(x).toBeGreaterThanOrEqual(0);
				expect(x).toBeLessThanOrEqual(w);
				expect(y).toBeGreaterThan(0);
				expect(y).toBeLessThan(h);
			}
			expect(q.training[0][0]).toBeGreaterThan(q.consulting[1][0]);
			expect(q.knowledge[0][1]).toBeGreaterThan(q.automation[3][1]);
		}
	});
});
