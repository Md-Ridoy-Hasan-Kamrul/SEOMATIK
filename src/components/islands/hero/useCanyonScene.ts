import { type RefObject, useEffect, useState } from 'react';
import { damp, SCROLL } from '../../../lib/hero/canyonMorph';
import type { IntroLevels } from '../../../lib/hero/introTimeline';
import { createResilientCanyonRenderer, type CanyonRenderer } from '../../../lib/hero/webglCanyon';
import {
	applyFallbackPlates,
	applyWordmarkPose,
	loadPlates,
	readFrameTarget,
	runFrameLoop,
	syncFrameAttribute,
	watchCanvasSize,
	type PlateImages,
} from './canyonDom';
import { useLatestRef } from './useLatestRef';

export type RendererKind = 'pending' | 'webgl' | 'fallback';

export interface CanyonSceneRefs {
	sectionRef: RefObject<HTMLElement | null>;
	stageRef: RefObject<HTMLDivElement | null>;
	canvasRef: RefObject<HTMLCanvasElement | null>;
	platesRef: RefObject<HTMLDivElement | null>;
	plateImagesRef: RefObject<(HTMLImageElement | null)[]>;
	levelsRef: RefObject<IntroLevels>;
}

interface SceneElements {
	section: HTMLElement;
	stage: HTMLDivElement;
	canvas: HTMLCanvasElement;
	plates: HTMLDivElement;
	images: PlateImages;
}

function resolveElements(refs: CanyonSceneRefs): SceneElements | null {
	const { sectionRef, stageRef, canvasRef, platesRef, plateImagesRef } = refs;
	if (!sectionRef.current || !stageRef.current || !canvasRef.current || !platesRef.current) return null;
	return {
		section: sectionRef.current,
		stage: stageRef.current,
		canvas: canvasRef.current,
		plates: platesRef.current,
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

		const stopLoading = loadPlates(els.images, (index, image) => {
			gl?.uploadPlate(index, image);
			if (index === 0) setFirstPlateReady(true);
		});
		const stopResize = gl ? watchCanvasSize(els.canvas, (w, h, ratio) => gl.resize(w, h, ratio)) : () => undefined;

		let framePos = 0;
		syncFrameAttribute(els.section, framePos);
		const stopLoop = runFrameLoop(els.stage, (dtS, timeS) => {
			const levels = refs.levelsRef.current;
			const reduced = reducedMotionRef.current;
			framePos = approach(framePos, readFrameTarget(els.section), dtS);
			syncFrameAttribute(els.section, framePos);
			applyWordmarkPose(els.stage, framePos, reduced);
			if (gl) gl.render({ framePos, ...levels, timeS, reducedMotion: reduced });
			else applyFallbackPlates(els.plates, els.images, framePos, levels);
		});

		return () => {
			stopLoop();
			stopResize();
			stopLoading();
			gl?.dispose();
		};
		// Refs are stable for the island's lifetime; the scene mounts once.
	}, []);

	return { renderer, firstPlateReady };
}
