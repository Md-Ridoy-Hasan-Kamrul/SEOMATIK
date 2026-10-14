import { type RefObject, useEffect, useState } from 'react';
import type { IntroLevels } from '../../../lib/hero/introTimeline';
import { buildIntroTimeline } from './buildIntroTimeline';
import { useLatestRef } from './useLatestRef';

export type IntroState = 'pending' | 'running' | 'done';

export interface HeroIntroRefs {
	levelsRef: RefObject<IntroLevels>;
	wordmarkRef: RefObject<HTMLHeadingElement | null>;
	navRef: RefObject<HTMLElement | null>;
	taglineRef: RefObject<HTMLParagraphElement | null>;
}

/** Plays the one-shot entry timeline once `start` is true. */
export function useHeroIntro(refs: HeroIntroRefs, start: boolean, reducedMotion: boolean): IntroState {
	const [state, setState] = useState<IntroState>('pending');
	const reducedMotionRef = useLatestRef(reducedMotion);

	useEffect(() => {
		if (!start) return;
		const targets = {
			levels: refs.levelsRef.current,
			wordmark: refs.wordmarkRef.current,
			nav: refs.navRef.current,
			tagline: refs.taglineRef.current,
		};
		const tl = buildIntroTimeline(targets, reducedMotionRef.current);
		tl.eventCallback('onComplete', () => setState('done'));
		setState('running');
		tl.play();
		return () => {
			tl.kill();
		};
		// Starts exactly once; refs are stable and motion preference is read at start.
	}, [start]);

	return state;
}
