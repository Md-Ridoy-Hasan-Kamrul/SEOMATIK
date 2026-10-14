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

	return lenis;
}

export function destroySmoothScroll() {
	lenis?.destroy();
	lenis = null;
}
