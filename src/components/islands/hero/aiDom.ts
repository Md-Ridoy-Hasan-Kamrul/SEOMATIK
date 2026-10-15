/** Writes the AI Tech state into its DOM layer each frame. Each helper does one job. */
import {
	AI_LINKS,
	AI_MODULES,
	aiGridLinks,
	aiGridQuads,
	aiLayout,
	aiStateAt,
	headlinePoseAt,
	HEADLINE_S5,
	moduleQuadAt,
	ORBIT_LOCAL,
	type AiKey,
	type AiModule,
	type AiState,
	type Quad,
} from '../../../lib/hero/aiTech';
import { PLATE_SIZE } from '../../../lib/hero/canyonPlates';
import { lerp, normalize, smoothstep } from '../../../lib/hero/intro';
import { sceneToScreen, sceneView, type Point, type SceneView } from '../../../lib/hero/growthSystem';
import { homography, matrix3d, nearnessAt, type Cubic, type TextPose } from '../../../lib/hero/searchLandscape';
import { createStyleWriter, type StyleWriter } from './canyonDom';
import type { SearchView } from './searchDom';

/** Hover card width (px) — keep in sync with `.ai__info` in ai-tech.css. */
const INFO_WIDTH = 248;
const INFO_GAP = 14;
const VIEW_MARGIN = 12;
const GRID_HEAD_GAP = 16;
/** Emerge → orbit card crossfade happens in the middle of the journey to the core. */
const MORPH_WINDOW = [0.42, 0.58] as const;
/** Grid cards rise this far (px) and from this scale. */
const GRID_RISE = { DROP: 48, SCALE: 0.9 } as const;

interface CardEl {
	el: HTMLElement;
	w: number;
	h: number;
	matrix: string;
}

interface ItemEls {
	writer: StyleWriter;
	emerge: CardEl | null;
	orbit: CardEl;
}

interface LinkEls {
	writer: StyleWriter;
	paths: SVGPathElement[];
	ends: [SVGCircleElement, SVGCircleElement];
	d: string;
}

const depthOf = (pt: Point) => nearnessAt(pt[0] / PLATE_SIZE.width, pt[1] / PLATE_SIZE.height);
const toScreen = (pt: Point, v: SceneView) => sceneToScreen(pt, depthOf(pt), v);
const mapQuad = (q: Quad, map: (p: Point) => Point) => q.map(map) as unknown as Quad;

function centroid(q: Quad): Point {
	return [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
}

function cardEl(root: Element, selector: string, w: number, h: number): CardEl | null {
	const el = root.querySelector<HTMLElement>(selector);
	return el ? { el, w, h, matrix: '' } : null;
}

function placeCard(card: CardEl, quad: Quad): void {
	const m = matrix3d(homography(card.w, card.h, quad));
	if (card.matrix === m) return;
	card.matrix = m;
	card.el.style.transform = m;
}

function cubicD(c: Cubic): string {
	const n = (v: number) => v.toFixed(1);
	const [a, b, cc, d] = c;
	return `M${n(a[0])} ${n(a[1])}C${n(b[0])} ${n(b[1])} ${n(cc[0])} ${n(cc[1])} ${n(d[0])} ${n(d[1])}`;
}

/** Hover card opens beside the module, on the side away from the core. */
function infoAnchor(q: Quad, viewW: number): Point {
	const [cx, cy] = centroid(q);
	const leftSide = cx < viewW / 2;
	const x = leftSide ? Math.min(q[0][0], q[3][0]) - INFO_GAP - INFO_WIDTH : Math.max(q[1][0], q[2][0]) + INFO_GAP;
	return [Math.min(Math.max(x, VIEW_MARGIN), viewW - INFO_WIDTH - VIEW_MARGIN), cy];
}

function gridQuadAt(base: Quad, emerge: number): Quad {
	const [bx, by] = [(base[2][0] + base[3][0]) / 2, (base[2][1] + base[3][1]) / 2];
	const k = lerp(GRID_RISE.SCALE, 1, emerge);
	const drop = (1 - emerge) * GRID_RISE.DROP;
	return base.map(([x, y]) => [bx + (x - bx) * k, by + (y - by) * k + drop]) as unknown as Quad;
}

export function createAiDom(root: HTMLElement, stage: StyleWriter) {
	const items = Object.fromEntries(
		AI_MODULES.map((m) => {
			const li = root.querySelector<HTMLElement>(`.ai__item[data-key="${m.key}"]`)!;
			const e = m.emergeLocal;
			return [m.key, {
				writer: createStyleWriter(li),
				emerge: e ? cardEl(li, '.ai__card--emerge', e.width, e.height) : null,
				orbit: cardEl(li, '.ai__card--orbit', ORBIT_LOCAL.width, ORBIT_LOCAL.height)!,
			}];
		}),
	) as Record<AiKey, ItemEls>;
	const links: LinkEls[] = Array.from(root.querySelectorAll<SVGGElement>('.ai__link'), (g) => ({
		writer: createStyleWriter(g as unknown as HTMLElement),
		paths: Array.from(g.querySelectorAll<SVGPathElement>('path')),
		ends: Array.from(g.querySelectorAll<SVGCircleElement>('.ai__end')) as [SVGCircleElement, SVGCircleElement],
		d: '',
	}));
	const rootWriter = createStyleWriter(root);
	const coreWriter = createStyleWriter(root.querySelector<HTMLElement>('.ai__core')!);
	// The grid starts below the 15-frame sub-line (the head box itself spans the full height on mobile).
	const sub = root.querySelector<HTMLElement>('.ai__sub--15')!;
	let headBottom = 0;
	const headObserver = new ResizeObserver(() => {
		const r = sub.getBoundingClientRect(), base = root.getBoundingClientRect();
		headBottom = r.bottom - base.top + GRID_HEAD_GAP;
	});
	headObserver.observe(sub);

	function applyLine(prefix: string, pose: TextPose): void {
		stage.set(`${prefix}-x`, pose.x, 2);
		stage.set(`${prefix}-y`, pose.y, 2);
		stage.set(`${prefix}-size`, pose.size, 3);
		stage.set(`${prefix}-track`, pose.track);
	}

	function applyStage(s: AiState, grid: boolean): void {
		const head = headlinePoseAt(s.headline);
		stage.set('--ai-presence', s.presence, 3);
		stage.set('--ai-title', s.title, 3);
		stage.set('--ai-k', s.kicker, 3);
		stage.set('--ai-s14', s.sub14, 3);
		stage.set('--ai-s15', s.sub15, 3);
		stage.set('--ai-core', s.core, 3);
		stage.set('--ai-cta', s.cta, 3);
		applyLine('--ai-l1', head.line1);
		applyLine('--ai-l2', head.line2);
		stage.flag('data-ai-live', s.interactive && s.presence > 0.5);
		stage.flag('data-ai-cta', s.cta > 0.5);
		rootWriter.flag('data-grid', grid);
	}

	function applyModule(m: AiModule, s: AiState, v: SceneView, gridQ: Record<AiKey, Quad> | null): void {
		const st = s.modules[m.key];
		const item = items[m.key];
		const morph = m.frames.f14 && !gridQ ? smoothstep(normalize(st.arrange, ...MORPH_WINDOW)) : 1;
		const quad = gridQ ? gridQuadAt(gridQ[m.key], st.emerge) : mapQuad(moduleQuadAt(m, st), (p) => toScreen(p, v));
		if (item.emerge && !gridQ) placeCard(item.emerge, quad);
		placeCard(item.orbit, quad);
		const [cx, cy] = centroid(quad);
		const [ix, iy] = infoAnchor(quad, v.viewW);
		item.writer.set('--emerge', st.emerge, 3);
		item.writer.set('--morph', morph, 3);
		item.writer.set('--cx', cx, 1);
		item.writer.set('--cy', cy, 1);
		item.writer.set('--ix', ix, 1);
		item.writer.set('--iy', iy, 1);
	}

	function applyLinks(s: AiState, v: SceneView, gridQ: Record<AiKey, Quad> | null): void {
		const gridLinks = gridQ ? aiGridLinks(gridQ) : null;
		links.forEach((link, i) => {
			const c = gridLinks ? gridLinks[i]?.c : (AI_LINKS[i].c.map((p) => toScreen(p, v)) as unknown as Cubic);
			link.writer.set('--draw', c ? s.links[i] : 0, 3);
			if (!c) return;
			const d = cubicD(c);
			if (link.d === d) return;
			link.d = d;
			link.paths.forEach((p) => p.setAttribute('d', d));
			[c[0], c[3]].forEach((pt, k) => {
				link.ends[k].setAttribute('cx', pt[0].toFixed(1));
				link.ends[k].setAttribute('cy', pt[1].toFixed(1));
			});
		});
	}

	function applyCore(v: SceneView): void {
		const { core1, core2 } = HEADLINE_S5.f15;
		const [x, y] = toScreen([PLATE_SIZE.width / 2 + core1.x, (core1.y + core2.y) / 2], v);
		coreWriter.set('--px', x, 1);
		coreWriter.set('--py', y, 1);
		coreWriter.set('--s', v.scale, 4);
	}

	return {
		update(framePos: number, view: SearchView): void {
			const s = aiStateAt(framePos);
			const grid = aiLayout(view.viewW, view.viewH) === 'grid';
			applyStage(s, grid);
			if (s.presence <= 0) return;
			const v = sceneView(view.viewW, view.viewH, view.parallaxX, view.parallaxY);
			const gridQ = grid ? aiGridQuads(view.viewW, view.viewH, headBottom || undefined) : null;
			for (const m of AI_MODULES) applyModule(m, s, v, gridQ);
			applyLinks(s, v, gridQ);
			applyCore(v);
		},
		stop(): void {
			headObserver.disconnect();
		},
	};
}
