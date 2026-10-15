/**
 * Section 3 "The SEOMATIK Growth System — Strategy at the Core".
 * Pins, labels and connections are measured on Picture9 (dormant) and
 * Picture10 (active) in design px of the 1352×968 page; headline poses are
 * offsets from the page centre (x) and cap-centre rows (y), like section 2.
 */
import { LAST_FRAME, PLATE_SIZE, SECTION3_START_FRAME, SECTION4_DWELL, SECTION4_START_FRAME } from './canyonPlates';
import { clamp01, lerp, normalize, smoothstep } from './intro';
import type { LinePose } from './revealTimeline';

export type DisciplineKey = 'social' | 'sea' | 'seo' | 'aiTech' | 'geo' | 'gea' | 'design';
export type Point = readonly [number, number];

export interface PinPose {
	x: number;
	y: number;
	/** Row where the pin's light stem fades out. */
	stemEnd: number;
	/** Parallax depth 0 (far) … 1 (near). */
	depth: number;
}

export interface LabelPose {
	x: number;
	y: number;
	size: number;
	track: number;
}

export interface Discipline {
	key: DisciplineKey;
	label: string;
	rockId: number;
	dormant: PinPose;
	active: PinPose;
	labelActive: LabelPose;
}

export const STRATEGY = {
	label: 'Strategy',
	rockId: 1,
	dormant: { x: 682.5, y: 547.5, stemEnd: 652, depth: 0.45 },
	active: { x: 682.5, y: 505, stemEnd: 695, depth: 0.45 },
	labelDormant: { x: 697, y: 505, size: 21.28, track: 0.1141 },
	labelActive: { x: 682.5, y: 460, size: 24.11, track: 0.03 },
} as const;

/** Brief order — also the order in which the specialists emerge and connect. */
export const DISCIPLINES: readonly Discipline[] = [
	{ key: 'social', label: 'Social', rockId: 2, dormant: { x: 416, y: 512, stemEnd: 572, depth: 0.55 }, active: { x: 311, y: 374, stemEnd: 466, depth: 0.5 }, labelActive: { x: 313.5, y: 342, size: 18.44, track: 0.054 } },
	{ key: 'sea', label: 'SEA', rockId: 3, dormant: { x: 1027, y: 576, stemEnd: 629, depth: 0.65 }, active: { x: 988, y: 385, stemEnd: 450, depth: 0.45 }, labelActive: { x: 988, y: 357, size: 18.44, track: 0.027 } },
	{ key: 'seo', label: 'SEO', rockId: 4, dormant: { x: 308, y: 598, stemEnd: 662, depth: 0.7 }, active: { x: 216, y: 569, stemEnd: 684, depth: 0.72 }, labelActive: { x: 222, y: 537, size: 18.44, track: 0.03 } },
	{ key: 'aiTech', label: 'AI Tech', rockId: 5, dormant: { x: 527, y: 505, stemEnd: 552, depth: 0.4 }, active: { x: 1107.5, y: 516.5, stemEnd: 580, depth: 0.6 }, labelActive: { x: 1108.5, y: 485.5, size: 19.15, track: 0 } },
	{ key: 'geo', label: 'GEO', rockId: 6, dormant: { x: 911, y: 668, stemEnd: 728, depth: 0.8 }, active: { x: 927, y: 669, stemEnd: 745, depth: 0.82 }, labelActive: { x: 927, y: 639, size: 18.44, track: 0.027 } },
	{ key: 'gea', label: 'GEA', rockId: 7, dormant: { x: 520, y: 668, stemEnd: 728, depth: 0.8 }, active: { x: 442, y: 690, stemEnd: 770, depth: 0.85 }, labelActive: { x: 449.5, y: 659, size: 18.44, track: 0.03 } },
	{ key: 'design', label: 'Design', rockId: 8, dormant: { x: 1178, y: 598, stemEnd: 672, depth: 0.72 }, active: { x: 1215, y: 640, stemEnd: 742, depth: 0.78 }, labelActive: { x: 1216.5, y: 608.5, size: 19.15, track: -0.01 } },
];

/** Rock rises in the emergence plate: base row (rock rises out of it) and full height. */
export interface Rise {
	rockId: number;
	base: number;
	height: number;
}

export const RISES: readonly Rise[] = [
	{ rockId: 2, base: 641, height: 158 },
	{ rockId: 3, base: 691, height: 147 },
	{ rockId: 4, base: 721, height: 175 },
	{ rockId: 5, base: 601, height: 124 },
	{ rockId: 6, base: 757, height: 132 },
	{ rockId: 7, base: 761, height: 135 },
	{ rockId: 8, base: 721, height: 187 },
];

export interface Connection {
	key: DisciplineKey;
	from: Point;
	ctrl: Point;
	to: Point;
	fromDepth: number;
	toDepth: number;
	/** Part of the discipline's draw window this segment uses (branches draw after their trunk). */
	span: readonly [number, number];
}

const CORE: Point = [STRATEGY.active.x, STRATEGY.active.y];
const DESIGN_ARC = { ctrl: [911, 459] as Point, to: [1140, 605] as Point };
/** Where the AI Tech branch leaves the strategy→design arc (traced on Picture10). */
const AI_JUNCTION_T = 0.7645;

export function quadPoint(from: Point, ctrl: Point, to: Point, t: number): [number, number] {
	const u = 1 - t;
	return [u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0], u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1]];
}

const AI_JUNCTION = quadPoint(CORE, DESIGN_ARC.ctrl, DESIGN_ARC.to, AI_JUNCTION_T);
const AI_TRUNK_CTRL: Point = [lerp(CORE[0], DESIGN_ARC.ctrl[0], AI_JUNCTION_T), lerp(CORE[1], DESIGN_ARC.ctrl[1], AI_JUNCTION_T)];

function link(key: DisciplineKey, ctrl: Point, to: Point, toDepth: number, span: readonly [number, number] = [0, 1], from: Point = CORE): Connection {
	return { key, from, ctrl, to, fromDepth: STRATEGY.active.depth, toDepth, span };
}

export const CONNECTIONS: readonly Connection[] = [
	link('social', [496.5, 423.5], [311, 374], 0.5),
	link('sea', [835, 445], [988, 385], 0.45),
	link('seo', [449, 487], [216, 569], 0.72),
	link('aiTech', AI_TRUNK_CTRL, AI_JUNCTION, 0.55, [0, 0.62]),
	link('aiTech', [1075, 530], [1107.5, 516.5], 0.6, [0.62, 1], AI_JUNCTION),
	link('geo', [802, 501], [922, 585], 0.8),
	link('geo', [776, 573.5], [870, 642], 0.82),
	link('gea', [564.5, 515], [447, 617], 0.8),
	link('gea', [591, 580], [500, 655], 0.85),
	link('design', DESIGN_ARC.ctrl, DESIGN_ARC.to, 0.75),
];

export const HEADLINE_S3 = {
	kicker: {
		frame9: { x: 1, y: 139.5, size: 15.71, track: 0.4149 },
		frame10: { x: 2.5, y: 127, size: 15, track: 0.4613 },
	},
	title9: { x: 10.5, y: 189, size: 53.19, track: 0.172 },
	title10: { x: 1.5, y: 174.5, size: 52.48, track: 0.065 },
	sub9: { x: -0.5, y: 242, size: 15.71, track: 0.4424 },
	sub10: { x: 0.5, y: 226.5, size: 15.71, track: 0.4277 },
} as const satisfies Record<string, LinePose | Record<string, LinePose>>;

type Window = readonly [number, number];
const S = SECTION3_START_FRAME;
const staggered = (start: number, step: number) => DISCIPLINES.map((_, i) => start + i * step);

/** Frame-position windows (frame 8 = 7, Picture9 = 8, Picture10 = 9). */
export const GROWTH = {
	PRESENCE: [S, S + 0.12] as Window,
	/** Matches CAMERA.S3_DISSOLVE_END: the frame 8 → Growth System plate change. */
	SCENE_IN: 0.45,
	KICKER_IN: [S + 0.08, S + 0.36] as Window,
	TITLE9_IN: [S + 0.14, S + 0.42] as Window,
	SUB9_IN: [S + 0.2, S + 0.42] as Window,
	STRATEGY_IN: [S + 0.12, S + 0.42] as Window,
	RISE_STARTS: staggered(S + 0.44, 0.068),
	RISE_DURATION: 0.14,
	/** Dormant pin lights during the last part of its rock's rise. */
	DORMANT_LEAD: 0.06,
	DORMANT_OUT: [S + 1.02, S + 1.2] as Window,
	STRATEGY_SWAP: [S + 1.02, S + 1.3] as Window,
	TITLE9_OUT: [S + 1.04, S + 1.2] as Window,
	TITLE10_IN: [S + 1.2, S + 1.48] as Window,
	SUB10_IN: [S + 1.26, S + 1.5] as Window,
	KICKER_MOVE: [S + 1.04, S + 1.45] as Window,
	ACTIVE_STARTS: staggered(S + 1.3, 0.045),
	ACTIVE_DURATION: 0.12,
	STRATEGY_STEM: [S + 1.66, S + 1.78] as Window,
	CONNECTION_STARTS: staggered(S + 1.7, 0.03),
	CONNECTION_DURATION: 0.12,
	STATEMENT: [S + 1.84, S + 1.97] as Window,
	CTA: [S + 1.88, S + 2] as Window,
	INTERACTIVE_FROM: S + 1.98,
	/** The system lifts away as the New Search Landscape (section 4) dissolves in. */
	EXIT: [SECTION4_START_FRAME + SECTION4_DWELL, SECTION4_START_FRAME + SECTION4_DWELL + 0.25] as Window,
} as const;

type PerDiscipline = Record<DisciplineKey, number>;

export interface GrowthState {
	presence: number;
	kicker: LinePose & { opacity: number };
	title9: number;
	title10: number;
	sub9: number;
	sub10: number;
	strategy: { label9: number; label10: number; core9: number; core10: number; stem10: number };
	rises: PerDiscipline;
	dormant: PerDiscipline;
	active: PerDiscipline;
	connections: PerDiscipline;
	statement: number;
	cta: number;
	interactive: boolean;
}

const p = (f: number, [a, b]: Window) => normalize(f, a, b);
const eased = (f: number, w: Window) => smoothstep(p(f, w));

function perDiscipline(fn: (index: number) => number): PerDiscipline {
	return Object.fromEntries(DISCIPLINES.map((d, i) => [d.key, fn(i)])) as PerDiscipline;
}

function kickerAt(f: number): LinePose & { opacity: number } {
	const { frame9, frame10 } = HEADLINE_S3.kicker;
	const t = eased(f, GROWTH.KICKER_MOVE);
	return {
		x: lerp(frame9.x, frame10.x, t),
		y: lerp(frame9.y, frame10.y, t),
		size: lerp(frame9.size, frame10.size, t),
		track: lerp(frame9.track, frame10.track, t),
		opacity: eased(f, GROWTH.KICKER_IN),
	};
}

function strategyAt(f: number): GrowthState['strategy'] {
	const swap = eased(f, GROWTH.STRATEGY_SWAP);
	const shown = eased(f, GROWTH.STRATEGY_IN);
	return { label9: shown * (1 - swap), label10: swap, core9: shown * (1 - swap), core10: swap, stem10: eased(f, GROWTH.STRATEGY_STEM) };
}

function riseAt(f: number, i: number): number {
	const start = GROWTH.RISE_STARTS[i];
	return eased(f, [start, start + GROWTH.RISE_DURATION]);
}

function dormantAt(f: number, i: number): number {
	const end = GROWTH.RISE_STARTS[i] + GROWTH.RISE_DURATION;
	return eased(f, [end - GROWTH.DORMANT_LEAD, end]) * (1 - eased(f, GROWTH.DORMANT_OUT));
}

function activeAt(f: number, i: number): number {
	const start = GROWTH.ACTIVE_STARTS[i];
	return eased(f, [start, start + GROWTH.ACTIVE_DURATION]);
}

function connectionAt(f: number, i: number): number {
	const start = GROWTH.CONNECTION_STARTS[i];
	return p(f, [start, start + GROWTH.CONNECTION_DURATION]);
}

export function growthStateAt(framePos: number): GrowthState {
	const f = Math.min(Math.max(framePos, 0), LAST_FRAME);
	return {
		presence: p(f, GROWTH.PRESENCE) * (1 - p(f, GROWTH.EXIT)),
		kicker: kickerAt(f),
		title9: eased(f, GROWTH.TITLE9_IN) * (1 - eased(f, GROWTH.TITLE9_OUT)),
		title10: eased(f, GROWTH.TITLE10_IN),
		sub9: eased(f, GROWTH.SUB9_IN) * (1 - eased(f, GROWTH.TITLE9_OUT)),
		sub10: eased(f, GROWTH.SUB10_IN),
		strategy: strategyAt(f),
		rises: perDiscipline((i) => riseAt(f, i)),
		dormant: perDiscipline((i) => dormantAt(f, i)),
		active: perDiscipline((i) => activeAt(f, i)),
		connections: perDiscipline((i) => connectionAt(f, i)),
		statement: eased(f, GROWTH.STATEMENT),
		cta: eased(f, GROWTH.CTA),
		interactive: f >= GROWTH.INTERACTIVE_FROM && f <= GROWTH.EXIT[0],
	};
}

/** Share of one connection's own span that is drawn, given its discipline's draw progress. */
export function segmentDraw(connection: Connection, draw: number): number {
	return clamp01(normalize(draw, connection.span[0], connection.span[1]));
}

export function pathData(from: Point, ctrl: Point, to: Point): string {
	const n = (v: number) => v.toFixed(1);
	return `M${n(from[0])} ${n(from[1])}Q${n(ctrl[0])} ${n(ctrl[1])} ${n(to[0])} ${n(to[1])}`;
}

/** Viewport px → design px of the cover-fitted background. */
export function viewportToImage(px: number, py: number, viewW: number, viewH: number): [number, number] {
	const s = Math.max(viewW / PLATE_SIZE.width, viewH / PLATE_SIZE.height);
	return [PLATE_SIZE.width / 2 + (px - viewW / 2) / s, PLATE_SIZE.height / 2 + (py - viewH / 2) / s];
}

export interface MaskLike {
	width: number;
	height: number;
	data: ArrayLike<number>;
}

const MASK_ID_STEP = 16;
const MASK_MIN_COVERAGE = 96;

/** Rock id under a design-px point (0 = none). */
export function hoveredRockAt(mask: MaskLike, x: number, y: number): number {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	if (ix < 0 || iy < 0 || ix >= mask.width || iy >= mask.height) return 0;
	const i = (iy * mask.width + ix) * 4;
	if (mask.data[i + 1] < MASK_MIN_COVERAGE) return 0;
	return Math.round(mask.data[i] / MASK_ID_STEP);
}

export function disciplineForRock(rockId: number): DisciplineKey | null {
	return DISCIPLINES.find((d) => d.rockId === rockId)?.key ?? null;
}

/** Narrow screens crop the specialists off-canvas, so the system is laid out as an orbit. */
const ORBIT = {
	CENTER_Y: 0.54,
	RADIUS_X: 0.36,
	RADIUS_X_MAX: 320,
	RADIUS_Y: 0.14,
	RADIUS_Y_MAX: 220,
	ANGLES_DEG: { social: -140, sea: -40, seo: 180, aiTech: 0, geo: 40, gea: 140, design: 90 } as Record<DisciplineKey, number>,
} as const;

export function orbitLayout(viewW: number, viewH: number): { strategy: [number, number]; points: Record<DisciplineKey, [number, number]> } {
	const cx = viewW / 2;
	const cy = viewH * ORBIT.CENTER_Y;
	const rx = Math.min(viewW * ORBIT.RADIUS_X, ORBIT.RADIUS_X_MAX);
	const ry = Math.min(viewH * ORBIT.RADIUS_Y, ORBIT.RADIUS_Y_MAX);
	const points = Object.fromEntries(
		DISCIPLINES.map((d) => {
			const a = (ORBIT.ANGLES_DEG[d.key] * Math.PI) / 180;
			return [d.key, [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]];
		}),
	) as Record<DisciplineKey, [number, number]>;
	return { strategy: [cx, cy], points };
}

/** Cover-fitted view of the design canvas plus the current parallax (normalised image units). */
export interface SceneView {
	viewW: number;
	viewH: number;
	scale: number;
	parallaxX: number;
	parallaxY: number;
}

export function sceneView(viewW: number, viewH: number, parallaxX: number, parallaxY: number): SceneView {
	return { viewW, viewH, scale: Math.max(viewW / PLATE_SIZE.width, viewH / PLATE_SIZE.height), parallaxX, parallaxY };
}

/**
 * Design px → screen px. The shader samples `uv + parallax·depth`, which moves
 * the image by the opposite amount, so pins follow their rock exactly.
 */
export function sceneToScreen(pt: Point, depth: number, v: SceneView): [number, number] {
	const x = v.viewW / 2 + (pt[0] - PLATE_SIZE.width / 2 - v.parallaxX * PLATE_SIZE.width * depth) * v.scale;
	const y = v.viewH / 2 + (pt[1] - PLATE_SIZE.height / 2 - v.parallaxY * PLATE_SIZE.height * depth) * v.scale;
	return [x, y];
}

export type GrowthLayout = 'scene' | 'orbit';

/** Leftmost / rightmost ink of the specialist labels on Picture10 (SEO, Design). */
const SCENE_INK_X = { min: 200, max: 1251 } as const;
const SCENE_EDGE_MARGIN = 12;

export function chooseLayout(viewW: number, viewH: number): GrowthLayout {
	const v = sceneView(viewW, viewH, 0, 0);
	const [left] = sceneToScreen([SCENE_INK_X.min, 0], 0, v);
	const [right] = sceneToScreen([SCENE_INK_X.max, 0], 0, v);
	return left >= SCENE_EDGE_MARGIN && right <= viewW - SCENE_EDGE_MARGIN ? 'scene' : 'orbit';
}

/** 0 → 1 as the background changes from frame 8 to the Growth System plates. */
export function sceneAmountAt(framePos: number): number {
	const exit = 1 - smoothstep(normalize(framePos, GROWTH.EXIT[0], GROWTH.EXIT[1]));
	if (framePos >= S + 1) return exit;
	return smoothstep(normalize(framePos, S, S + GROWTH.SCENE_IN));
}

export interface ScreenPin {
	x: number;
	y: number;
	/** Stem length in screen px. */
	stem: number;
}

export interface ScreenLink {
	from: Point;
	ctrl: Point;
	to: Point;
}

export interface LayoutPositions {
	/** Multiplier for pin and label sizes (cover scale, or a phone-friendly constant). */
	scale: number;
	strategy: { core9: ScreenPin; core10: ScreenPin; label9: Point; label10: Point };
	nodes: Record<DisciplineKey, { dormant: ScreenPin; active: ScreenPin; label: Point }>;
	links: ScreenLink[];
}

const ORBIT_PIN = { STEM: 26, LABEL_LIFT: 24, CORE_LABEL_LIFT: 34, BEND: 0.12, SCALE_REF_W: 600, SCALE_MIN: 0.7, SCALE_MAX: 1 } as const;

function scenePin(pose: PinPose, v: SceneView): ScreenPin {
	const [x, y] = sceneToScreen([pose.x, pose.y], pose.depth, v);
	return { x, y, stem: (pose.stemEnd - pose.y) * v.scale };
}

function sceneLabel(label: LabelPose, depth: number, v: SceneView): Point {
	return sceneToScreen([label.x, label.y], depth, v);
}

function scenePositions(v: SceneView): LayoutPositions {
	const nodes = Object.fromEntries(
		DISCIPLINES.map((d) => [d.key, { dormant: scenePin(d.dormant, v), active: scenePin(d.active, v), label: sceneLabel(d.labelActive, d.active.depth, v) }]),
	) as LayoutPositions['nodes'];
	const links = CONNECTIONS.map((c) => ({
		from: sceneToScreen(c.from, c.fromDepth, v),
		ctrl: sceneToScreen(c.ctrl, (c.fromDepth + c.toDepth) / 2, v),
		to: sceneToScreen(c.to, c.toDepth, v),
	}));
	return {
		scale: v.scale,
		strategy: {
			core9: scenePin(STRATEGY.dormant, v),
			core10: scenePin(STRATEGY.active, v),
			label9: sceneLabel(STRATEGY.labelDormant, STRATEGY.dormant.depth, v),
			label10: sceneLabel(STRATEGY.labelActive, STRATEGY.active.depth, v),
		},
		nodes,
		links,
	};
}

/** Gentle bend so orbit connections read as light paths rather than spokes. */
function orbitLink(from: Point, to: Point): ScreenLink {
	const mx = (from[0] + to[0]) / 2;
	const my = (from[1] + to[1]) / 2;
	const dx = to[0] - from[0];
	const dy = to[1] - from[1];
	return { from, ctrl: [mx - dy * ORBIT_PIN.BEND, my + dx * ORBIT_PIN.BEND], to };
}

function orbitPositions(v: SceneView): LayoutPositions {
	const { strategy, points } = orbitLayout(v.viewW, v.viewH);
	const scale = Math.min(ORBIT_PIN.SCALE_MAX, Math.max(ORBIT_PIN.SCALE_MIN, v.viewW / ORBIT_PIN.SCALE_REF_W));
	const pin = ([x, y]: Point): ScreenPin => ({ x, y, stem: ORBIT_PIN.STEM * scale });
	const lift = ([x, y]: Point, by: number): Point => [x, y - by * scale];
	const nodes = Object.fromEntries(
		DISCIPLINES.map((d) => [d.key, { dormant: pin(points[d.key]), active: pin(points[d.key]), label: lift(points[d.key], ORBIT_PIN.LABEL_LIFT) }]),
	) as LayoutPositions['nodes'];
	return {
		scale,
		strategy: { core9: pin(strategy), core10: pin(strategy), label9: lift(strategy, ORBIT_PIN.CORE_LABEL_LIFT), label10: lift(strategy, ORBIT_PIN.CORE_LABEL_LIFT) },
		nodes,
		links: CONNECTIONS.map((c) => orbitLink(c.span[0] > 0 ? points.aiTech : strategy, points[c.key])),
	};
}

export function layoutPositions(layout: GrowthLayout, v: SceneView): LayoutPositions {
	return layout === 'scene' ? scenePositions(v) : orbitPositions(v);
}
