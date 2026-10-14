import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE, STAGGER } from '../../lib/motion/tokens';

const items = [
	{ key: 'eyebrow', el: 'p' as const, className: 'm-0 font-mono text-xs uppercase tracking-[0.2em] text-sea', text: 'Astro + React + Motion' },
	{
		key: 'title',
		el: 'h1' as const,
		className:
			'mt-4 m-0 font-display text-[clamp(2rem,8vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-ink',
		text: 'Your animated site starts here',
	},
	{
		key: 'body',
		el: 'p' as const,
		className: 'mt-4 m-0 max-w-md text-pretty text-ink-soft',
		text: 'Motion + Lenis are wired. Build sections in `src/components/islands/` and `Reveal.tsx`.',
	},
];

export default function LandingHero() {
	const reduceMotion = useReducedMotion();

	return (
		<main
			id="main"
			className="mx-auto flex flex-1 w-[min(100%-2rem,40rem)] flex-col items-center justify-center px-4 pb-16 text-center"
		>
			<motion.div
				className="grid w-full justify-items-center"
				initial="hidden"
				animate="show"
				variants={{
					hidden: {},
					show: {
						transition: {
							staggerChildren: reduceMotion ? 0 : STAGGER,
							delayChildren: reduceMotion ? 0 : 0.05,
						},
					},
				}}
			>
				{items.map((item) => {
					const Tag = item.el;
					return (
						<motion.div
							key={item.key}
							variants={{
								hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
								show: {
									opacity: 1,
									y: 0,
									transition: {
										duration: reduceMotion ? 0 : DURATION.base,
										ease: EASE.out,
									},
								},
							}}
						>
							<Tag className={item.className}>{item.text}</Tag>
						</motion.div>
					);
				})}
			</motion.div>
		</main>
	);
}
