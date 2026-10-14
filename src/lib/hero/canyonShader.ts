/** GLSL for the canyon scene. `edgeAt` / `warpX` mirror `canyonMorph.ts` (unit-tested there). */

export const VERTEX_SHADER = /* glsl */ `#version 300 es
const vec2 POSITIONS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
out vec2 vUv;
void main() {
	vec2 p = POSITIONS[gl_VertexID];
	vUv = p * 0.5 + 0.5;
	gl_Position = vec4(p, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec3 uFromL;
uniform vec3 uFromR;
uniform vec3 uToL;
uniform vec3 uToR;
uniform vec3 uDstL;
uniform vec3 uDstR;
uniform float uMix;
uniform float uWarp;
uniform float uEdgeVMax;
uniform vec2 uView;
uniform float uTime;
uniform float uMotion;
uniform float uSlit;
uniform float uRocks;
uniform float uFog;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const vec3 FOG_TINT = vec3(0.86, 0.88, 0.92);
const float EMERGE_SOFTNESS = 0.18;
const float EMERGE_MAX_LOD = 2.5;
const float HALO_LOD = 5.0;
const float FOG_STRENGTH = 0.16;
const float FOG_SPEED = 0.008;
const float GRAIN_STRENGTH = 0.032;
const float GRAIN_FPS = 24.0;

float edgeAt(vec3 c, float v) {
	float vv = clamp(v, 0.0, uEdgeVMax);
	return c.x + c.y * vv + c.z * vv * vv;
}

float warpX(float x, float sl, float sr, float dl, float dr) {
	if (x < dl) return x * sl / dl;
	if (x > dr) return sr + (x - dr) * (1.0 - sr) / (1.0 - dr);
	return sl + (x - dl) * (sr - sl) / (dr - dl);
}

vec3 plate(sampler2D tex, vec3 l, vec3 r, vec2 uv, float lod) {
	float sx = warpX(uv.x, edgeAt(l, uv.y), edgeAt(r, uv.y), edgeAt(uDstL, uv.y), edgeAt(uDstR, uv.y));
	return textureLod(tex, vec2(mix(uv.x, sx, uWarp), uv.y), lod).rgb;
}

vec3 scene(vec2 uv, float lod) {
	return mix(plate(uFrom, uFromL, uFromR, uv, lod), plate(uTo, uToL, uToR, uv, lod), uMix);
}

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
	float sum = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 5; i++) {
		sum += amp * noise(p);
		p = p * 2.03 + 17.1;
		amp *= 0.5;
	}
	return sum;
}

// Rock surfaces surface near the light first, highlights before shadows.
float surfaced(vec2 uv) {
	float soft = dot(scene(uv, 3.0), LUMA);
	float dist = abs(uv.x - 0.5) * 2.0;
	float tau = 0.6 * dist + 0.4 * (1.0 - clamp(soft * 3.5, 0.0, 1.0));
	return smoothstep(tau - EMERGE_SOFTNESS, tau + EMERGE_SOFTNESS, uRocks * (1.0 + 2.0 * EMERGE_SOFTNESS) - EMERGE_SOFTNESS);
}

vec3 sliverOfLight(vec2 uv, vec3 col) {
	float central = 1.0 - smoothstep(0.05, 0.16, abs(uv.x - 0.5) * 2.0);
	vec3 halo = scene(uv, HALO_LOD);
	vec3 light = col * smoothstep(0.3, 0.7, dot(col, LUMA)) * central;
	return light + halo * smoothstep(0.15, 0.5, dot(halo, LUMA)) * central * 0.45 * (1.0 - uRocks);
}

vec3 groundFog(vec2 uv, vec3 col) {
	float drift = uTime * FOG_SPEED * uMotion;
	vec2 p = vec2(uv.x * 2.4, uv.y * 3.2);
	float f = fbm(p + vec2(drift, 0.0)) * 0.6 + fbm(p * 1.9 + vec2(-drift * 1.7, drift * 0.4) + 9.2) * 0.4;
	float band = smoothstep(0.5, 0.74, uv.y) * (1.0 - smoothstep(0.9, 1.05, uv.y));
	float fog = smoothstep(0.42, 0.82, f) * band * uFog * FOG_STRENGTH;
	return 1.0 - (1.0 - col) * (1.0 - FOG_TINT * fog);
}

vec3 filmGrain(vec3 col) {
	float frame = floor(uTime * GRAIN_FPS) * uMotion;
	float g = hash(gl_FragCoord.xy + frame * vec2(37.0, 17.0)) - 0.5;
	return col + g * GRAIN_STRENGTH * (0.35 + 0.65 * smoothstep(0.0, 0.12, dot(col, LUMA)));
}

void main() {
	vec2 img = (vUv - 0.5) * uView + 0.5;
	vec2 uv = vec2(img.x, 1.0 - img.y);
	float s = surfaced(uv);
	vec3 col = scene(uv, (1.0 - s) * EMERGE_MAX_LOD);
	col = mix(sliverOfLight(uv, col) * uSlit, col, s);
	col = groundFog(uv, col);
	outColor = vec4(clamp(filmGrain(col), 0.0, 1.0), 1.0);
}`;
