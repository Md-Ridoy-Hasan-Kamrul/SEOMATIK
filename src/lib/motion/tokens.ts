/** Shared motion timings — use in Motion variants and CSS. */
export const DURATION = {
	fast: 0.35,
	base: 0.6,
	slow: 0.9,
} as const;

export const EASE = {
	out: [0.22, 1, 0.36, 1] as const,
	inOut: [0.65, 0, 0.35, 1] as const,
};

export const STAGGER = 0.08;
