import type { CSSProperties, RefObject } from 'react';
import { AI_LINKS, AI_MODULES, HEADLINE_S5, ORBIT_LOCAL, type AiIcon, type AiModule } from '../../../lib/hero/aiTech';
import { AI_CORE_LABEL, AI_CORE_MESSAGE, AI_CTA, AI_KICKER, AI_LIST_LABEL, AI_SUB_14, AI_SUB_15, AI_TITLE, AI_TITLE_ID } from './aiCopy';
import './ai-tech.css';

/** Signals travel along every connection into the core at slightly different speeds. */
const PULSE_BASE_S = 2.4;
const PULSE_STEP_S = 0.29;
const GEAR_TEETH = 8;

const poseStyle = (p: { x: number; y: number; size: number; track?: number }) =>
	({ '--x': p.x, '--y': p.y, '--size': p.size, '--track': p.track ?? 0 }) as CSSProperties;

function gearPath(): string {
	const pts: string[] = [];
	for (let i = 0; i < GEAR_TEETH * 2; i++) {
		const a0 = (i / (GEAR_TEETH * 2)) * Math.PI * 2;
		const a1 = ((i + 1) / (GEAR_TEETH * 2)) * Math.PI * 2;
		const r = i % 2 === 0 ? 10 : 7.6;
		pts.push(`${(12 + r * Math.cos(a0)).toFixed(2)},${(12 + r * Math.sin(a0)).toFixed(2)}`, `${(12 + r * Math.cos(a1)).toFixed(2)},${(12 + r * Math.sin(a1)).toFixed(2)}`);
	}
	return `M${pts.join('L')}Z`;
}
const GEAR = gearPath();

/** Thin line icons in the style of Picture15 — interface glyphs, not robot heads or glowing brains. */
function ModuleIcon({ icon, className }: { icon: AiIcon | 'bars'; className: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" aria-hidden="true">
			{icon === 'brain' && (
				<>
					<path d="M11.5 4.5a3 3 0 0 0-5 1.6 3 3 0 0 0-2.2 4.1 3.2 3.2 0 0 0 .4 5.4 3 3 0 0 0 2.6 3.8 3 3 0 0 0 4.2.6Z" />
					<path d="M12.5 4.5a3 3 0 0 1 5 1.6 3 3 0 0 1 2.2 4.1 3.2 3.2 0 0 1-.4 5.4 3 3 0 0 1-2.6 3.8 3 3 0 0 1-4.2.6Z" />
					<path d="M8.5 9.5c1 .2 1.8 1 2 2M15.5 9.5c-1 .2-1.8 1-2 2M7.6 14.6c1.2-.3 2.4.2 3 1.2M16.4 14.6c-1.2-.3-2.4.2-3 1.2" />
				</>
			)}
			{icon === 'cap' && <path d="M2 9.5 12 5l10 4.5-10 4.5Z M6.5 11.5v4.3c0 1.3 2.5 2.7 5.5 2.7s5.5-1.4 5.5-2.7v-4.3 M22 9.5v5" />}
			{icon === 'gear' && (
				<>
					<path d={GEAR} />
					<circle cx="12" cy="12" r="3.2" />
				</>
			)}
			{icon === 'people' && (
				<>
					<circle cx="9" cy="8" r="3.2" />
					<path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
					<circle cx="16.8" cy="9" r="2.6" />
					<path d="M15.8 14.2c3 .2 5.2 2.6 5.2 5.8" />
				</>
			)}
			{icon === 'database' && (
				<>
					<ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
					<path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13 M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
				</>
			)}
			{icon === 'flow' && (
				<>
					<path d="M6.5 3.5c2-.6 4 .4 4.3 2.4.3 2-1.5 3.6-3.5 3.6S3.6 8 4 6.2c.2-1.2 1.2-2.3 2.5-2.7Z" />
					<circle cx="17" cy="17" r="2.8" />
					<path d="M7.5 9.6v3.6a3.6 3.6 0 0 0 3.6 3.6h3.1" />
				</>
			)}
			{icon === 'bars' && <path d="M5 20v-6M10 20v-9M15 20v-13M20 20v-4" />}
		</svg>
	);
}

/** Picture14 card: frosted slab with a large glyph and serif title. */
function EmergeCard({ module }: { module: AiModule }) {
	const box = module.emergeLocal!;
	const [first, ...rest] = module.title.split(' ');
	return (
		<div className="ai__card ai__card--emerge" style={{ width: box.width, height: box.height, '--k': box.k, '--title-x': `${box.titleX * 100}%` } as CSSProperties}>
			<span className="ai__glass" aria-hidden="true" />
			<span className="ai__dots" aria-hidden="true"><i /><i /><i /></span>
			<ModuleIcon icon={module.key === 'training' ? 'bars' : module.icon} className="ai__glyph" />
			<span className="ai__serif">
				<span>{first}</span>
				{rest.length > 0 && <span>{rest.join(' ')}</span>}
			</span>
			<span className="ai__rule" aria-hidden="true"><i /><i /><i /></span>
			<span className="ai__arrow" aria-hidden="true">→</span>
		</div>
	);
}

/** Picture15 card: compact interface module with icon, title and two-line description. */
function OrbitCard({ module }: { module: AiModule }) {
	return (
		<div className="ai__card ai__card--orbit" style={{ width: ORBIT_LOCAL.width, height: ORBIT_LOCAL.height }}>
			<span className="ai__glass" aria-hidden="true" />
			<ModuleIcon icon={module.icon} className="ai__icon" />
			<span className="ai__title-sm">{module.title}</span>
			<span className="ai__lines">
				<span>{module.lines[0]}</span>
				<span>{module.lines[1]}</span>
			</span>
			<span className="ai__node ai__node--l" aria-hidden="true" />
			<span className="ai__node ai__node--r" aria-hidden="true" />
		</div>
	);
}

function Modules() {
	return (
		<ul className="ai__items" aria-label={AI_LIST_LABEL}>
			{AI_MODULES.map((m) => (
				<li key={m.key} className="ai__item" data-key={m.key} tabIndex={0} aria-describedby={`ai-info-${m.key}`}>
					<div className="ai__lift">
						{m.emergeLocal && <EmergeCard module={m} />}
						<OrbitCard module={m} />
					</div>
					<div className="ai__info" id={`ai-info-${m.key}`}>
						<strong>{m.title}</strong>
						<p>{m.info}</p>
					</div>
				</li>
			))}
		</ul>
	);
}

function Connections() {
	return (
		<svg className="ai__links" aria-hidden="true">
			<defs>
				<filter id="ai-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="2.6" />
				</filter>
			</defs>
			{AI_LINKS.map((l, i) => (
				<g key={i} className="ai__link" data-keys={l.keys.join(' ')}>
					<path className="ai__halo" pathLength={1} filter="url(#ai-glow)" />
					<path className="ai__core-line" id={`ai-link-${i}`} pathLength={1} />
					<circle className="ai__end ai__end--a" r="2.6" />
					<circle className="ai__end ai__end--b" r="2.6" />
					<circle className="ai__pulse" r="1.9">
						<animateMotion dur={`${PULSE_BASE_S + i * PULSE_STEP_S}s`} repeatCount="indefinite">
							<mpath href={`#ai-link-${i}`} />
						</animateMotion>
					</circle>
				</g>
			))}
		</svg>
	);
}

/**
 * Section 5 "AI Tech". Static markup; placement and reveal are written every
 * frame by useCanyonScene (aiDom.ts).
 */
export function AiTech({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
	const { f14, f15 } = HEADLINE_S5;
	return (
		<section ref={rootRef} className="ai" aria-labelledby={AI_TITLE_ID}>
			<span className="ai__hud" aria-hidden="true" />
			<div className="ai__head">
				<p className="ai__kicker" style={poseStyle(f15.kicker)}>{AI_KICKER}</p>
				<h2 className="ai__title" id={AI_TITLE_ID}>
					<span className="ai__line ai__line--1">{AI_TITLE[0]}</span>{' '}
					<span className="ai__line ai__line--2">{AI_TITLE[1]}</span>
				</h2>
				<p className="ai__sub ai__sub--14" style={poseStyle(f14.sub)}>{AI_SUB_14}</p>
				<p className="ai__sub ai__sub--15" style={{ ...poseStyle(f15.sub), '--lh': f15.sub.lineHeight } as CSSProperties}>
					<span>{AI_SUB_15[0]}</span> <span>{AI_SUB_15[1]}</span>
					<span className="ai__sr">{AI_CORE_MESSAGE}</span>
				</p>
				<a
					className="ai__cta"
					href={AI_CTA.href}
					style={{ '--x': f15.cta.x, '--y': f15.cta.y, '--w': f15.cta.width, '--h': f15.cta.height, '--size': f15.cta.size } as CSSProperties}
				>
					{AI_CTA.label}
					<span aria-hidden="true">→</span>
				</a>
			</div>
			<Connections />
			<p className="ai__core" aria-hidden="true" style={{ '--s1': f15.core1.size, '--t1': f15.core1.track, '--s2': f15.core2.size, '--t2': f15.core2.track } as CSSProperties}>
				<span>{AI_CORE_LABEL[0]}</span>
				<span>{AI_CORE_LABEL[1]}</span>
			</p>
			<Modules />
		</section>
	);
}
