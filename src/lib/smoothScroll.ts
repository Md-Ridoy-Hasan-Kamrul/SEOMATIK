import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function getLenis() {
	return lenis;
}

export function initSmoothScroll() {
	if (typeof window === 'undefined') return null;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
	if (lenis) return lenis;

	lenis = new Lenis({
		autoRaf: true,
		lerp: 0.085,
		wheelMultiplier: 0.9,
		touchMultiplier: 1.1,
	});

	document.documentElement.classList.add('lenis', 'lenis-smooth');

	return lenis;
}

export function destroySmoothScroll() {
	lenis?.destroy();
	lenis = null;
	document.documentElement.classList.remove('lenis', 'lenis-smooth');
}

export type ScrollToOptions = {
	offset?: number;
	immediate?: boolean;
};

/** Smooth scroll to top, pixel offset, or selector (uses Lenis when active). */
export function scrollSmoothTo(
	target: number | string,
	options: ScrollToOptions = {},
) {
	const { offset = 0, immediate = false } = options;

	if (lenis) {
		lenis.scrollTo(target, { offset, immediate });
		return;
	}

	if (typeof target === 'number') {
		window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
		return;
	}

	const el = document.querySelector(target);
	if (el) {
		el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' });
	}
}
