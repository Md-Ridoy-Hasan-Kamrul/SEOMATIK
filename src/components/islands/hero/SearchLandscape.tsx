import type { CSSProperties, RefObject } from 'react';
import { HEADLINE_S4, PANEL_LOCAL, SEARCH_PANELS, STRANDS, type Icon, type SearchPanel } from '../../../lib/hero/searchLandscape';
import { SEARCH_CORE_MESSAGE, SEARCH_CTA, SEARCH_KICKER, SEARCH_LIST_LABEL, SEARCH_SUB, SEARCH_TITLE, SEARCH_TITLE_ID } from './searchCopy';
import './search-landscape.css';

/** Light pulses travel along the connections at slightly different speeds. */
const PULSE_BASE_S = 3.2;
const PULSE_STEP_S = 0.37;
/** Panel keys at the two ends of strand link i (SEO–SEA, SEA–GEO, GEO–GEA, GEA–beyond). */
const LINK_ENDS = ['seo sea', 'sea geo', 'geo gea', 'gea'] as const;

const poseStyle = (p: { x: number; y: number; size: number; track?: number }) =>
	({ '--x': p.x, '--y': p.y, '--size': p.size, '--track': p.track ?? 0 }) as CSSProperties;

function PanelIcon({ icon }: { icon: Icon }) {
	return (
		<svg className="sl__icon" viewBox="0 0 40 40" aria-hidden="true">
			{icon === 'search' && (
				<>
					<circle cx="17" cy="17" r="10" />
					<path d="M24.5 24.5 33 33" />
				</>
			)}
			{icon === 'cursor' && <path d="M12 7v24l6.5-6 4.5 9.5 4-2-4.5-9.3H31Z" />}
			{icon === 'globe' && (
				<>
					<circle cx="20" cy="20" r="12.5" />
					<ellipse cx="20" cy="20" rx="5.5" ry="12.5" />
					<path d="M7.5 20h25M9.5 13.5h21M9.5 26.5h21" />
				</>
			)}
			{icon === 'nodes' && (
				<>
					{[[20, 8], [10, 14], [30, 14], [10, 26], [30, 26], [20, 32]].map(([x, y]) => (
						<circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" />
					))}
					<circle cx="20" cy="20" r="2.6" className="sl__icon-core" />
					<path d="M20 11.4v6M12.9 15.6l5 3M27.1 15.6l-5 3M12.9 24.4l5-3M27.1 24.4l-5-3M20 22.6v6" />
				</>
			)}
		</svg>
	);
}

/** Glass slab content in local px; a matrix3d written per frame puts it in perspective on the rock. */
function GlassPanel({ panel }: { panel: SearchPanel }) {
	return (
		<div
			className="sl__panel"
			style={
				{
					width: PANEL_LOCAL.width,
					height: panel.localHeight,
					'--k': panel.content.k,
					'--icon-y': panel.content.icon,
					'--label-y': panel.content.label,
					'--sub-y': panel.content.sub,
					'--lines-y': panel.content.lines,
				} as CSSProperties
			}
		>
			<span className="sl__glass" aria-hidden="true" />
			<span className="sl__frame" aria-hidden="true" />
			<span className="sl__flare sl__flare--tl" aria-hidden="true" />
			<span className="sl__flare sl__flare--tr" aria-hidden="true" />
			<PanelIcon icon={panel.icon} />
			<span className="sl__label">{panel.label}</span>
			<span className="sl__sub">
				{panel.sub.map((line) => (
					<span key={line}>{line}</span>
				))}
			</span>
			<span className="sl__lines" aria-hidden="true">
				<i /><i /><i /><i /><i /><i />
			</span>
		</div>
	);
}

function Panels() {
	return (
		<ul className="sl__items" aria-label={SEARCH_LIST_LABEL}>
			{SEARCH_PANELS.map((panel) => (
				<li key={panel.key} className="sl__item" data-key={panel.key} data-anchor={panel.anchor} tabIndex={0} aria-describedby={`sl-info-${panel.key}`}>
					<div className="sl__lift">
						<GlassPanel panel={panel} />
					</div>
					<div className="sl__info" id={`sl-info-${panel.key}`}>
						<strong>{panel.label}</strong>
						<span className="sl__info-sub">{panel.sub.join(' ')}</span>
						<p>{panel.info}</p>
					</div>
				</li>
			))}
		</ul>
	);
}

/** Picture12 strands and the Picture13 ribbon; path data is written per frame. */
function Connections() {
	return (
		<svg className="sl__links" aria-hidden="true">
			<defs>
				<filter id="sl-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="4" />
				</filter>
			</defs>
			{STRANDS.map((s, i) => (
				<g key={i} className="sl__strand" data-link={s.link} data-ends={LINK_ENDS[s.link]}>
					<path className="sl__halo" pathLength={1} filter="url(#sl-glow)" />
					<path className="sl__core" id={`sl-strand-${i}`} pathLength={1} />
					{i % 2 === 0 && (
						<circle className="sl__pulse" r="1.8">
							<animateMotion dur={`${PULSE_BASE_S + i * PULSE_STEP_S}s`} repeatCount="indefinite">
								<mpath href={`#sl-strand-${i}`} />
							</animateMotion>
						</circle>
					)}
				</g>
			))}
			<g className="sl__ribbon" data-ends="seo sea geo gea">
				<path className="sl__halo" pathLength={1} filter="url(#sl-glow)" />
				<path className="sl__core" id="sl-ribbon" pathLength={1} />
				<path className="sl__shimmer" pathLength={1} />
				{[0, 1, 2].map((k) => (
					<circle key={k} className="sl__pulse sl__pulse--ribbon" r="2.4">
						<animateMotion dur="5.5s" begin={`${-k * 1.83}s`} repeatCount="indefinite">
							<mpath href="#sl-ribbon" />
						</animateMotion>
					</circle>
				))}
			</g>
		</svg>
	);
}

/**
 * Section 4 "The New Search Landscape". Static markup; placement and reveal
 * are written every frame by useCanyonScene (searchDom.ts).
 */
export function SearchLandscape({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
	const { kicker, title, sub, cta } = HEADLINE_S4;
	return (
		<section ref={rootRef} className="sl" aria-labelledby={SEARCH_TITLE_ID}>
			<div className="sl__head">
				<p className="sl__kicker" style={poseStyle(kicker)}>{SEARCH_KICKER}</p>
				<h2 className="sl__title" id={SEARCH_TITLE_ID} style={poseStyle(title)}>{SEARCH_TITLE}</h2>
				<p className="sl__sub-line" style={{ ...poseStyle(sub), '--lh': sub.lineHeight } as CSSProperties}>
					<span>{SEARCH_SUB[0]}</span> <span>{SEARCH_SUB[1]}</span>
					<span className="sl__sr">{SEARCH_CORE_MESSAGE}</span>
				</p>
			</div>
			<Connections />
			<Panels />
			<a
				className="sl__cta"
				href={SEARCH_CTA.href}
				style={{ '--x0': cta.x0, '--x1': cta.x1, '--y0': cta.y0, '--y1': cta.y1, '--size': cta.size } as CSSProperties}
			>
				{SEARCH_CTA.label}
				<span aria-hidden="true">→</span>
			</a>
		</section>
	);
}
