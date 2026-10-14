/** Imperative WebGL2 renderer for the canyon plates. Browser-only; no React. */
import { CANYON_PLATES, EDGE_V_MAX, PLATE_ASPECT } from './canyonPlates';
import type { EdgeCurve } from './canyonPlates';
import {
	coverScale,
	crossfadeWeight,
	frameSegment,
	interpolateCurve,
	PLATE_LEFT_EDGES,
	PLATE_RIGHT_EDGES,
} from './canyonMorph';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './canyonShader';

export interface CanyonFrame {
	framePos: number;
	slit: number;
	rocks: number;
	fog: number;
	timeS: number;
	reducedMotion: boolean;
}

export interface CanyonRenderer {
	uploadPlate(index: number, image: TexImageSource): void;
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
	'uEdgeVMax', 'uView', 'uTime', 'uMotion', 'uSlit', 'uRocks', 'uFog',
] as const;
type UniformName = (typeof UNIFORM_NAMES)[number];
type Uniforms = Record<UniformName, WebGLUniformLocation | null>;

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

function uploadTexture(gl: WebGL2RenderingContext, texture: WebGLTexture | null, image: TexImageSource): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/** Plates load in order of need; only morph between plates that have arrived. */
function loadedPrefix(loaded: readonly boolean[]): number {
	const firstMissing = loaded.indexOf(false);
	return firstMissing === -1 ? loaded.length : firstMissing;
}

function setCurve(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, curve: EdgeCurve): void {
	gl.uniform3f(location, curve[0], curve[1], curve[2]);
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

	function bindPlates(from: number, to: number): void {
		gl!.activeTexture(gl!.TEXTURE0);
		gl!.bindTexture(gl!.TEXTURE_2D, textures[from]);
		gl!.activeTexture(gl!.TEXTURE1);
		gl!.bindTexture(gl!.TEXTURE_2D, textures[to]);
		setCurve(gl!, u.uFromL, CANYON_PLATES[from].left);
		setCurve(gl!, u.uFromR, CANYON_PLATES[from].right);
		setCurve(gl!, u.uToL, CANYON_PLATES[to].left);
		setCurve(gl!, u.uToR, CANYON_PLATES[to].right);
	}

	function setMorph(framePos: number): void {
		const reachable = Math.max(0, loadedPrefix(loaded) - 1);
		const pos = Math.min(framePos, reachable);
		const { from, to, t } = frameSegment(pos);
		const target = to <= reachable ? to : from;
		bindPlates(from, target);
		setCurve(gl!, u.uDstL, interpolateCurve(PLATE_LEFT_EDGES, pos));
		setCurve(gl!, u.uDstR, interpolateCurve(PLATE_RIGHT_EDGES, pos));
		gl!.uniform1f(u.uMix, target === from ? 0 : crossfadeWeight(t));
	}

	function setAtmosphere(frame: CanyonFrame): void {
		const view = coverScale(canvas.width / Math.max(canvas.height, 1), PLATE_ASPECT);
		gl!.uniform2f(u.uView, view.x, view.y);
		gl!.uniform1f(u.uWarp, frame.reducedMotion ? 0 : 1);
		gl!.uniform1f(u.uMotion, frame.reducedMotion ? 0 : 1);
		gl!.uniform1f(u.uTime, frame.timeS);
		gl!.uniform1f(u.uSlit, frame.slit);
		gl!.uniform1f(u.uRocks, frame.rocks);
		gl!.uniform1f(u.uFog, frame.fog);
	}

	gl.useProgram(program);
	gl.uniform1i(u.uFrom, 0);
	gl.uniform1i(u.uTo, 1);
	gl.uniform1f(u.uEdgeVMax, EDGE_V_MAX);

	return {
		uploadPlate(index, image) {
			uploadTexture(gl, textures[index], image);
			loaded[index] = true;
		},
		resize(cssWidth, cssHeight, pixelRatio) {
			canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
			canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
			gl.viewport(0, 0, canvas.width, canvas.height);
		},
		render(frame) {
			gl.useProgram(program);
			gl.bindVertexArray(vao);
			setMorph(frame.framePos);
			setAtmosphere(frame);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		},
		dispose() {
			textures.forEach((t) => gl.deleteTexture(t));
			gl.deleteVertexArray(vao);
			gl.deleteProgram(program);
		},
	};
}

/**
 * Same API, but survives WebGL context loss (mobile tab switches, GPU resets):
 * remembers uploaded plates + size and rebuilds everything on restore.
 */
export function createResilientCanyonRenderer(canvas: HTMLCanvasElement): CanyonRenderer | null {
	let inner = createCanyonRenderer(canvas);
	if (!inner) return null;
	const plates: (TexImageSource | undefined)[] = [];
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
		if (size) inner?.resize(...size);
	};
	canvas.addEventListener('webglcontextlost', onLost);
	canvas.addEventListener('webglcontextrestored', onRestored);

	return {
		uploadPlate(index, image) {
			plates[index] = image;
			if (!lost) inner?.uploadPlate(index, image);
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
