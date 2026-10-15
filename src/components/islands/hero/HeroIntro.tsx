import { type CSSProperties, type RefObject, useRef } from 'react';
import '@fontsource/gilda-display/400.css';
import { CANYON_PLATES, LAST_FRAME, PLATE_SIZE, SECTION4_START_FRAME, SECTION5_START_FRAME, WORDMARK_LETTER_CENTERS_EM } from '../../../lib/hero/canyonPlates';
import { frameAnchorVh, SCROLL } from '../../../lib/hero/canyonMorph';
import { INTRO, type IntroLevels } from '../../../lib/hero/introTimeline';
import { CanyonReveal } from './CanyonReveal';
import { GrowthSystem } from './GrowthSystem';
import { SearchLandscape } from './SearchLandscape';
import { AiTech } from './AiTech';
import { HeroNav } from './HeroNav';
import { HERO_BRAND, HERO_BRANDLINE } from './navItems';
import { useCanyonScene } from './useCanyonScene';
import { useHeroIntro } from './useHeroIntro';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useStartSignal } from './useStartSignal';
import './hero-intro.css';

const NO_SCRIPT_CSS = '.hero-wordmark,.hero-nav,.hero-tagline,.hero__plates,.hero__plates img:first-child{opacity:1}';
/** In-page anchors: nav "Growth" → Growth System, "Sichtbarkeit" → search landscape, #ai-tech → AI Tech. */
const ANCHORS = [
	{ id: 'growth', vh: frameAnchorVh(SECTION4_START_FRAME) },
	{ id: 'sichtbarkeit', vh: frameAnchorVh(SECTION5_START_FRAME) },
	{ id: 'ai-tech', vh: frameAnchorVh(LAST_FRAME) },
] as const;

function useHeroRefs() {
	return {
		trackRef: useRef<HTMLDivElement>(null),
		stageRef: useRef<HTMLDivElement>(null),
		canvasRef: useRef<HTMLCanvasElement>(null),
		platesRef: useRef<HTMLDivElement>(null),
		plateImagesRef: useRef<(HTMLImageElement | null)[]>([]),
		levelsRef: useRef<IntroLevels>({ slit: 0, rocks: 0, fog: 0 }),
		wordmarkRef: useRef<HTMLHeadingElement>(null),
		navRef: useRef<HTMLElement>(null),
		taglineRef: useRef<HTMLParagraphElement>(null),
		growthRef: useRef<HTMLElement>(null),
		searchRef: useRef<HTMLElement>(null),
		aiRef: useRef<HTMLElement>(null),
	};
}

/** Stacked plates: WebGL texture sources, and the visible scene if WebGL is unavailable. */
function CanyonPlates({
	platesRef,
	plateImagesRef,
}: {
	platesRef: RefObject<HTMLDivElement | null>;
	plateImagesRef: RefObject<(HTMLImageElement | null)[]>;
}) {
	return (
		<div ref={platesRef} className="hero__plates" aria-hidden="true">
			{CANYON_PLATES.map((plate, i) => (
				<img
					key={plate.src}
					ref={(el) => {
						plateImagesRef.current[i] = el;
					}}
					src={plate.src}
					alt=""
					width={PLATE_SIZE.width}
					height={PLATE_SIZE.height}
					decoding="async"
					fetchPriority={i === 0 ? 'high' : 'low'}
					draggable={false}
				/>
			))}
		</div>
	);
}

/** Each letter sits at its measured reference position and carries the silver sheen. */
function Wordmark({ wordmarkRef }: { wordmarkRef: RefObject<HTMLHeadingElement | null> }) {
	return (
		<h1 ref={wordmarkRef} className="hero-wordmark" aria-label={HERO_BRAND}>
			{HERO_BRAND.split('').map((char, i) => (
				<span
					key={i}
					className="hero-wordmark__char"
					aria-hidden="true"
					style={{ '--x': WORDMARK_LETTER_CENTERS_EM[i] } as CSSProperties}
				>
					{char}
				</span>
			))}
		</h1>
	);
}

export default function HeroIntro() {
	const refs = useHeroRefs();
	const reducedMotion = usePrefersReducedMotion();
	const { renderer, firstPlateReady } = useCanyonScene(refs, reducedMotion);
	const start = useStartSignal(firstPlateReady, INTRO.FIRST_PLATE_TIMEOUT_MS);
	const intro = useHeroIntro(refs, start, reducedMotion);

	return (
		<div
			ref={refs.trackRef}
			className="hero"
			id="top"
			data-hero=""
			data-intro={intro}
			data-renderer={renderer}
			style={{ '--hero-track': `${SCROLL.TRACK_VH}vh` } as CSSProperties}
		>
			<div ref={refs.stageRef} className="hero__stage">
				<CanyonPlates platesRef={refs.platesRef} plateImagesRef={refs.plateImagesRef} />
				<canvas ref={refs.canvasRef} className="hero__canvas" aria-hidden="true" />
				<HeroNav navRef={refs.navRef} />
				<section className="hero__brand" aria-label={HERO_BRAND}>
					<Wordmark wordmarkRef={refs.wordmarkRef} />
					<p ref={refs.taglineRef} className="hero-tagline">
						{HERO_BRANDLINE}
					</p>
				</section>
				<CanyonReveal />
				<GrowthSystem rootRef={refs.growthRef} />
				<SearchLandscape rootRef={refs.searchRef} />
				<AiTech rootRef={refs.aiRef} />
			</div>
			{ANCHORS.map((a) => (
				<span key={a.id} id={a.id} className="hero__anchor" style={{ top: `${a.vh}vh` }} aria-hidden="true" />
			))}
			<noscript dangerouslySetInnerHTML={{ __html: `<style>${NO_SCRIPT_CSS}</style>` }} />
		</div>
	);
}
