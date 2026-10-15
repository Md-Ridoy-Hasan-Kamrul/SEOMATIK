/**
 * Background plates for the canyon hero (sections 1 + 2 share one scene).
 *
 * Each plate is a reference frame (public/assets/hero/Picture1..5.png and
 * public/assets/hero/canyon/Picture6..8.png) cropped to the page area (1352×968)
 * with all baked-in text removed, so the live HTML text can sit on top. Edge
 * curves describe the opening between the two rock faces and drive the morph.
 */

export const PLATE_SIZE = { width: 1352, height: 968 } as const;
export const PLATE_ASPECT = PLATE_SIZE.width / PLATE_SIZE.height;

/** Gap edge as x = a + b·v + c·v² in normalised image space (v = 0 at the top). */
export type EdgeCurve = readonly [number, number, number];

export interface CanyonPlate {
	src: string;
	left: EdgeCurve;
	right: EdgeCurve;
}

export const CANYON_PLATES: readonly CanyonPlate[] = [
	{ src: '/assets/hero/plates/plate-1.webp', left: [0.4949, 0.00853, -0.01589], right: [0.50217, 0.014, -0.02456] },
	{ src: '/assets/hero/plates/plate-2.webp', left: [0.48306, 0.00928, -0.02845], right: [0.5017, 0.03497, -0.04964] },
	{ src: '/assets/hero/plates/plate-3.webp', left: [0.46039, 0.04281, -0.07488], right: [0.51431, -0.00452, 0.01134] },
	{ src: '/assets/hero/plates/plate-4.webp', left: [0.4377, 0.01409, -0.0095], right: [0.5708, -0.0674, 0.07897] },
	{ src: '/assets/hero/plates/plate-5.webp', left: [0.39628, 0.04432, -0.11318], right: [0.59769, 0.07031, 0.01498] },
	{ src: '/assets/hero/plates/plate-6.webp', left: [0.375, -0.02594, -0.05355], right: [0.73686, 0.17687, -0.16383] },
	{ src: '/assets/hero/plates/plate-7.webp', left: [0.21965, -0.00728, -0.40395], right: [0.78114, 0.36008, -0.34571] },
	{ src: '/assets/hero/plates/plate-8.webp', left: [0.23587, 0.02876, -0.25176], right: [0.97233, -0.14045, 0.06012] },
	// Section 3 (Growth System): not a canyon gap any more, so edges repeat frame 8 and warp is off.
	{ src: '/assets/hero/plates/plate-9.webp', left: [0.23587, 0.02876, -0.25176], right: [0.97233, -0.14045, 0.06012] },
	{ src: '/assets/hero/plates/plate-10.webp', left: [0.23587, 0.02876, -0.25176], right: [0.97233, -0.14045, 0.06012] },
];

export const LAST_FRAME = CANYON_PLATES.length - 1;

/** Frame index (0-based) of Picture5: section 1 ends and the canyon reveal begins. */
export const SECTION2_START_FRAME = 4;

/** Frame index of Picture8: section 2 is complete and the Growth System begins. */
export const SECTION3_START_FRAME = 7;

/** Section 3 extras: plate 9 without the seven specialist rocks (they rise in) and per-rock masks. */
export const GROWTH_ASSETS = {
	emergeBase: '/assets/hero/plates/plate-9-norocks.webp',
	/** R = rock id × 16, G = coverage, B = parallax depth. */
	rockMask9: '/assets/hero/plates/rocks-9.png',
	rockMask10: '/assets/hero/plates/rocks-10.png',
} as const;

/** Curves were fitted down to this row; below it the walls meet the floor, so edges are held. */
export const EDGE_V_MAX = 0.6;

/**
 * Centre of each SEOMATIK glyph in frame 1, in em (92.2 design px) from the page
 * centre. Placing letters here reproduces the reference letter-spacing exactly,
 * even though the web font's glyph widths differ slightly from the mock's font.
 */
export const WORDMARK_LETTER_CENTERS_EM: readonly number[] = [
	-3.7961, -2.7278, -1.551, -0.2223, 1.0087, 2.0228, 2.9013, 3.8069,
];

/**
 * Live wordmark pose per frame, measured on the references: ~15 design px higher
 * once the canyon opens, then in frame 6 it has risen 108 px as a faint ghost
 * (the reveal headline takes over) and is gone by frame 7.
 */
export interface WordmarkPose {
	shiftYEm: number;
	scale: number;
	opacity: number;
}

/** Frame position by which the frame-6 ghost has fully faded (before "WE BUILD" rises into its row). */
export const WORDMARK_FADE_OUT_END = SECTION2_START_FRAME + 1.25;

export const WORDMARK_POSES: readonly WordmarkPose[] = [
	{ shiftYEm: 0, scale: 1, opacity: 1 },
	{ shiftYEm: -0.015, scale: 1, opacity: 1 },
	{ shiftYEm: -0.166, scale: 1.012, opacity: 1 },
	{ shiftYEm: -0.151, scale: 1.014, opacity: 1 },
	{ shiftYEm: -0.146, scale: 1.014, opacity: 1 },
	{ shiftYEm: -1.171, scale: 1.004, opacity: 0.26 },
	{ shiftYEm: -1.6, scale: 1.004, opacity: 0 },
	{ shiftYEm: -1.9, scale: 1.004, opacity: 0 },
	{ shiftYEm: -2.1, scale: 1.004, opacity: 0 },
	{ shiftYEm: -2.3, scale: 1.004, opacity: 0 },
];
