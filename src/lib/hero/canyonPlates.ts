/**
 * Background plates for the canyon hero.
 *
 * Each plate is one of the reference frames (public/assets/hero/Picture1..5.png)
 * cropped to the page area (1352×968) with the baked-in nav + wordmark removed,
 * so the live HTML text can sit on top. Edge curves describe the bright gap
 * between the two rock faces, fitted per frame, and drive the shader morph.
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
];

export const LAST_FRAME = CANYON_PLATES.length - 1;

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
 * Live wordmark pose per frame. The reference frames place SEOMATIK ~15 design px
 * higher (and ~1.3 % larger) once the canyon opens; following that keeps the
 * live text exactly where each reference frame has it.
 */
export interface WordmarkPose {
	shiftYEm: number;
	scale: number;
}

export const WORDMARK_POSES: readonly WordmarkPose[] = [
	{ shiftYEm: 0, scale: 1 },
	{ shiftYEm: -0.015, scale: 1 },
	{ shiftYEm: -0.166, scale: 1.012 },
	{ shiftYEm: -0.151, scale: 1.014 },
	{ shiftYEm: -0.146, scale: 1.014 },
];
