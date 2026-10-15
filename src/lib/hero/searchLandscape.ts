/**
 * Section 4 "The New Search Landscape". Four floating glass panels (SEO, SEA,
 * GEO, GEA) live as DOM over the cleaned plates of Picture11–13. Every quad
 * and connection path is measured on those frames in design px (1352×968).
 */
import { LAST_FRAME, PLATE_SIZE, SECTION4_DWELL, SECTION4_START_FRAME, SECTION5_DWELL, SECTION5_START_FRAME } from './canyonPlates';
import { lerp, normalize, smoothstep } from './intro';
import type { Point } from './growthSystem';
import { sceneToScreen, sceneView } from './growthSystem';

export type SearchKey = 'seo' | 'sea' | 'geo' | 'gea';
export type Icon = 'search' | 'cursor' | 'globe' | 'nodes';
/** Corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Point, Point, Point, Point];

export interface PanelContent {
	k: number;
	icon: number;
	label: number;
	sub: number;
	lines: number;
}

export interface SearchPanel {
	key: SearchKey;
	label: string;
	sub: readonly string[];
	icon: Icon;
	info: string;
	/** Where the hover information card opens. */
	anchor: 'right' | 'top';
	/** Local content height (px at PANEL_LOCAL.width); matches the visible aspect of the panel. */
	localHeight: number;
	/** Content scale and centre rows (local px) of icon, label, sub-line and result lines, measured per panel. */
	content: PanelContent;
	/** Measured quads; GEO/GEA's f11 is the faint ghost before the scene expands. */
	frames: { f11: Quad; f12: Quad; f13: Quad };
}

/** Local layout box of a panel's content before the perspective transform. */
export const PANEL_LOCAL = { width: 150, height: 360 } as const;
/** Compact card height for the mobile grid (content without the result lines). */
export const PANEL_COMPACT_HEIGHT = 190;

export const SEARCH_PANELS: readonly SearchPanel[] = [
	{
		key: 'seo', label: 'SEO', sub: ['Organic Search'], icon: 'search', anchor: 'right', localHeight: 352,
		content: { k: 1, icon: 74, label: 135, sub: 170, lines: 214 },
		info: 'Sichtbar in den organischen Suchergebnissen – durch Technik, Content und Autorität, die nachhaltig rankt.',
		frames: {
			f11: [[283, 281.4], [433.4, 338.8], [433.7, 645], [274.9, 627]],
			f12: [[284, 282], [434.6, 339.7], [436.8, 645], [276.4, 627]],
			f13: [[283, 281.5], [433.9, 339], [433.8, 645], [275, 627]],
		},
	},
	{
		key: 'sea', label: 'SEA', sub: ['Paid Search'], icon: 'cursor', anchor: 'top', localHeight: 320,
		content: { k: 1.46, icon: 70, label: 125, sub: 163, lines: 211 },
		info: 'Bezahlte Platzierungen in Google und Bing – sofort sichtbar, präzise ausgesteuert und messbar.',
		frames: {
			f11: [[795.1, 480.4], [887.1, 516.9], [890.6, 707], [795.6, 697]],
			f12: [[794.3, 478], [889.2, 513.2], [893.8, 707], [796.4, 697]],
			f13: [[789.8, 479.4], [883.7, 516.6], [888.1, 707], [792, 697]],
		},
	},
	{
		key: 'geo', label: 'GEO', sub: ['Organic AI', 'Discovery'], icon: 'globe', anchor: 'top', localHeight: 236,
		content: { k: 1.2, icon: 59, label: 111, sub: 146, lines: 203 },
		info: 'Als Quelle in generativen Antworten genannt – in ChatGPT, Perplexity und Google AI Overviews.',
		frames: {
			f11: [[995, 568], [1070, 588], [1080, 740], [994, 733]],
			f12: [[1006, 545.3], [1109.7, 567.4], [1114.6, 728], [1006, 718]],
			f13: [[1002, 556], [1086.5, 583.5], [1090.1, 728], [1006, 718]],
		},
	},
	{
		key: 'gea', label: 'GEA', sub: ['Paid AI', 'Discovery'], icon: 'nodes', anchor: 'top', localHeight: 231,
		content: { k: 1.16, icon: 53, label: 104, sub: 148, lines: 196 },
		info: 'Bezahlte Präsenz in KI-gestützten Discovery-Systemen – das nächste große Werbeumfeld.',
		frames: {
			f11: [[1225, 587], [1305, 605], [1313, 750], [1226, 742]],
			f12: [[1218.9, 585.8], [1308.1, 599.8], [1314.3, 733], [1222.9, 727]],
			f13: [[1231.9, 588.5], [1314, 606.8], [1318.3, 733], [1235.7, 727]],
		},
	},
];

/** Cubic Bézier: start, control 1, control 2, end. */
export type Cubic = readonly [Point, Point, Point, Point];

/** Picture12: bundles of thin light strands between neighbouring realms (link i joins panel i and i + 1). */
export const STRANDS: readonly { link: number; c: Cubic }[] = [
	{ link: 0, c: [[436, 392], [500, 450], [620, 505], [794, 486]] },
	{ link: 0, c: [[440, 410], [520, 470], [640, 520], [794, 500]] },
	{ link: 0, c: [[440, 540], [560, 548], [680, 520], [794, 488]] },
	{ link: 0, c: [[440, 548], [560, 560], [680, 548], [796, 560]] },
	{ link: 1, c: [[889, 515], [930, 525], [970, 540], [1006, 548]] },
	{ link: 1, c: [[890, 540], [935, 548], [975, 560], [1006, 572]] },
	{ link: 2, c: [[1110, 600], [1140, 655], [1190, 660], [1222, 600]] },
	{ link: 2, c: [[1110, 603], [1145, 640], [1190, 640], [1222, 603]] },
	{ link: 2, c: [[1110, 606], [1150, 625], [1190, 622], [1222, 606]] },
	{ link: 3, c: [[1312, 612], [1330, 625], [1345, 640], [1365, 650]] },
];

/** Picture13: one continuous ribbon of light running through all four panels. */
export const RIBBON: readonly Cubic[] = [
	[[436, 356], [520, 410], [560, 470], [610, 508]],
	[[610, 508], [650, 540], [720, 552], [792, 526]],
	[[792, 526], [824, 533], [856, 540], [888, 548]],
	[[888, 548], [930, 575], [960, 610], [1003, 600]],
	[[1003, 600], [1031, 603], [1060, 607], [1088, 610]],
	[[1088, 610], [1120, 630], [1170, 650], [1213, 622]],
	[[1213, 622], [1247, 625], [1282, 629], [1316, 632]],
	[[1316, 632], [1330, 640], [1345, 648], [1365, 655]],
];

export interface TextPose {
	x: number;
	y: number;
	size: number;
	track: number;
}

export const HEADLINE_S4 = {
	kicker: { x: -2, y: 131, size: 15, track: 0.3797 },
	title: { x: 4, y: 178, size: 51.06, track: 0.1512 },
	/** Two centred lines; y = centre of the first line box, `lineHeight` in design px. */
	sub: { x: -0.5, y: 236, size: 18.75, lineHeight: 28 },
	cta: { x0: 517, x1: 830, y0: 851, y1: 912, size: 17.25 },
} as const;

type Window = readonly [number, number];
const S = SECTION4_START_FRAME;
/** Section 4 starts after the Growth System dwell. */
const S0 = S + SECTION4_DWELL;
const F11 = S + 1;
const F12 = S + 2;

/** Frame-position windows (Picture10 = 9, Picture11 = 10, Picture12 = 11, Picture13 = 12). */
export const SEARCH = {
	PRESENCE: [S0, S0 + 0.1] as Window,
	KICKER_IN: [S0 + 0.05, S0 + 0.24] as Window,
	TITLE_IN: [S0 + 0.08, S0 + 0.28] as Window,
	SUB_IN: [S0 + 0.13, S0 + 0.32] as Window,
	SEO_IN: [S0 + 0.24, S0 + 0.42] as Window,
	SEA_IN: [S0 + 0.43, S0 + 0.6] as Window,
	GHOSTS_IN: [S0 + 0.58, S0 + 0.76] as Window,
	GEO_GROW: [F11 + 0.05, F11 + 0.38] as Window,
	GEA_GROW: [F11 + 0.14, F11 + 0.46] as Window,
	STRAND_STARTS: [F11 + 0.5, F11 + 0.58, F11 + 0.66, F11 + 0.74],
	STRAND_DURATION: 0.2,
	INTERACTIVE_FROM: F11 + 0.48,
	RIBBON_DRAW: [F12 + 0.05, F12 + 0.45] as Window,
	STRANDS_OUT: [F12 + 0.15, F12 + 0.45] as Window,
	CTA_IN: [F12 + 0.5, F12 + 0.8] as Window,
	/** The landscape lifts away as AI Tech (section 5) begins, after the Picture13 dwell. */
	EXIT: [SECTION5_START_FRAME + SECTION5_DWELL, SECTION5_START_FRAME + SECTION5_DWELL + 0.25] as Window,
} as const;

export interface PanelState {
	/** 0 → 1 materialisation of the lit glass panel. */
	appear: number;
	/** 0 = Picture11 ghost pose, 1 = full panel pose (GEO/GEA); SEO/SEA follow `appear`. */
	grow: number;
}

export interface SearchState {
	presence: number;
	kicker: number;
	title: number;
	sub: number;
	panels: Record<SearchKey, PanelState>;
	/** Opacity of the GEO/GEA ghosts in Picture11. */
	ghosts: number;
	/** Draw progress of each strand link (0..3). */
	strands: number[];
	strandsAlpha: number;
	ribbon: number;
	cta: number;
	interactive: boolean;
}

const p = (f: number, [a, b]: Window) => normalize(f, a, b);
const eased = (f: number, w: Window) => smoothstep(p(f, w));

function panelsAt(f: number): Record<SearchKey, PanelState> {
	const seo = eased(f, SEARCH.SEO_IN);
	const sea = eased(f, SEARCH.SEA_IN);
	const geo = eased(f, SEARCH.GEO_GROW);
	const gea = eased(f, SEARCH.GEA_GROW);
	return {
		seo: { appear: seo, grow: seo },
		sea: { appear: sea, grow: sea },
		geo: { appear: geo, grow: geo },
		gea: { appear: gea, grow: gea },
	};
}

export function searchStateAt(framePos: number): SearchState {
	const f = Math.min(Math.max(framePos, 0), LAST_FRAME);
	return {
		presence: p(f, SEARCH.PRESENCE) * (1 - p(f, SEARCH.EXIT)),
		kicker: eased(f, SEARCH.KICKER_IN),
		title: eased(f, SEARCH.TITLE_IN),
		sub: eased(f, SEARCH.SUB_IN),
		panels: panelsAt(f),
		ghosts: eased(f, SEARCH.GHOSTS_IN),
		strands: SEARCH.STRAND_STARTS.map((start) => p(f, [start, start + SEARCH.STRAND_DURATION])),
		strandsAlpha: 1 - eased(f, SEARCH.STRANDS_OUT),
		ribbon: p(f, SEARCH.RIBBON_DRAW),
		cta: eased(f, SEARCH.CTA_IN),
		interactive: f >= SEARCH.INTERACTIVE_FROM && f <= SEARCH.EXIT[0],
	};
}

function lerpQuad(a: Quad, b: Quad, t: number): Quad {
	return a.map((pt, i) => [lerp(pt[0], b[i][0], t), lerp(pt[1], b[i][1], t)]) as unknown as Quad;
}

/** Panel pose at a frame position; GEO/GEA move from ghost to panel by `grow`, not by scroll segment. */
export function panelQuadAt(panel: SearchPanel, framePos: number, grow: number): Quad {
	const { f11, f12, f13 } = panel.frames;
	if (framePos >= F12) return lerpQuad(f12, f13, smoothstep(normalize(framePos, F12, SECTION5_START_FRAME)));
	if (framePos <= F11) return f11;
	const expands = panel.key === 'geo' || panel.key === 'gea';
	return lerpQuad(f11, f12, expands ? grow : smoothstep(framePos - F11));
}

/** Column-major 4×4 homography mapping the local rect (0,0)–(w,h) onto `quad` (for CSS matrix3d). */
export function homography(w: number, h: number, quad: Quad): number[] {
	const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
	const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
	const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
	const den = dx1 * dy2 - dx2 * dy1;
	const g = (dx3 * dy2 - dx2 * dy3) / den;
	const k = (dx1 * dy3 - dx3 * dy1) / den;
	const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3;
	const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
	return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
}

export function applyHomography(m: readonly number[], x: number, y: number): [number, number] {
	const wv = m[3] * x + m[7] * y + m[15];
	return [(m[0] * x + m[4] * y + m[12]) / wv, (m[1] * x + m[5] * y + m[13]) / wv];
}

export function matrix3d(m: readonly number[]): string {
	return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-12 ? 0 : +v.toPrecision(8))).join(',')})`;
}

/** Same depth proxy as `nearness()` in the shader: floor and outer walls are nearest. */
export function nearnessAt(u: number, v: number): number {
	const ground = smoothstep(normalize(v, 0.62, 1));
	const walls = 1 - smoothstep(normalize(Math.min(u, 1 - u), 0.1, 0.32));
	return Math.max(ground, walls * 0.7);
}

export type SearchLayout = 'scene' | 'grid';

/** Leftmost / rightmost panel ink across Picture11–13. */
const PANEL_INK_X = { min: 274, max: 1319 } as const;
const SCENE_EDGE_MARGIN = 2;

export function searchLayout(viewW: number, viewH: number): SearchLayout {
	const v = sceneView(viewW, viewH, 0, 0);
	const [left] = sceneToScreen([PANEL_INK_X.min, 0], 0, v);
	const [right] = sceneToScreen([PANEL_INK_X.max, 0], 0, v);
	return left >= SCENE_EDGE_MARGIN && right <= viewW - SCENE_EDGE_MARGIN ? 'scene' : 'grid';
}

const GRID = { TOP_RATIO: 0.33, TOP_MIN: 230, BOTTOM_PAD: 96, GAP: 12, SIDE: 16, MAX_W: 210 } as const;
const GRID_ASPECT = PANEL_COMPACT_HEIGHT / PANEL_LOCAL.width;

/** Mobile 2×2 grid of flat cards below the headline (`top` = measured headline bottom). */
export function gridQuads(viewW: number, viewH: number, top = Math.max(viewH * GRID.TOP_RATIO, GRID.TOP_MIN)): Record<SearchKey, Quad> {
	const avail = viewH - top - GRID.BOTTOM_PAD;
	const cw = Math.min((viewW - 2 * GRID.SIDE - GRID.GAP) / 2, (avail - GRID.GAP) / 2 / GRID_ASPECT, GRID.MAX_W);
	const ch = cw * GRID_ASPECT;
	const x0 = (viewW - (2 * cw + GRID.GAP)) / 2;
	const y0 = top + (avail - (2 * ch + GRID.GAP)) / 2;
	const rect = (col: number, row: number): Quad => {
		const x = x0 + col * (cw + GRID.GAP), y = y0 + row * (ch + GRID.GAP);
		return [[x, y], [x + cw, y], [x + cw, y + ch], [x, y + ch]];
	};
	return { seo: rect(0, 0), sea: rect(1, 0), geo: rect(0, 1), gea: rect(1, 1) };
}

/** Grid connections: SEO → SEA → GEO → GEA as gentle S-curves between card edges. */
export function gridLinks(q: Record<SearchKey, Quad>): Cubic[] {
	const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
	const right = (k: SearchKey) => mid(q[k][1], q[k][2]);
	const left = (k: SearchKey) => mid(q[k][0], q[k][3]);
	const bottom = (k: SearchKey) => mid(q[k][3], q[k][2]);
	const topMid = (k: SearchKey) => mid(q[k][0], q[k][1]);
	const across = (a: Point, b: Point): Cubic => [a, [lerp(a[0], b[0], 0.5), a[1] - 14], [lerp(a[0], b[0], 0.5), b[1] + 14], b];
	const s1 = bottom('sea'), s2 = topMid('geo');
	return [across(right('seo'), left('sea')), [s1, [s1[0], s1[1] + 30], [s2[0], s2[1] - 30], s2], across(right('geo'), left('gea'))];
}

export const DESIGN_CENTER: Point = [PLATE_SIZE.width / 2, PLATE_SIZE.height / 2];
