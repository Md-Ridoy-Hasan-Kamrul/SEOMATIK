/** Imperative WebGL2 renderer for the canyon plates. Browser-only; no React. */
import { CANYON_PLATES, EDGE_V_MAX, PLATE_ASPECT, PLATE_SIZE, SECTION3_START_FRAME } from './canyonPlates';
import type { EdgeCurve } from './canyonPlates';
import {
	cameraPushAt,
	coverScale,
	crossfadeAt,
	frameSegment,
	interpolateCurve,
	PLATE_LEFT_EDGES,
	PLATE_RIGHT_EDGES,
	warpAt,
} from './canyonMorph';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './canyonShader';
import { RISES } from './growthSystem';

/** Section 3 inputs: per-rock rise (RISES order), hover and the always-on strategy glow. */
export interface GrowthFrame {
	rises: readonly number[];
	presence: number;
	hoverRockId: number;
	hoverAmount: number;
	coreGlow: number;
	/** Rock-anchored effects only make sense when pins sit on the rocks (scene layout). */
	sceneLayout: boolean;
}

export interface CanyonFrame {
	framePos: number;
	slit: number;
	rocks: number;
	fog: number;
	timeS: number;
	reducedMotion: boolean;
	/** Foreground parallax offset in normalised image units (already strength-scaled). */
	parallaxX: number;
	parallaxY: number;
	growth: GrowthFrame;
}

export type ExtraTexture = 'emergeBase' | 'mask9' | 'mask10';
const EXTRA_TEXTURES: readonly ExtraTexture[] = ['emergeBase', 'mask9', 'mask10'];

export interface CanyonRenderer {
	uploadPlate(index: number, image: TexImageSource): void;
	uploadExtra(kind: ExtraTexture, image: TexImageSource): void;
	resize(cssWidth: number, cssHeight: number, pixelRatio: number): void;
	render(frame: CanyonFrame): void;
	dispose(): void;
}

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
	alpha: false,
	antialias: false,
	depth: false,
	stencil: false,
	premultipliedAlpha: false,
	powerPreference: 'high-performance',
};

const UNIFORM_NAMES = [
	'uFrom', 'uTo', 'uFromL', 'uFromR', 'uToL', 'uToR', 'uDstL', 'uDstR', 'uMix', 'uWarp',
	'uEdgeVMax', 'uView', 'uTime', 'uMotion', 'uSlit', 'uRocks', 'uFog', 'uPush', 'uParallax',
	'uEmergeSrc', 'uMask9', 'uMask10', 'uS3', 'uMaskMix', 'uMaskOn', 'uEmergeOn', 'uRise',
	'uHoverId', 'uHoverAmt', 'uCoreGlow',
] as const;
type UniformName = (typeof UNIFORM_NAMES)[number];
type Uniforms = Record<UniformName, WebGLUniformLocation | null>;

/** Texture units: 0/1 = morphing plates, then the section 3 extras. */
const UNIT = { from: 0, to: 1, emergeSrc: 2, mask9: 3, mask10: 4 } as const;
const PLATE9 = SECTION3_START_FRAME + 1;
const RISE_TRAVEL_PAD = 6;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
	console.error('[canyon] shader compile failed:', gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
	return null;
}

function linkProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
	const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	const program = gl.createProgram();
	if (!vs || !fs || !program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
	console.error('[canyon] program link failed:', gl.getProgramInfoLog(program));
	return null;
}

function locateUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Uniforms {
	return Object.fromEntries(UNIFORM_NAMES.map((n) => [n, gl.getUniformLocation(program, n)])) as Uniforms;
}

function createBlackTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
	return texture;
}

function setClamp(gl: WebGL2RenderingContext): void {
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function uploadTexture(gl: WebGL2RenderingContext, texture: WebGLTexture | null, image: TexImageSource): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	setClamp(gl);
}

/** Rock-id masks must never be filtered, or neighbouring ids would blend into a third rock. */
function uploadMask(gl: WebGL2RenderingContext, texture: WebGLTexture | null, image: TexImageSource): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	setClamp(gl);
}

/** Plates load in order of need; only morph between plates that have arrived. */
function loadedPrefix(loaded: readonly boolean[]): number {
	const firstMissing = loaded.indexOf(false);
	return firstMissing === -1 ? loaded.length : firstMissing;
}

function setCurve(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, curve: EdgeCurve): void {
	gl.uniform3f(location, curve[0], curve[1], curve[2]);
}

/** uRise[i] = (rise 0..1, travel in uv, base row in uv, rock id). */
function riseUniform(rises: readonly number[]): Float32Array {
	const data = new Float32Array(RISES.length * 4);
	RISES.forEach((r, i) => {
		data.set([rises[i] ?? 0, (r.height + RISE_TRAVEL_PAD) / PLATE_SIZE.height, r.base / PLATE_SIZE.height, r.rockId], i * 4);
	});
	return data;
}

export function createCanyonRenderer(canvas: HTMLCanvasElement): CanyonRenderer | null {
	const gl = canvas.getContext('webgl2', CONTEXT_ATTRIBUTES);
	if (!gl) return null;
	const program = linkProgram(gl);
	if (!program) return null;
	const u = locateUniforms(gl, program);
	const vao = gl.createVertexArray();
	const textures = CANYON_PLATES.map(() => createBlackTexture(gl));
	const loaded = CANYON_PLATES.map(() => false);
	const extras = Object.fromEntries(EXTRA_TEXTURES.map((k) => [k, createBlackTexture(gl)])) as Record<ExtraTexture, WebGLTexture | null>;
	const extraLoaded: Record<ExtraTexture, boolean> = { emergeBase: false, mask9: false, mask10: false };

	function bindUnit(unit: number, texture: WebGLTexture | null): void {
		gl!.activeTexture(gl!.TEXTURE0 + unit);
		gl!.bindTexture(gl!.TEXTURE_2D, texture);
	}

	/** In the frame 8 → Picture9 segment the incoming plate is plate 9 with the specialists removed. */
	function emergingSegment(from: number, to: number): boolean {
		return to === PLATE9 && from === SECTION3_START_FRAME && extraLoaded.emergeBase && extraLoaded.mask9;
	}

	function bindPlates(from: number, to: number): boolean {
		const emerging = emergingSegment(from, to);
		bindUnit(UNIT.from, textures[from]);
		bindUnit(UNIT.to, emerging ? extras.emergeBase : textures[to]);
		setCurve(gl!, u.uFromL, CANYON_PLATES[from].left);
		setCurve(gl!, u.uFromR, CANYON_PLATES[from].right);
		setCurve(gl!, u.uToL, CANYON_PLATES[to].left);
		setCurve(gl!, u.uToR, CANYON_PLATES[to].right);
		return emerging;
	}

	function setMorph(framePos: number, reducedMotion: boolean): void {
		const reachable = Math.max(0, loadedPrefix(loaded) - 1);
		const pos = Math.min(framePos, reachable);
		const { from, to } = frameSegment(pos);
		const target = to <= reachable ? to : from;
		const emerging = bindPlates(from, target);
		setCurve(gl!, u.uDstL, interpolateCurve(PLATE_LEFT_EDGES, pos));
		setCurve(gl!, u.uDstR, interpolateCurve(PLATE_RIGHT_EDGES, pos));
		gl!.uniform1f(u.uMix, target === from ? 0 : crossfadeAt(pos));
		gl!.uniform1f(u.uPush, reducedMotion || target === from ? 1 : cameraPushAt(pos));
		gl!.uniform1f(u.uWarp, reducedMotion ? 0 : warpAt(pos));
		gl!.uniform1f(u.uEmergeOn, emerging ? 1 : 0);
		gl!.uniform1f(u.uMaskMix, from >= PLATE9 ? crossfadeAt(pos) : 0);
	}

	function setGrowth(g: GrowthFrame): void {
		bindUnit(UNIT.emergeSrc, textures[PLATE9]);
		bindUnit(UNIT.mask9, extras.mask9);
		bindUnit(UNIT.mask10, extras.mask10);
		const masksReady = extraLoaded.mask9 && extraLoaded.mask10;
		gl!.uniform4fv(u.uRise, riseUniform(g.rises));
		gl!.uniform1f(u.uS3, g.presence);
		gl!.uniform1f(u.uMaskOn, masksReady && g.sceneLayout ? 1 : 0);
		gl!.uniform1f(u.uHoverId, g.hoverRockId);
		gl!.uniform1f(u.uHoverAmt, g.hoverAmount);
		gl!.uniform1f(u.uCoreGlow, g.coreGlow);
	}

	function setAtmosphere(frame: CanyonFrame): void {
		const view = coverScale(canvas.width / Math.max(canvas.height, 1), PLATE_ASPECT);
		gl!.uniform2f(u.uView, view.x, view.y);
		gl!.uniform2f(u.uParallax, frame.parallaxX, frame.parallaxY);
		gl!.uniform1f(u.uMotion, frame.reducedMotion ? 0 : 1);
		gl!.uniform1f(u.uTime, frame.timeS);
		gl!.uniform1f(u.uSlit, frame.slit);
		gl!.uniform1f(u.uRocks, frame.rocks);
		gl!.uniform1f(u.uFog, frame.fog);
	}

	gl.useProgram(program);
	gl.uniform1i(u.uFrom, UNIT.from);
	gl.uniform1i(u.uTo, UNIT.to);
	gl.uniform1i(u.uEmergeSrc, UNIT.emergeSrc);
	gl.uniform1i(u.uMask9, UNIT.mask9);
	gl.uniform1i(u.uMask10, UNIT.mask10);
	gl.uniform1f(u.uEdgeVMax, EDGE_V_MAX);

	return {
		uploadPlate(index, image) {
			uploadTexture(gl, textures[index], image);
			loaded[index] = true;
		},
		uploadExtra(kind, image) {
			if (kind === 'emergeBase') uploadTexture(gl, extras[kind], image);
			else uploadMask(gl, extras[kind], image);
			extraLoaded[kind] = true;
		},
		resize(cssWidth, cssHeight, pixelRatio) {
			canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
			canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
			gl.viewport(0, 0, canvas.width, canvas.height);
		},
		render(frame) {
			gl.useProgram(program);
			gl.bindVertexArray(vao);
			setGrowth(frame.growth);
			setMorph(frame.framePos, frame.reducedMotion);
			setAtmosphere(frame);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		},
		dispose() {
			[...textures, ...Object.values(extras)].forEach((t) => gl.deleteTexture(t));
			gl.deleteVertexArray(vao);
			gl.deleteProgram(program);
		},
	};
}

/**
 * Same API, but survives WebGL context loss (mobile tab switches, GPU resets):
 * remembers uploaded textures + size and rebuilds everything on restore.
 */
export function createResilientCanyonRenderer(canvas: HTMLCanvasElement): CanyonRenderer | null {
	let inner = createCanyonRenderer(canvas);
	if (!inner) return null;
	const plates: (TexImageSource | undefined)[] = [];
	const extras = new Map<ExtraTexture, TexImageSource>();
	let size: [number, number, number] | null = null;
	let lost = false;

	const onLost = (event: Event) => {
		event.preventDefault();
		lost = true;
	};
	const onRestored = () => {
		inner = createCanyonRenderer(canvas);
		lost = !inner;
		plates.forEach((image, i) => image && inner?.uploadPlate(i, image));
		extras.forEach((image, kind) => inner?.uploadExtra(kind, image));
		if (size) inner?.resize(...size);
	};
	canvas.addEventListener('webglcontextlost', onLost);
	canvas.addEventListener('webglcontextrestored', onRestored);

	return {
		uploadPlate(index, image) {
			plates[index] = image;
			if (!lost) inner?.uploadPlate(index, image);
		},
		uploadExtra(kind, image) {
			extras.set(kind, image);
			if (!lost) inner?.uploadExtra(kind, image);
		},
		resize(cssWidth, cssHeight, pixelRatio) {
			size = [cssWidth, cssHeight, pixelRatio];
			if (!lost) inner?.resize(cssWidth, cssHeight, pixelRatio);
		},
		render(frame) {
			if (!lost) inner?.render(frame);
		},
		dispose() {
			canvas.removeEventListener('webglcontextlost', onLost);
			canvas.removeEventListener('webglcontextrestored', onRestored);
			inner?.dispose();
		},
	};
}
