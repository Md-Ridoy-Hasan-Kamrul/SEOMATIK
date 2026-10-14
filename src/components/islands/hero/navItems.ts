/** Primary hero nav — matches the reference frames (German labels). */
export type HeroNavItem = {
	label: string;
	href: string;
};

export const HERO_NAV_ITEMS: HeroNavItem[] = [
	{ label: 'Growth', href: '#growth' },
	{ label: 'Sichtbarkeit', href: '#sichtbarkeit' },
	{ label: 'Technologie', href: '#technologie' },
	{ label: 'Insights', href: '#insights' },
	{ label: 'Company', href: '#company' },
];

export const HERO_BRAND = 'SEOMATIK';
export const HERO_BRANDLINE = 'DIGITAL GROWTH. ENGINEERED.';
export const HERO_CTA = 'Projekt starten';
