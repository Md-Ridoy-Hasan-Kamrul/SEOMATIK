import { type RefObject, useEffect, useState } from 'react';
import { HERO_BRAND, HERO_CTA, HERO_NAV_ITEMS } from './navItems';

const CTA_HREF = '#projekt';

function CtaLink({ className }: { className: string }) {
	return (
		<a className={className} href={CTA_HREF}>
			{HERO_CTA}
			<span aria-hidden="true">→</span>
		</a>
	);
}

export function HeroNav({ navRef }: { navRef: RefObject<HTMLElement | null> }) {
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open]);

	return (
		<nav ref={navRef} className="hero-nav" aria-label="Primary">
			<a className="hero-nav__brand" href="#top" aria-label={HERO_BRAND}>
				{HERO_BRAND}
			</a>

			<ul className="hero-nav__links" id="hero-menu" data-open={open || undefined}>
				{HERO_NAV_ITEMS.map((item) => (
					<li key={item.href}>
						<a href={item.href} className="hero-nav__link" onClick={close}>
							{item.label}
						</a>
					</li>
				))}
				<li className="hero-nav__panel-cta">
					<CtaLink className="hero-nav__cta" />
				</li>
			</ul>

			<CtaLink className="hero-nav__cta hero-nav__cta--bar" />

			<button
				type="button"
				className="hero-nav__burger"
				aria-expanded={open}
				aria-controls="hero-menu"
				aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
				onClick={() => setOpen((v) => !v)}
			>
				<span aria-hidden="true" data-open={open || undefined} />
			</button>
		</nav>
	);
}
