/**
 * Section 5 "AI Tech". Floating interface modules rise out of the canyon
 * (Picture14), then arrange around the SEOMATIK AI core (Picture15) and get
 * connected. Every quad, pose and path is measured on those frames in design
 * px of the 1352×968 page; the core orb itself lives in plate 15.
 */
import { LAST_FRAME, SECTION5_DWELL, SECTION5_START_FRAME } from './canyonPlates';
import { lerp, normalize, smoothstep } from './intro';
import type { Point } from './growthSystem';
import { sceneToScreen, sceneView } from './growthSystem';
import type { Cubic, Quad, TextPose } from './searchLandscape';

export type { Quad } from './searchLandscape';

export type AiKey = 'consulting' | 'training' | 'automation' | 'agents' | 'knowledge' | 'workflows';
export type AiIcon = 'brain' | 'cap' | 'gear' | 'people' | 'database' | 'flow';

export interface AiModule {
	key: AiKey;
	title: string;
	/** Two-line short description shown on the card (Picture15). */
	lines: readonly [string, string];
	/** Longer description revealed on hover. */
	info: string;
	icon: AiIcon;
	/** Picture14 "emerge" card (only the first three modules): quad + local layout box. */
	frames: { f14?: Quad; f15: Quad };
	emergeLocal?: { width: number; height: number; k: number; titleX: number };
	/** Mid-flight offset (design px) of the travel to the core, so paths curve around it. */
	arc?: Point;
}

/** Local layout box of the compact (Picture15) card before the perspective transform. */
export const ORBIT_LOCAL = { width: 170, height: 118 } as const;

export const AI_MODULES: readonly AiModule[] = [
	{
		key: 'consulting', title: 'AI Consulting', icon: 'brain', lines: ['Strategie & Use Cases', 'für echten Mehrwert.'],
		info: 'Wir identifizieren die Use Cases mit echtem Business-Impact und entwickeln eine KI-Roadmap, die zu Ihren Zielen passt.',
		frames: { f14: [[179.5, 362.7], [466.1, 464.1], [462.2, 628], [164.7, 580]], f15: [[413.8, 352.2], [581, 378.2], [581, 486], [411.3, 470]] },
		emergeLocal: { width: 302, height: 191, k: 0.9, titleX: 0.52 },
		arc: [-30, -40],
	},
	{
		key: 'training', title: 'Training', icon: 'cap', lines: ['Know-how für Teams.', 'Praxisnah und effektiv.'],
		info: 'Workshops und Trainings, die Teams befähigen, KI sicher, produktiv und verantwortungsvoll im Alltag einzusetzen.',
		frames: { f14: [[549.7, 524.8], [763, 562.4], [763, 671], [546.8, 655]], f15: [[786, 379.2], [945, 359.6], [945, 482], [786, 486]] },
		emergeLocal: { width: 216, height: 119, k: 0.72, titleX: 0.44 },
		arc: [40, -70],
	},
	{
		key: 'automation', title: 'Automation', icon: 'gear', lines: ['Prozesse optimieren.', 'Zeit gewinnen.'],
		info: 'Wiederkehrende Abläufe automatisieren – von Datenpflege bis Reporting – damit Ihr Team Zeit für das Wesentliche hat.',
		frames: { f14: [[931.5, 565], [1166.1, 500.4], [1173.7, 667], [932.9, 693]], f15: [[282, 501.9], [454.4, 520.2], [453.8, 630], [282, 632]] },
		emergeLocal: { width: 242, height: 147, k: 0.74, titleX: 0.44 },
		arc: [0, 250],
	},
	{
		key: 'agents', title: 'Agents', icon: 'people', lines: ['Spezialisierte KI-Agenten', 'für Ihre Ziele.'],
		info: 'Spezialisierte KI-Agenten, die Aufgaben selbstständig übernehmen – sicher in Ihre Systeme und Prozesse integriert.',
		frames: { f15: [[902, 520.7], [1071, 503.2], [1071, 632], [902, 632]] },
	},
	{
		key: 'knowledge', title: 'Knowledge Systems', icon: 'database', lines: ['Wissen strukturieren.', 'Intelligent nutzen.'],
		info: 'Unternehmenswissen strukturiert und durchsuchbar machen – mit KI-Assistenten, die auf Ihren eigenen Daten antworten.',
		frames: { f15: [[407, 651.7], [582.5, 659], [581.3, 772], [407, 776]] },
	},
	{
		key: 'workflows', title: 'Workflows', icon: 'flow', lines: ['Abläufe verbinden.', 'Skalierbar wachsen.'],
		info: 'KI-gestützte Workflows, die Tools, Daten und Teams verbinden – damit Prozesse skalieren, ohne komplexer zu werden.',
		frames: { f15: [[785.7, 661.2], [947.5, 655], [947.8, 776], [787.4, 776]] },
	},
];

/** The orb in plate 15 (centre + radius). */
export const AI_CORE = { x: 678, y: 572, r: 122 } as const;

/** Connections of Picture15; `keys` are the modules a path touches (for hover highlighting). */
export const AI_LINKS: readonly { keys: readonly AiKey[]; c: Cubic }[] = [
	{ keys: ['consulting', 'automation', 'knowledge'], c: [[412, 421], [245, 440], [245, 700], [407, 715]] },
	{ keys: ['training', 'agents', 'workflows'], c: [[945, 422], [1112, 440], [1112, 700], [947, 716]] },
	{ keys: ['automation'], c: [[455, 552], [490, 560], [505, 570], [530, 571]] },
	{ keys: ['agents'], c: [[902, 553], [867, 560], [850, 570], [822, 571]] },
	{ keys: ['consulting'], c: [[581, 422], [620, 430], [640, 450], [655, 468]] },
	{ keys: ['training'], c: [[786, 423], [746, 430], [726, 450], [712, 468]] },
	{ keys: ['knowledge'], c: [[582, 715], [610, 712], [630, 700], [648, 684]] },
	{ keys: ['workflows'], c: [[785, 716], [757, 712], [737, 700], [719, 684]] },
];

export const HEADLINE_S5 = {
	f14: {
		line1: { x: 4.5, y: 255.5, size: 65.25, track: 0.2299 },
		line2: { x: 12.5, y: 324.5, size: 60.99, track: 0.2459 },
		sub: { x: 0.5, y: 384, size: 25.1, track: 0 },
	},
	f15: {
		kicker: { x: 0, y: 101.5, size: 13.57, track: 0.3807 },
		line1: { x: 7, y: 144.5, size: 46.81, track: 0.267 },
		line2: { x: 10, y: 201.5, size: 46.81, track: 0.2047 },
		/** Two centred lines; y = centre of the first line box, `lineHeight` in design px. */
		sub: { x: -1, y: 254.5, size: 17.88, lineHeight: 25 },
		cta: { x: -1, y: 329, width: 160, height: 38, size: 13.11 },
		core1: { x: 0, y: 563.5, size: 16.31, track: 0.3853 },
		core2: { x: 0, y: 587.5, size: 8.57, track: 0.5639 },
	},
} as const satisfies { f14: Record<string, TextPose>; f15: Record<string, unknown> };

/** Modules rise from this far below their pose, at this scale, out of the canyon floor. */
export const EMERGE_FROM = { DROP: 150, SCALE: 0.72 } as const;

type Window = readonly [number, number];
const S0 = SECTION5_START_FRAME + SECTION5_DWELL;
const F14 = SECTION5_START_FRAME + 1;
const LINK_START = F14 + 0.68;
const LINK_STEP = 0.02;

/** Frame-position windows (Picture13 = 12, Picture14 = 13, Picture15 = 14). */
export const AI = {
	PRESENCE: [S0, S0 + 0.1] as Window,
	TITLE_IN: [S0 + 0.04, S0 + 0.28] as Window,
	SUB14_IN: [S0 + 0.12, S0 + 0.32] as Window,
	SUB14_OUT: [F14, F14 + 0.15] as Window,
	EMERGE: {
		consulting: [S0 + 0.26, S0 + 0.5],
		training: [S0 + 0.36, S0 + 0.6],
		automation: [S0 + 0.46, S0 + 0.72],
		agents: [F14 + 0.3, F14 + 0.55],
		knowledge: [F14 + 0.36, F14 + 0.61],
		workflows: [F14 + 0.42, F14 + 0.67],
	} as Record<AiKey, Window>,
	ARRANGE: [F14 + 0.1, F14 + 0.55] as Window,
	HEADLINE_MOVE: [F14 + 0.05, F14 + 0.45] as Window,
	KICKER_IN: [F14 + 0.3, F14 + 0.5] as Window,
	SUB15_IN: [F14 + 0.35, F14 + 0.55] as Window,
	CORE_IN: [F14 + 0.45, F14 + 0.62] as Window,
	LINK_STARTS: AI_LINKS.map((_, i) => LINK_START + i * LINK_STEP),
	LINK_DURATION: 0.12,
	CTA_IN: [F14 + 0.8, F14 + 0.96] as Window,
	INTERACTIVE_FROM: F14 + 0.7,
} as const;

export interface ModuleState {
	/** 0 → 1 rise out of the canyon. */
	emerge: number;
	/** 0 = Picture14 pose, 1 = Picture15 pose around the core. */
	arrange: number;
}

export interface AiState {
	presence: number;
	title: number;
	/** Headline pose: 0 = Picture14, 1 = Picture15. */
	headline: number;
	kicker: number;
	sub14: number;
	sub15: number;
	modules: Record<AiKey, ModuleState>;
	links: number[];
	core: number;
	cta: number;
	interactive: boolean;
}

const p = (f: number, [a, b]: Window) => normalize(f, a, b);
const eased = (f: number, w: Window) => smoothstep(p(f, w));

function modulesAt(f: number): Record<AiKey, ModuleState> {
	const arrange = eased(f, AI.ARRANGE);
	return Object.fromEntries(
		AI_MODULES.map((m) => {
			const emerge = eased(f, AI.EMERGE[m.key]);
			return [m.key, { emerge, arrange: m.frames.f14 ? arrange : emerge }];
		}),
	) as Record<AiKey, ModuleState>;
}

export function aiStateAt(framePos: number): AiState {
	const f = Math.min(Math.max(framePos, 0), LAST_FRAME);
	return {
		presence: p(f, AI.PRESENCE),
		title: eased(f, AI.TITLE_IN),
		headline: eased(f, AI.HEADLINE_MOVE),
		kicker: eased(f, AI.KICKER_IN),
		sub14: eased(f, AI.SUB14_IN) * (1 - eased(f, AI.SUB14_OUT)),
		sub15: eased(f, AI.SUB15_IN),
		modules: modulesAt(f),
		links: AI.LINK_STARTS.map((start) => p(f, [start, start + AI.LINK_DURATION])),
		core: eased(f, AI.CORE_IN),
		cta: eased(f, AI.CTA_IN),
		interactive: f >= AI.INTERACTIVE_FROM,
	};
}

function lerpPose(a: TextPose, b: TextPose, t: number): TextPose {
	return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), size: lerp(a.size, b.size, t), track: lerp(a.track, b.track, t) };
}

export function headlinePoseAt(t: number): { line1: TextPose; line2: TextPose } {
	if (t <= 0) return { line1: HEADLINE_S5.f14.line1, line2: HEADLINE_S5.f14.line2 };
	if (t >= 1) return { line1: HEADLINE_S5.f15.line1, line2: HEADLINE_S5.f15.line2 };
	return { line1: lerpPose(HEADLINE_S5.f14.line1, HEADLINE_S5.f15.line1, t), line2: lerpPose(HEADLINE_S5.f14.line2, HEADLINE_S5.f15.line2, t) };
}

function lerpQuad(a: Quad, b: Quad, t: number): Quad {
	return a.map((pt, i) => [lerp(pt[0], b[i][0], t), lerp(pt[1], b[i][1], t)]) as unknown as Quad;
}

/** Offsets a quad along a sine bump: 0 at both ends, the full `arc` mid-flight. */
function arcQuad(q: Quad, arc: Point | undefined, t: number): Quad {
	if (!arc) return q;
	const k = Math.sin(Math.PI * t);
	return q.map(([x, y]) => [x + arc[0] * k, y + arc[1] * k]) as unknown as Quad;
}

/** The quad pushed down into the canyon and shrunk about its bottom centre. */
function sunken(q: Quad): Quad {
	const bx = (q[2][0] + q[3][0]) / 2;
	const by = (q[2][1] + q[3][1]) / 2;
	return q.map(([x, y]) => [bx + (x - bx) * EMERGE_FROM.SCALE, by + (y - by) * EMERGE_FROM.SCALE + EMERGE_FROM.DROP]) as unknown as Quad;
}

export function moduleQuadAt(module: AiModule, st: ModuleState): Quad {
	const base = module.frames.f14 ? arcQuad(lerpQuad(module.frames.f14, module.frames.f15, st.arrange), module.arc, st.arrange) : module.frames.f15;
	return st.emerge >= 1 ? base : lerpQuad(sunken(base), base, st.emerge);
}

export type AiLayout = 'scene' | 'grid';

/** Leftmost / rightmost module ink across Picture14–15. */
const MODULE_INK_X = { min: 164.7, max: 1173.7 } as const;
const SCENE_EDGE_MARGIN = 2;

export function aiLayout(viewW: number, viewH: number): AiLayout {
	const v = sceneView(viewW, viewH, 0, 0);
	const [left] = sceneToScreen([MODULE_INK_X.min, 0], 0, v);
	const [right] = sceneToScreen([MODULE_INK_X.max, 0], 0, v);
	return left >= SCENE_EDGE_MARGIN && right <= viewW - SCENE_EDGE_MARGIN ? 'scene' : 'grid';
}

const GRID = { TOP_RATIO: 0.36, TOP_MIN: 250, BOTTOM_PAD: 92, GAP: 10, SIDE: 16, MAX_W: 210, ROWS: 3 } as const;
const GRID_ASPECT = ORBIT_LOCAL.height / ORBIT_LOCAL.width;
const GRID_ORDER: readonly AiKey[][] = [['consulting', 'training'], ['automation', 'agents'], ['knowledge', 'workflows']];

/** Narrow screens: 2×3 grid of flat cards below the headline (`top` = measured headline bottom). */
export function aiGridQuads(viewW: number, viewH: number, top = Math.max(viewH * GRID.TOP_RATIO, GRID.TOP_MIN)): Record<AiKey, Quad> {
	const avail = viewH - top - GRID.BOTTOM_PAD;
	const cw = Math.min((viewW - 2 * GRID.SIDE - GRID.GAP) / 2, (avail - (GRID.ROWS - 1) * GRID.GAP) / GRID.ROWS / GRID_ASPECT, GRID.MAX_W);
	const ch = cw * GRID_ASPECT;
	const x0 = (viewW - (2 * cw + GRID.GAP)) / 2;
	const y0 = top + (avail - (GRID.ROWS * ch + (GRID.ROWS - 1) * GRID.GAP)) / 2;
	const out = {} as Record<AiKey, Quad>;
	GRID_ORDER.forEach((row, r) =>
		row.forEach((key, c) => {
			const x = x0 + c * (cw + GRID.GAP), y = y0 + r * (ch + GRID.GAP);
			out[key] = [[x, y], [x + cw, y], [x + cw, y + ch], [x, y + ch]];
		}),
	);
	return out;
}

/** Grid connections: every card's inner edge converges on the point between the columns. */
export function aiGridLinks(q: Record<AiKey, Quad>): { keys: AiKey[]; c: Cubic }[] {
	const hub: Point = [(q.automation[1][0] + q.agents[0][0]) / 2, (q.automation[1][1] + q.automation[2][1]) / 2];
	return AI_MODULES.map((m) => {
		const left = GRID_ORDER.some((row) => row[0] === m.key);
		const a = left ? q[m.key][1] : q[m.key][0];
		const b = left ? q[m.key][2] : q[m.key][3];
		const from: Point = [a[0], (a[1] + b[1]) / 2];
		return { keys: [m.key], c: [from, [hub[0], from[1]], [hub[0], from[1]], hub] as Cubic };
	});
}

