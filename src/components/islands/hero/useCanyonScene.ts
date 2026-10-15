import { type RefObject, useEffect, useState } from 'react';
import { damp, SCROLL } from '../../../lib/hero/canyonMorph';
import type { IntroLevels } from '../../../lib/hero/introTimeline';
import { revealStateAt } from '../../../lib/hero/revealTimeline';
import { createResilientCanyonRenderer, type CanyonRenderer } from '../../../lib/hero/webglCanyon';
import {
	applyFallbackPlates,
	applyRevealState,
	applyWordmarkPose,
	createParallax,
	createStyleWriter,
	loadPlates,
	readFrameTarget,
	runFrameLoop,
	syncFrameAttribute,
	watchCanvasSize,
	watchPointer,
	type PlateImages,
} from './canyonDom';
import { createGrowthScene, loadGrowthExtras } from './growthScene';
import { useLatestRef } from './useLatestRef';

export type RendererKind = 'pending' | 'webgl' | 'fallback';

export interface CanyonSceneRefs {
	trackRef: RefObject<HTMLElement | null>;
	stageRef: RefObject<HTMLDivElement | null>;
	canvasRef: RefObject<HTMLCanvasElement | null>;
	platesRef: RefObject<HTMLDivElement | null>;
	plateImagesRef: RefObject<(HTMLImageElement | null)[]>;
	levelsRef: RefObject<IntroLevels>;
	growthRef: RefObject<HTMLElement | null>;
}

interface SceneElements {
	section: HTMLElement;
	stage: HTMLDivElement;
	canvas: HTMLCanvasElement;
	plates: HTMLDivElement;
	growth: HTMLElement;
	images: PlateImages;
}

function resolveElements(refs: CanyonSceneRefs): SceneElements | null {
	const { trackRef, stageRef, canvasRef, platesRef, plateImagesRef, growthRef } = refs;
	if (!trackRef.current || !stageRef.current || !canvasRef.current || !platesRef.current || !growthRef.current) return null;
	return {
		section: trackRef.current,
		stage: stageRef.current,
		canvas: canvasRef.current,
		plates: platesRef.current,
		growth: growthRef.current,
		images: plateImagesRef.current,
	};
}

/** Snap once close enough so the loop stops writing sub-pixel changes. */
function approach(current: number, target: number, dtS: number): number {
	const next = damp(current, target, SCROLL.DAMPING, dtS);
	return Math.abs(target - next) < 1e-4 ? target : next;
}

/**
 * Owns the canyon background: WebGL renderer (or <img> fallback), plate
 * loading, and the frame loop mapping scroll → frame 1…5 + wordmark pose.
 */
export function useCanyonScene(refs: CanyonSceneRefs, reducedMotion: boolean) {
	const [renderer, setRenderer] = useState<RendererKind>('pending');
	const [firstPlateReady, setFirstPlateReady] = useState(false);
	const reducedMotionRef = useLatestRef(reducedMotion);

	useEffect(() => {
		const els = resolveElements(refs);
		if (!els) return;
		const gl: CanyonRenderer | null = createResilientCanyonRenderer(els.canvas);
		setRenderer(gl ? 'webgl' : 'fallback');

		const stage = createStyleWriter(els.stage);
		const growth = createGrowthScene(els.growth, stage);
		let stopExtras = () => undefined as void;
		const stopLoading = loadPlates(els.images, (index, image) => {
			gl?.uploadPlate(index, image);
			if (index !== 0) return;
			setFirstPlateReady(true);
			// Section 3 extras queue behind the first plate so they never delay the intro.
			if (gl) stopExtras = loadGrowthExtras(gl, (mask) => growth.setHoverMask(mask));
		});
		let view = { w: window.innerWidth, h: window.innerHeight };
		const stopResize = watchCanvasSize(els.canvas, (w, h, ratio) => {
			view = { w, h };
			gl?.resize(w, h, ratio);
		});

		const pointer = watchPointer();
		const parallax = createParallax();
		let framePos = 0;
		syncFrameAttribute(els.section, framePos);
		const stopLoop = runFrameLoop(els.stage, (dtS, timeS) => {
			const levels = refs.levelsRef.current;
			const reduced = reducedMotionRef.current;
			framePos = approach(framePos, readFrameTarget(els.section), dtS);
			syncFrameAttribute(els.section, framePos);
			applyWordmarkPose(stage, framePos, reduced);
			applyRevealState(stage, revealStateAt(framePos), reduced);
			const cursor = pointer.read();
			const offset = parallax.update(cursor, framePos, reduced, dtS);
			const growthFrame = growth.step({
				framePos, dtS, timeS, viewW: view.w, viewH: view.h,
				parallaxX: offset.x, parallaxY: offset.y, pointer: cursor, reducedMotion: reduced,
			});
			const frame = { framePos, ...levels, timeS, reducedMotion: reduced, parallaxX: offset.x, parallaxY: offset.y, growth: growthFrame };
			if (gl) gl.render(frame);
			else applyFallbackPlates(els.plates, els.images, framePos, levels);
		});

		return () => {
			stopLoop();
			pointer.stop();
			growth.stop();
			stopExtras();
			stopResize();
			stopLoading();
			gl?.dispose();
		};
		// Refs are stable for the island's lifetime; the scene mounts once.
	}, []);

	return { renderer, firstPlateReady };
}
