/** Writes the Search Landscape state into its DOM layer each frame. Each helper does one job. */
import { PLATE_SIZE } from '../../../lib/hero/canyonPlates';
import { sceneToScreen, sceneView, type Point, type SceneView } from '../../../lib/hero/growthSystem';
import {
	gridLinks,
	gridQuads,
	homography,
	matrix3d,
	nearnessAt,
	PANEL_COMPACT_HEIGHT,
	PANEL_LOCAL,
	panelQuadAt,
	RIBBON,
	SEARCH_PANELS,
	searchLayout,
	searchStateAt,
	STRANDS,
	type Cubic,
	type Quad,
	type SearchKey,
	type SearchLayout,
	type SearchState,
} from '../../../lib/hero/searchLandscape';
import { createStyleWriter, type StyleWriter } from './canyonDom';

/** Hover card width (px) — keep in sync with `.sl__info` in search-landscape.css. */
const INFO_WIDTH = 264;
const INFO_GAP = 16;
const VIEW_MARGIN = 12;
const GRID_HEAD_GAP = 18;
/** Ghost panels (Picture11 GEO/GEA) are dim and unlit. */
const GHOST_ALPHA = 0.42;

interface ItemEls {
	writer: StyleWriter;
	panel: HTMLElement;
	matrix: string;
}

interface PathGroup {
	writer: StyleWriter;
	paths: SVGPathElement[];
	d: string;
}

export interface SearchView {
	viewW: number;
	viewH: number;
	parallaxX: number;
	parallaxY: number;
}

function toScreen(pt: Point, v: SceneView): [number, number] {
	return sceneToScreen(pt, nearnessAt(pt[0] / PLATE_SIZE.width, pt[1] / PLATE_SIZE.height), v);
}

function cubicD(cubics: readonly Cubic[], map: (p: Point) => Point): string {
	const n = (v: number) => v.toFixed(1);
	return cubics
		.map((c, i) => {
			const [a, b, cc, d] = c.map(map);
			return `${i === 0 ? `M${n(a[0])} ${n(a[1])}` : ''}C${n(b[0])} ${n(b[1])} ${n(cc[0])} ${n(cc[1])} ${n(d[0])} ${n(d[1])}`;
		})
		.join('');
}

function setD(group: PathGroup, d: string): void {
	if (group.d === d) return;
	group.d = d;
	group.paths.forEach((p) => p.setAttribute('d', d));
}

function collectGroups(root: HTMLElement, selector: string): PathGroup[] {
	return Array.from(root.querySelectorAll<SVGGElement>(selector), (g) => ({
		writer: createStyleWriter(g as unknown as HTMLElement),
		paths: Array.from(g.querySelectorAll<SVGPathElement>('path')),
		d: '',
	}));
}

function centroid(q: Quad): Point {
	return [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
}

function infoAnchor(q: Quad, anchor: 'right' | 'top', viewW: number): Point {
	if (anchor === 'right') return [Math.max(q[1][0], q[2][0]) + INFO_GAP, q[1][1]];
	const [cx] = centroid(q);
	const x = Math.min(Math.max(cx, INFO_WIDTH / 2 + VIEW_MARGIN), viewW - INFO_WIDTH / 2 - VIEW_MARGIN);
	return [x, Math.min(q[0][1], q[1][1]) - INFO_GAP];
}

export function createSearchDom(root: HTMLElement, stage: StyleWriter) {
	const items = Object.fromEntries(
		SEARCH_PANELS.map((p) => {
			const li = root.querySelector<HTMLElement>(`.sl__item[data-key="${p.key}"]`)!;
			return [p.key, { writer: createStyleWriter(li), panel: li.querySelector<HTMLElement>('.sl__panel')!, matrix: '' }];
		}),
	) as Record<SearchKey, ItemEls>;
	const strands = collectGroups(root, '.sl__strand');
	const ribbon = collectGroups(root, '.sl__ribbon')[0];
	const rootWriter = createStyleWriter(root);
	const head = root.querySelector<HTMLElement>('.sl__head')!;
	// Headline height changes with viewport and web-font load; observe it instead of measuring per frame.
	let headBottom = 0;
	const headObserver = new ResizeObserver(() => {
		headBottom = head.offsetTop + head.offsetHeight + GRID_HEAD_GAP;
	});
	headObserver.observe(head);

	function applyStage(s: SearchState, layout: SearchLayout): void {
		stage.set('--sl-presence', s.presence, 3);
		stage.set('--sl-k', s.kicker, 3);
		stage.set('--sl-t', s.title, 3);
		stage.set('--sl-s', s.sub, 3);
		stage.set('--sl-cta', s.cta, 3);
		stage.set('--sl-strands-a', s.strandsAlpha, 3);
		stage.flag('data-sl-live', s.interactive && s.presence > 0.5);
		stage.flag('data-sl-cta', s.cta > 0.5);
		rootWriter.flag('data-grid', layout === 'grid');
	}

	function placeItem(key: SearchKey, quad: Quad, localH: number, anchor: 'right' | 'top', viewW: number): void {
		const item = items[key];
		const m = matrix3d(homography(PANEL_LOCAL.width, localH, quad));
		if (item.matrix !== m) {
			item.matrix = m;
			item.panel.style.transform = m;
		}
		const [cx, cy] = centroid(quad);
		const [ix, iy] = infoAnchor(quad, anchor, viewW);
		item.writer.set('--cx', cx, 1);
		item.writer.set('--cy', cy, 1);
		item.writer.set('--ix', ix, 1);
		item.writer.set('--iy', iy, 1);
	}

	function applyItems(s: SearchState, f: number, v: SceneView, gridQ: Record<SearchKey, Quad> | null): void {
		for (const p of SEARCH_PANELS) {
			const st = s.panels[p.key];
			const ghost = p.key === 'geo' || p.key === 'gea' ? s.ghosts * GHOST_ALPHA * (1 - st.grow) : 0;
			const w = items[p.key].writer;
			w.set('--appear', st.appear, 3);
			w.set('--ghost', ghost, 3);
			if (gridQ) placeItem(p.key, gridQ[p.key], PANEL_COMPACT_HEIGHT, 'top', v.viewW);
			else placeItem(p.key, panelQuadAt(p, f, st.grow).map((pt) => toScreen(pt, v)) as unknown as Quad, p.localHeight, p.anchor, v.viewW);
		}
	}

	function applyLinks(s: SearchState, v: SceneView, gridQ: Record<SearchKey, Quad> | null): void {
		const identity = (pt: Point) => pt;
		const links = gridQ ? gridLinks(gridQ) : null;
		STRANDS.forEach((st, i) => {
			const g = strands[i];
			const cubic = links ? links[st.link] : st.c;
			g.writer.set('--draw', cubic ? s.strands[st.link] : 0, 3);
			if (cubic) setD(g, cubicD([cubic], links ? identity : (pt) => toScreen(pt, v)));
		});
		ribbon.writer.set('--draw', s.ribbon, 3);
		setD(ribbon, links ? cubicD(links, identity) : cubicD(RIBBON, (pt) => toScreen(pt, v)));
	}

	return {
		update(framePos: number, view: SearchView): void {
			const s = searchStateAt(framePos);
			const layout = searchLayout(view.viewW, view.viewH);
			applyStage(s, layout);
			if (s.presence <= 0) return;
			const v = sceneView(view.viewW, view.viewH, view.parallaxX, view.parallaxY);
			const gridQ = layout === 'grid' ? gridQuads(view.viewW, view.viewH, headBottom || undefined) : null;
			applyItems(s, framePos, v, gridQ);
			applyLinks(s, v, gridQ);
		},
		stop(): void {
			headObserver.disconnect();
		},
	};
}
