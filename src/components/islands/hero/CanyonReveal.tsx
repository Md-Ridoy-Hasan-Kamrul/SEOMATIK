import type { CSSProperties } from 'react';
import {
	REVEAL_CTAS,
	REVEAL_DISCIPLINES,
	REVEAL_EXPLANATION,
	REVEAL_HEADLINE,
	REVEAL_TITLE_ID,
} from './revealCopy';
import './canyon-reveal.css';

const indexStyle = (i: number) => ({ '--i': i }) as CSSProperties;

function RevealCta({ label, href, variant, index }: { label: string; href: string; variant: 'primary' | 'secondary'; index: number }) {
	return (
		<a className={`reveal__cta reveal__cta--${variant}`} href={href} style={indexStyle(index)}>
			{label}
			<span aria-hidden="true">→</span>
		</a>
	);
}

/**
 * Section 2 "Canyon Opening / Hero Reveal". Every element is positioned and
 * revealed by CSS variables that useCanyonScene writes from the scroll position.
 */
export function CanyonReveal() {
	return (
		<section className="reveal" aria-labelledby={REVEAL_TITLE_ID}>
			<h2 className="reveal__title" id={REVEAL_TITLE_ID}>
				<span className="reveal__line reveal__line--1">{REVEAL_HEADLINE[0]}</span>{' '}
				<span className="reveal__line reveal__line--2">{REVEAL_HEADLINE[1]}</span>
			</h2>
			<span className="reveal__rule" aria-hidden="true" />

			<div className="reveal__body">
				<ul className="reveal__disciplines" aria-label="Disziplinen">
					{REVEAL_DISCIPLINES.map((item, i) => (
						<li key={item} style={indexStyle(i)}>
							{item}
						</li>
					))}
				</ul>

				<p className="reveal__explanation">
					{REVEAL_EXPLANATION.map((line, i) => (
						<span key={line} style={indexStyle(i)}>
							{line}{' '}
						</span>
					))}
				</p>

				<div className="reveal__ctas">
					<RevealCta {...REVEAL_CTAS.primary} variant="primary" index={0} />
					<RevealCta {...REVEAL_CTAS.secondary} variant="secondary" index={1} />
				</div>
			</div>
		</section>
	);
}
