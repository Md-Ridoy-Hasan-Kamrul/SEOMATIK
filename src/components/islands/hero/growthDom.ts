/** Writes the Growth System state into its DOM layer each frame. Each helper does one job. */
import {
	CONNECTIONS,
	DISCIPLINES,
	layoutPositions,
	pathData,
	segmentDraw,
	type DisciplineKey,
	type GrowthLayout,
	type GrowthState,
	type Point,
	type SceneView,
	type ScreenPin,
} from '../../../lib/hero/growthSystem';
import { createStyleWriter, type StyleWriter } from './canyonDom';

interface PinEl {
	writer: StyleWriter;
}

interface NodeEls {
	node: HTMLElement;
	writer: StyleWriter;
	dormant: PinEl;
	active: PinEl;
	label: PinEl;
}

interface LinkEls {
	group: SVGGElement;
	writer: StyleWriter;
	paths: SVGPathElement[];
	d: string;
}

export interface GrowthDom {
	update(state: GrowthState, layout: GrowthLayout, view: SceneView, hover: DisciplineKey | null): void;
	/** Specialist currently hovered or focused through its label. */
	labelHover(): DisciplineKey | null;
	stop(): void;
}

function pinEl(root: Element, selector: string): PinEl {
	return { writer: createStyleWriter(root.querySelector<HTMLElement>(selector)!) };
}

function placePin(pin: PinEl, p: ScreenPin, scale: number): void {
	pin.writer.set('--px', p.x, 1);
	pin.writer.set('--py', p.y, 1);
	pin.writer.set('--stem', p.stem, 1);
	pin.writer.set('--s', scale, 3);
}

function placeLabel(label: PinEl, [x, y]: Point, scale: number): void {
	label.writer.set('--px', x, 1);
	label.writer.set('--py', y, 1);
	label.writer.set('--s', scale, 3);
}

function collectNodes(root: HTMLElement): Record<DisciplineKey, NodeEls> {
	return Object.fromEntries(
		DISCIPLINES.map((d) => {
			const node = root.querySelector<HTMLElement>(`.gs__node[data-key="${d.key}"]`)!;
			return [d.key, { node, writer: createStyleWriter(node), dormant: pinEl(node, '[data-pin="dormant"]'), active: pinEl(node, '[data-pin="active"]'), label: pinEl(node, '[data-label]') }];
		}),
	) as Record<DisciplineKey, NodeEls>;
}

function collectLinks(root: HTMLElement): LinkEls[] {
	return Array.from(root.querySelectorAll<SVGGElement>('.gs__link'), (group) => ({
		group,
		writer: createStyleWriter(group as unknown as HTMLElement),
		paths: Array.from(group.querySelectorAll('path')),
		d: '',
	}));
}

function setPath(link: LinkEls, d: string): void {
	if (link.d === d) return;
	link.d = d;
	link.paths.forEach((p) => p.setAttribute('d', d));
}

/** Tracks which specialist label is hovered or focused (keyboard / touch path to the highlight). */
function watchLabelHover(root: HTMLElement): { read(): DisciplineKey | null; stop(): void } {
	let current: DisciplineKey | null = null;
	const keyOf = (target: EventTarget | null) =>
		((target as HTMLElement | null)?.closest?.('.gs__node') as HTMLElement | null)?.dataset.key as DisciplineKey | undefined;
	const enter = (e: Event) => {
		current = keyOf(e.target) ?? current;
	};
	const leave = (e: Event) => {
		if (keyOf(e.target) === current) current = null;
	};
	const events: [string, (e: Event) => void][] = [['pointerover', enter], ['pointerout', leave], ['focusin', enter], ['focusout', leave]];
	events.forEach(([name, fn]) => root.addEventListener(name, fn));
	return { read: () => current, stop: () => events.forEach(([name, fn]) => root.removeEventListener(name, fn)) };
}

export function createGrowthDom(root: HTMLElement, stage: StyleWriter): GrowthDom {
	const nodes = collectNodes(root);
	const links = collectLinks(root);
	const strategy = {
		core9: pinEl(root, '[data-pin="core9"]'),
		core10: pinEl(root, '[data-pin="core10"]'),
		label9: pinEl(root, '[data-label="strategy9"]'),
		label10: pinEl(root, '[data-label="strategy10"]'),
	};
	const labelHover = watchLabelHover(root);
	const layoutWriter = createStyleWriter(root);

	function applyStage(s: GrowthState): void {
		stage.set('--gs-presence', s.presence, 3);
		stage.set('--gs-t9', s.title9, 3);
		stage.set('--gs-t10', s.title10, 3);
		stage.set('--gs-s9', s.sub9, 3);
		stage.set('--gs-s10', s.sub10, 3);
		stage.set('--gs-k', s.kicker.opacity, 3);
		stage.set('--gs-k-x', s.kicker.x, 2);
		stage.set('--gs-k-y', s.kicker.y, 2);
		stage.set('--gs-k-size', s.kicker.size, 3);
		stage.set('--gs-k-track', s.kicker.track);
		stage.set('--gs-core9', s.strategy.core9, 3);
		stage.set('--gs-core10', s.strategy.core10, 3);
		stage.set('--gs-l9', s.strategy.label9, 3);
		stage.set('--gs-l10', s.strategy.label10, 3);
		stage.set('--gs-stem10', s.strategy.stem10, 3);
		stage.set('--gs-statement', s.statement, 3);
		stage.set('--gs-cta', s.cta, 3);
		stage.flag('data-gs-live', s.interactive);
	}

	function applyNodes(s: GrowthState, hover: DisciplineKey | null): void {
		for (const d of DISCIPLINES) {
			const n = nodes[d.key];
			n.writer.set('--rise', s.rises[d.key], 3);
			n.writer.set('--dormant', s.dormant[d.key], 3);
			n.writer.set('--active', s.active[d.key], 3);
			n.writer.flag('data-hot', hover === d.key);
		}
	}

	function applyLinks(s: GrowthState, hover: DisciplineKey | null): void {
		CONNECTIONS.forEach((c, i) => {
			links[i].writer.set('--draw', segmentDraw(c, s.connections[c.key]), 3);
			links[i].writer.flag('data-hot', hover === c.key);
		});
	}

	function applyPositions(layout: GrowthLayout, view: SceneView): void {
		const pos = layoutPositions(layout, view);
		layoutWriter.flag('data-orbit', layout === 'orbit');
		placePin(strategy.core9, pos.strategy.core9, pos.scale);
		placePin(strategy.core10, pos.strategy.core10, pos.scale);
		placeLabel(strategy.label9, pos.strategy.label9, pos.scale);
		placeLabel(strategy.label10, pos.strategy.label10, pos.scale);
		for (const d of DISCIPLINES) {
			const n = nodes[d.key];
			placePin(n.dormant, pos.nodes[d.key].dormant, pos.scale);
			placePin(n.active, pos.nodes[d.key].active, pos.scale);
			placeLabel(n.label, pos.nodes[d.key].label, pos.scale);
		}
		pos.links.forEach((l, i) => setPath(links[i], pathData(l.from, l.ctrl, l.to)));
	}

	return {
		update(state, layout, view, hover) {
			applyStage(state);
			stage.flag('data-gs-hovering', hover !== null);
			if (state.presence <= 0) return;
			applyNodes(state, hover);
			applyLinks(state, hover);
			applyPositions(layout, view);
		},
		labelHover: () => labelHover.read(),
		stop: () => labelHover.stop(),
	};
}
