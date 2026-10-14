import { useEffect, useRef, useState } from 'react';
import {
	useMotionTemplate,
	useReducedMotion,
	useScroll,
	useTransform,
} from 'motion/react';
import {
	clamp01,
	getBeamWidthVw,
	getFloorOpacity,
	getSkyOpacity,
	getWallShiftVw,
	getWordmarkScale,
} from '../../../lib/hero/intro';

/**
 * Wires the hero's two motion sources to the pure `intro` math:
 *  - load intro: `ready` flag flips CSS transitions (black -> slit -> wordmark)
 *  - scroll scrub: `scrollYProgress` opens the canyon (frames 1 -> 5)
 *
 * Reduced motion jumps straight to the fully-open, settled state.
 */
export function useHeroReveal() {
	const sceneRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const id = requestAnimationFrame(() => setReady(true));
		return () => cancelAnimationFrame(id);
	}, []);

	const { scrollYProgress } = useScroll({
		target: sceneRef,
		offset: ['start start', 'end start'],
	});

	const progress = useTransform(scrollYProgress, (value) =>
		reduceMotion ? 1 : clamp01(value),
	);

	const leftWallTransform = useMotionTemplate`translate3d(${useTransform(
		progress,
		(p) => -getWallShiftVw(p),
	)}vw, 0, 0)`;
	const rightWallTransform = useMotionTemplate`translate3d(${useTransform(
		progress,
		getWallShiftVw,
	)}vw, 0, 0)`;
	const beamWidth = useMotionTemplate`${useTransform(progress, getBeamWidthVw)}vw`;
	const skyOpacity = useTransform(progress, getSkyOpacity);
	const floorOpacity = useTransform(progress, getFloorOpacity);
	// Slow parallax zoom-out on the revealed canyon for depth.
	const canyonScale = useTransform(progress, (p) => 1.18 - 0.18 * p);
	// Keep the centring translate inside the motion transform so the scrubbed
	// `scale()` does not overwrite the element's centering.
	const wordmarkTransform = useMotionTemplate`translate(-50%, -50%) scale(${useTransform(
		progress,
		getWordmarkScale,
	)})`;

	return {
		sceneRef,
		ready: reduceMotion ? true : ready,
		reduceMotion: Boolean(reduceMotion),
		leftWallTransform,
		rightWallTransform,
		beamWidth,
		skyOpacity,
		floorOpacity,
		canyonScale,
		wordmarkTransform,
	};
}
