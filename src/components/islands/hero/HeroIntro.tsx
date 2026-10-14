import { useState } from 'react';
import { motion } from 'motion/react';
import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/600.css';
import {
	HERO_BRAND,
	HERO_BRANDLINE,
	HERO_CTA,
	HERO_NAV_ITEMS,
} from './navItems';
import { useHeroReveal } from './useHeroReveal';
import './hero-intro.css';

function HeroNav({
	open,
	onToggle,
}: {
	open: boolean;
	onToggle: () => void;
}) {
	return (
		<nav className="hero-nav" aria-label="Primary">
			<a className="hero-nav__brand" href="#top">
				{HERO_BRAND}
			</a>

			<ul className="hero-nav__links" id="hero-menu" data-open={open || undefined}>
				{HERO_NAV_ITEMS.map((item) => (
					<li key={item.href}>
						<a href={item.href} className="hero-nav__link">
							{item.label}
						</a>
					</li>
				))}
			</ul>

			<a className="hero-nav__cta" href="#projekt">
				{HERO_CTA}
				<span aria-hidden="true">→</span>
			</a>

			<button
				type="button"
				className="hero-nav__burger"
				aria-expanded={open}
				aria-controls="hero-menu"
				aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
				onClick={onToggle}
			>
				<span aria-hidden="true" data-open={open || undefined} />
			</button>
		</nav>
	);
}

/** SEOMATIK wordmark letters split so each can animate independently. */
function Wordmark() {
	return (
		<span className="hero-scene__chars" aria-hidden="true">
			{HERO_BRAND.split('').map((char, index) => (
				<span
					key={`${char}-${index}`}
					className="hero-scene__char"
					style={{ ['--char-index' as string]: index }}
				>
					{char}
				</span>
			))}
		</span>
	);
}

export default function HeroIntro() {
	const [menuOpen, setMenuOpen] = useState(false);
	const {
		sceneRef,
		ready,
		reduceMotion,
		leftWallTransform,
		rightWallTransform,
		beamWidth,
		skyOpacity,
		floorOpacity,
		canyonScale,
		wordmarkTransform,
	} = useHeroReveal();

	return (
		<section ref={sceneRef} className="hero" id="top" aria-label="SEOMATIK">
			<div
				className="hero__sticky"
				data-ready={ready || undefined}
				data-reduced={reduceMotion || undefined}
			>
				<HeroNav open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />

				<div className="hero-scene" aria-hidden="true">
					{/* Revealed open canyon (photoreal base) brightens as the gap widens. */}
					<motion.div
						className="hero-scene__canyon"
						style={{ opacity: skyOpacity, scale: canyonScale }}
					/>

					{/* Central light slit — the first thing visible on near-black load. */}
					<motion.div className="hero-scene__beam" style={{ width: beamWidth }} />

					{/* Two photoreal rock walls meeting at centre; they part on scroll. */}
					<motion.div
						className="hero-scene__wall hero-scene__wall--left"
						style={{ transform: leftWallTransform }}
					/>
					<motion.div
						className="hero-scene__wall hero-scene__wall--right"
						style={{ transform: rightWallTransform }}
					/>

					{/* Slow volumetric fog. */}
					<div className="hero-scene__fog hero-scene__fog--far" />
					<div className="hero-scene__fog hero-scene__fog--near" />

					{/* Wet-floor reflection of the central light. */}
					<motion.div className="hero-scene__floor" style={{ opacity: floorOpacity }} />

					{/* Cinematic polish. */}
					<div className="hero-scene__vignette" />
					<div className="hero-scene__grain" />
				</div>

				<motion.h1
					className="hero-scene__wordmark"
					aria-label={HERO_BRAND}
					style={{ transform: wordmarkTransform }}
				>
					<Wordmark />
				</motion.h1>

				<p className="hero-scene__brandline">{HERO_BRANDLINE}</p>

				<a className="hero-scene__scroll" href="#technologie" aria-label="Weiter scrollen">
					<span className="hero-scene__scroll-dot" aria-hidden="true" />
					<span className="hero-scene__scroll-label">Scroll</span>
				</a>
			</div>
		</section>
	);
}
