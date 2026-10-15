import type { CSSProperties, RefObject } from 'react';
import { CONNECTIONS, DISCIPLINES, HEADLINE_S3, STRATEGY, type LabelPose } from '../../../lib/hero/growthSystem';
import {
	GROWTH_CTA,
	GROWTH_KICKER,
	GROWTH_STATEMENT,
	GROWTH_SUB_STRATEGY,
	GROWTH_SUB_SYSTEM,
	GROWTH_TITLE_ID,
	GROWTH_TITLE_STRATEGY,
	GROWTH_TITLE_SYSTEM,
} from './growthCopy';
import './growth-system.css';

/** Pulses travel strategy → specialist; slightly different speeds keep them from marching in step. */
const PULSE_BASE_S = 2.6;
const PULSE_STEP_S = 0.23;

const lineStyle = (p: LabelPose) => ({ '--x': p.x, '--y': p.y, '--size': p.size, '--track': p.track }) as CSSProperties;
const labelStyle = (p: LabelPose) => ({ '--size': p.size, '--track': p.track }) as CSSProperties;

function Headline() {
	return (
		<div className="gs__head">
			<p className="gs__kicker">{GROWTH_KICKER}</p>
			<h2 className="gs__title" id={GROWTH_TITLE_ID}>
				<span className="gs__line gs__title9" style={lineStyle(HEADLINE_S3.title9)}>{GROWTH_TITLE_STRATEGY}</span>{' '}
				<span className="gs__line gs__title10" style={lineStyle(HEADLINE_S3.title10)}>{GROWTH_TITLE_SYSTEM}</span>
			</h2>
			<p className="gs__sub">
				<span className="gs__line gs__sub9" style={lineStyle(HEADLINE_S3.sub9)}>{GROWTH_SUB_STRATEGY}</span>{' '}
				<span className="gs__line gs__sub10" style={lineStyle(HEADLINE_S3.sub10)}>{GROWTH_SUB_SYSTEM}</span>
			</p>
		</div>
	);
}

/** Warm light connections: a soft halo stroke under a fine core, plus a travelling pulse. */
function Connections() {
	return (
		<svg className="gs__links" aria-hidden="true">
			<defs>
				<filter id="gs-glow" x="-10%" y="-10%" width="120%" height="120%">
					<feGaussianBlur stdDeviation="3" />
				</filter>
			</defs>
			{CONNECTIONS.map((c, i) => (
				<g key={i} className="gs__link" data-key={c.key}>
					<path className="gs__link-halo" pathLength={1} filter="url(#gs-glow)" />
					<path className="gs__link-core" id={`gs-path-${i}`} pathLength={1} />
					<circle className="gs__pulse" r="2.2">
						<animateMotion dur={`${PULSE_BASE_S + i * PULSE_STEP_S}s`} repeatCount="indefinite">
							<mpath href={`#gs-path-${i}`} />
						</animateMotion>
					</circle>
				</g>
			))}
		</svg>
	);
}

function StrategyCore() {
	return (
		<div className="gs__strategy" aria-hidden="true">
			<span className="gs__pin gs__pin--core9" data-pin="core9" />
			<span className="gs__pin gs__pin--core10" data-pin="core10" />
			<span className="gs__name gs__name--strategy9" data-label="strategy9" style={labelStyle(STRATEGY.labelDormant)}>{STRATEGY.label}</span>
			<span className="gs__name gs__name--strategy10" data-label="strategy10" style={labelStyle(STRATEGY.labelActive)}>{STRATEGY.label}</span>
		</div>
	);
}

/** Specialists: focusable so keyboard and touch users get the same highlight as hover. */
function Specialists() {
	return (
		<ul className="gs__nodes" aria-label="Disziplinen rund um Strategy">
			{DISCIPLINES.map((d) => (
				<li key={d.key} className="gs__node" data-key={d.key} tabIndex={0}>
					<span className="gs__pin gs__pin--dormant" data-pin="dormant" aria-hidden="true" />
					<span className="gs__pin gs__pin--active" data-pin="active" aria-hidden="true" />
					<span className="gs__name" data-label="active" style={labelStyle(d.labelActive)}>{d.label}</span>
				</li>
			))}
		</ul>
	);
}

/**
 * Section 3 "The SEOMATIK Growth System". Layout and reveal values are written
 * every frame by useCanyonScene (growthDom.ts); this component is static markup.
 */
export function GrowthSystem({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
	return (
		<section ref={rootRef} className="gs" aria-labelledby={GROWTH_TITLE_ID}>
			<Headline />
			<Connections />
			<StrategyCore />
			<Specialists />
			<div className="gs__foot">
				<p className="gs__statement">{GROWTH_STATEMENT}</p>
				<a className="gs__cta" href={GROWTH_CTA.href}>
					{GROWTH_CTA.label}
					<span aria-hidden="true">→</span>
				</a>
			</div>
		</section>
	);
}
