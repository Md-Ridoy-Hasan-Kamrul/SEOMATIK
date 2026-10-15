/** Section 3 runtime: extra textures, rock hover hit-testing and per-frame state. */
import { GROWTH_ASSETS } from '../../../lib/hero/canyonPlates';
import { damp } from '../../../lib/hero/canyonMorph';
import {
	chooseLayout,
	disciplineForRock,
	DISCIPLINES,
	growthStateAt,
	hoveredRockAt,
	RISES,
	sceneAmountAt,
	sceneView,
	viewportToImage,
	type DisciplineKey,
	type GrowthLayout,
	type SceneView,
} from '../../../lib/hero/growthSystem';
import type { CanyonRenderer, ExtraTexture, GrowthFrame } from '../../../lib/hero/webglCanyon';
import type { PointerState, StyleWriter } from './canyonDom';
import { createGrowthDom } from './growthDom';

const HOVER_DAMPING = 10;
/** The strategy rock "remains active at all times": a steady glow with a slow breath. */
const CORE_GLOW = { BASE: 0.55, BREATH: 0.15, RATE: 1.6, STILL: 0.6 } as const;

const EXTRA_SOURCES: Record<ExtraTexture, string> = {
	emergeBase: GROWTH_ASSETS.emergeBase,
	mask9: GROWTH_ASSETS.rockMask9,
	mask10: GROWTH_ASSETS.rockMask10,
};

function readPixels(image: HTMLImageElement): ImageData {
	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.drawImage(image, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Loads the emergence plate + rock masks; the Picture10 mask is also kept on the CPU for hover. */
export function loadGrowthExtras(gl: CanyonRenderer, onHoverMask: (mask: ImageData) => void): () => void {
	let cancelled = false;
	(Object.keys(EXTRA_SOURCES) as ExtraTexture[]).forEach((kind) => {
		const image = new Image();
		image.decoding = 'async';
		image.src = EXTRA_SOURCES[kind];
		image.decode().then(
			() => {
				if (cancelled) return;
				gl.uploadExtra(kind, image);
				if (kind === 'mask10') onHoverMask(readPixels(image));
			},
			() => undefined, // without extras the plates still crossfade; only the rise/glow is lost
		);
	});
	return () => {
		cancelled = true;
	};
}

function coreGlowAt(timeS: number, reducedMotion: boolean): number {
	return reducedMotion ? CORE_GLOW.STILL : CORE_GLOW.BASE + CORE_GLOW.BREATH * Math.sin(timeS * CORE_GLOW.RATE);
}

function maskHover(mask: ImageData | null, pointer: PointerState, layout: GrowthLayout, view: SceneView): DisciplineKey | null {
	if (!mask || layout !== 'scene' || pointer.clientX === null || pointer.clientY === null) return null;
	const [x, y] = viewportToImage(pointer.clientX, pointer.clientY, view.viewW, view.viewH);
	return disciplineForRock(hoveredRockAt(mask, x, y));
}

export interface GrowthStepInput {
	framePos: number;
	dtS: number;
	timeS: number;
	viewW: number;
	viewH: number;
	parallaxX: number;
	parallaxY: number;
	pointer: PointerState;
	reducedMotion: boolean;
}

export function createGrowthScene(root: HTMLElement, stage: StyleWriter) {
	const dom = createGrowthDom(root, stage);
	let hoverMask: ImageData | null = null;
	let hoverAmount = 0;
	let hoverRockId = 0;

	return {
		setHoverMask(mask: ImageData) {
			hoverMask = mask;
		},
		step(input: GrowthStepInput): GrowthFrame {
			const state = growthStateAt(input.framePos);
			const layout = chooseLayout(input.viewW, input.viewH);
			const view = sceneView(input.viewW, input.viewH, input.parallaxX, input.parallaxY);
			const hover = state.interactive ? (dom.labelHover() ?? maskHover(hoverMask, input.pointer, layout, view)) : null;
			dom.update(state, layout, view, hover);
			if (hover) hoverRockId = DISCIPLINES.find((d) => d.key === hover)!.rockId;
			hoverAmount = damp(hoverAmount, hover ? 1 : 0, HOVER_DAMPING, input.dtS);
			return {
				rises: RISES.map((r) => state.rises[disciplineForRock(r.rockId)!]),
				presence: sceneAmountAt(input.framePos),
				hoverRockId,
				hoverAmount,
				coreGlow: coreGlowAt(input.timeS, input.reducedMotion),
				sceneLayout: layout === 'scene',
			};
		},
		stop() {
			dom.stop();
		},
	};
}
