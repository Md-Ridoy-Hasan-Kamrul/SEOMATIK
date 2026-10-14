/** DOM-side helpers for the canyon frame loop. Each does one small job. */
import { WORDMARK_POSES } from '../../../lib/hero/canyonPlates';
import {
	crossfadeWeight,
	frameSegment,
	framePosFromProgress,
	scrollProgress,
	wordmarkPoseAt,
} from '../../../lib/hero/canyonMorph';
import type { IntroLevels } from '../../../lib/hero/introTimeline';

/** Canvas resolution cap: plates are 1352 px wide, so beyond 1.5× only costs fill rate. */
export const MAX_PIXEL_RATIO = 1.5;
/** Without WebGL the slit can't be isolated, so the first plate just glows in faintly. */
const FALLBACK_SLIT_REVEAL = 0.35;

export type PlateImages = readonly (HTMLImageElement | null)[];

export function readFrameTarget(section: HTMLElement): number {
	const rect = section.getBoundingClientRect();
	return framePosFromProgress(scrollProgress(rect.top, rect.height, window.innerHeight));
}

export function syncFrameAttribute(section: HTMLElement, framePos: number): void {
	const frame = String(Math.round(framePos));
	if (section.dataset.frame !== frame) section.dataset.frame = frame;
}

export function applyWordmarkPose(stage: HTMLElement, framePos: number, reducedMotion: boolean): void {
	const pose = reducedMotion ? WORDMARK_POSES[0] : wordmarkPoseAt(framePos);
	stage.style.setProperty('--wm-shift', pose.shiftYEm.toFixed(4));
	stage.style.setProperty('--wm-scale', pose.scale.toFixed(4));
}

/** Stacked <img> crossfade: lower plate opaque, upper plate at the mix weight. */
export function applyFallbackPlates(container: HTMLElement, images: PlateImages, framePos: number, levels: IntroLevels): void {
	const { from, to, t } = frameSegment(framePos);
	container.style.opacity = Math.max(levels.slit * FALLBACK_SLIT_REVEAL, levels.rocks).toFixed(3);
	images.forEach((img, i) => {
		if (!img) return;
		const opacity = i === from ? 1 : i === to ? crossfadeWeight(t) : 0;
		img.style.opacity = opacity.toFixed(3);
	});
}

export function loadPlates(images: PlateImages, onReady: (index: number, image: HTMLImageElement) => void): () => void {
	let cancelled = false;
	images.forEach((img, index) => {
		img?.decode().then(
			() => !cancelled && onReady(index, img),
			() => undefined, // a missing plate keeps the previous one on screen
		);
	});
	return () => {
		cancelled = true;
	};
}

export function watchCanvasSize(canvas: HTMLCanvasElement, onSize: (width: number, height: number, ratio: number) => void): () => void {
	const observer = new ResizeObserver(([entry]) => {
		const { width, height } = entry.contentRect;
		onSize(width, height, Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
	});
	observer.observe(canvas);
	return () => observer.disconnect();
}

/** rAF loop that idles while the stage is off-screen or the tab is hidden. */
export function runFrameLoop(stage: HTMLElement, step: (dtS: number, timeS: number) => void): () => void {
	let onScreen = true;
	let raf = 0;
	let last = performance.now();
	const observer = new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
	});
	observer.observe(stage);
	const tick = (now: number) => {
		raf = requestAnimationFrame(tick);
		const dtS = Math.min((now - last) / 1000, 0.1);
		last = now;
		if (onScreen && !document.hidden) step(dtS, now / 1000);
	};
	raf = requestAnimationFrame(tick);
	return () => {
		cancelAnimationFrame(raf);
		observer.disconnect();
	};
}
