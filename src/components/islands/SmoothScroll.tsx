import { useEffect } from 'react';
import 'lenis/dist/lenis.css';
import { destroySmoothScroll, initSmoothScroll } from '../../lib/smoothScroll';

/** Site-wide Lenis — mount once from Layout with `transition:persist`. */
export default function SmoothScroll() {
	useEffect(() => {
		initSmoothScroll();

		function onPageLoad() {
			initSmoothScroll();
		}

		document.addEventListener('astro:page-load', onPageLoad);

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		const onReduce = () => {
			if (reduce.matches) destroySmoothScroll();
			else initSmoothScroll();
		};
		reduce.addEventListener('change', onReduce);

		return () => {
			document.removeEventListener('astro:page-load', onPageLoad);
			reduce.removeEventListener('change', onReduce);
			destroySmoothScroll();
		};
	}, []);

	return null;
}
