/** DOM-side helpers for the canyon frame loop. Each does one small job. */
import {
	CAMERA,
	crossfadeWeight,
	damp,
	frameSegment,
	framePosFromProgress,
	parallaxStrengthAt,
	scrollProgress,
	wordmarkPoseAt,
} from '../../../lib/hero/canyonMorph';
import type { IntroLevels } from '../../../lib/hero/introTimeline';
import { HEADLINE_POSES, type LinePose, type RevealState } from '../../../lib/hero/revealTimeline';

/** Canvas resolution cap: plates are 1352 px wide, so beyond 1.5× only costs fill rate. */
export const MAX_PIXEL_RATIO = 1.5;
/** Without WebGL the slit can't be isolated, so the first plate just glows in faintly. */
const FALLBACK_SLIT_REVEAL = 0.35;
/** CTAs accept clicks once they are at least this visible. */
const CTA_INTERACTIVE_FROM = 0.5;
/** Slow follow so the foreground drifts rather than jitters with the cursor. */
const POINTER_DAMPING = 3.5;
/** Vertical parallax is gentler than horizontal. */
const PARALLAX_Y_RATIO = 0.6;

export type PlateImages = readonly (HTMLImageElement | null)[];

/** Writes CSS custom properties only when their value actually changes. */
export interface StyleWriter {
	set(name: string, value: number, digits?: number): void;
	flag(name: string, on: boolean): void;
}

export function createStyleWriter(el: HTMLElement): StyleWriter {
	const last = new Map<string, string>();
	return {
		set(name, value, digits = 4) {
			const text = value.toFixed(digits);
			if (last.get(name) === text) return;
			last.set(name, text);
			el.style.setProperty(name, text);
		},
		flag(name, on) {
			if (el.hasAttribute(name) !== on) el.toggleAttribute(name, on);
		},
	};
}

export function readFrameTarget(section: HTMLElement): number {
	const rect = section.getBoundingClientRect();
	return framePosFromProgress(scrollProgress(rect.top, rect.height, window.innerHeight));
}

export function syncFrameAttribute(section: HTMLElement, framePos: number): void {
	const frame = String(Math.round(framePos));
	if (section.dataset.frame !== frame) section.dataset.frame = frame;
}

/** Reduced motion keeps the wordmark still and only fades it out. */
export function applyWordmarkPose(stage: StyleWriter, framePos: number, reducedMotion: boolean): void {
	const pose = wordmarkPoseAt(framePos);
	stage.set('--wm-shift', reducedMotion ? 0 : pose.shiftYEm);
	stage.set('--wm-scale', reducedMotion ? 1 : pose.scale);
	stage.set('--wm-fade', pose.opacity, 3);
}

function applyLine(stage: StyleWriter, prefix: string, pose: LinePose, wipe: number): void {
	stage.set(`${prefix}-x`, pose.x, 2);
	stage.set(`${prefix}-y`, pose.y, 2);
	stage.set(`${prefix}-size`, pose.size, 3);
	stage.set(`${prefix}-track`, pose.track);
	stage.set(`${prefix}-wipe`, wipe, 3);
}

/** Section 2 state → CSS variables. Reduced motion holds the final layout and fades only. */
export function applyRevealState(stage: StyleWriter, state: RevealState, reducedMotion: boolean): void {
	stage.set('--tag-fade', state.tagline, 3);
	applyLine(stage, '--l1', reducedMotion ? HEADLINE_POSES.line1.frame8 : state.line1, state.line1.wipe);
	applyLine(stage, '--l2', reducedMotion ? HEADLINE_POSES.line2.frame8 : state.line2, state.line2.wipe);
	stage.set('--rule-draw', state.rule.draw, 3);
	stage.set('--rule-alpha', reducedMotion ? 0 : state.rule.opacity, 3);
	stage.set('--disc', state.disciplines, 3);
	stage.set('--expl', state.explanation, 3);
	stage.set('--cta', state.ctas, 3);
	stage.set('--body-shift', reducedMotion ? 0 : state.bodyShift, 2);
	stage.set('--reveal-presence', state.presence, 3);
	stage.flag('data-cta-live', state.ctas >= CTA_INTERACTIVE_FROM && state.presence >= CTA_INTERACTIVE_FROM);
}

export interface PointerState {
	/** Cursor in [-1, 1] on both axes (parallax). */
	x: number;
	y: number;
	/** Cursor in viewport px (hover hit-testing); null until the pointer has moved. */
	clientX: number | null;
	clientY: number | null;
}

/** Fine pointers only; touch devices get no parallax or rock hover. */
export function watchPointer(): { read(): PointerState; stop(): void } {
	const pos: PointerState = { x: 0, y: 0, clientX: null, clientY: null };
	if (!window.matchMedia('(pointer: fine)').matches) return { read: () => pos, stop: () => undefined };
	const onMove = (event: PointerEvent) => {
		pos.x = (event.clientX / window.innerWidth) * 2 - 1;
		pos.y = (event.clientY / window.innerHeight) * 2 - 1;
		pos.clientX = event.clientX;
		pos.clientY = event.clientY;
	};
	window.addEventListener('pointermove', onMove, { passive: true });
	return { read: () => pos, stop: () => window.removeEventListener('pointermove', onMove) };
}

/** Smoothed foreground offset, faded in by the reveal and off under reduced motion. */
export function createParallax() {
	const offset = { x: 0, y: 0 };
	return {
		update(pointer: { x: number; y: number }, framePos: number, reducedMotion: boolean, dtS: number) {
			const strength = reducedMotion ? 0 : parallaxStrengthAt(framePos) * CAMERA.PARALLAX_MAX;
			offset.x = damp(offset.x, pointer.x * strength, POINTER_DAMPING, dtS);
			offset.y = damp(offset.y, pointer.y * strength * PARALLAX_Y_RATIO, POINTER_DAMPING, dtS);
			return offset;
		},
	};
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
