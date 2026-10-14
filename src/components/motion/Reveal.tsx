import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { DURATION, EASE } from '../../lib/motion/tokens';

type RevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	y?: number;
};

/** Scroll-triggered fade/slide — reuse in new sections. */
export default function Reveal({
	children,
	className = '',
	delay = 0,
	y = 24,
}: RevealProps) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			initial={reduceMotion ? false : { opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.35 }}
			transition={{
				duration: reduceMotion ? 0 : DURATION.base,
				ease: EASE.out,
				delay: reduceMotion ? 0 : delay,
			}}
		>
			{children}
		</motion.div>
	);
}
