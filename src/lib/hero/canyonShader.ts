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
uniform float uPush;
uniform vec2 uParallax;
// Section 3 (Growth System)
uniform sampler2D uEmergeSrc;
uniform sampler2D uMask9;
uniform sampler2D uMask10;
uniform float uS3;
uniform float uMaskMix;
uniform float uMaskOn;
uniform float uEmergeOn;
uniform vec4 uRise[7];
uniform float uHoverId;
uniform float uHoverAmt;
uniform float uCoreGlow;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const vec3 FOG_TINT = vec3(0.86, 0.88, 0.92);
const float EMERGE_SOFTNESS = 0.18;
const float EMERGE_MAX_LOD = 2.5;
const float HALO_LOD = 5.0;
const float FOG_STRENGTH = 0.16;
const float FOG_SPEED = 0.008;
const float GRAIN_STRENGTH = 0.032;
const float GRAIN_FPS = 24.0;
const vec3 WARM = vec3(1.0, 0.78, 0.48);
const float MASK_ID_STEP = 16.0;
const float RISE_FOG_EDGE = 0.016;
const float HALO_TAP = 0.0055;

float edgeAt(vec3 c, float v) {
	float vv = clamp(v, 0.0, uEdgeVMax);
	return c.x + c.y * vv + c.z * vv * vv;
}

float warpX(float x, float sl, float sr, float dl, float dr) {
	if (x < dl) return x * sl / dl;
	if (x > dr) return sr + (x - dr) * (1.0 - sr) / (1.0 - dr);
	return sl + (x - dl) * (sr - sl) / (dr - dl);
}

vec3 plate(sampler2D tex, vec3 l, vec3 r, vec2 uv, float lod, float zoom) {
	float sx = warpX(uv.x, edgeAt(l, uv.y), edgeAt(r, uv.y), edgeAt(uDstL, uv.y), edgeAt(uDstR, uv.y));
	vec2 p = (vec2(mix(uv.x, sx, uWarp), uv.y) - 0.5) / zoom + 0.5;
	return textureLod(tex, p, lod).rgb;
}

// The outgoing plate pushes toward the camera while it dissolves (uPush = 1 at keyframes).
vec3 scene(vec2 uv, float lod) {
	return mix(plate(uFrom, uFromL, uFromR, uv, lod, uPush), plate(uTo, uToL, uToR, uv, lod, 1.0), uMix);
}

// Depth proxy for the mouse parallax: floor rocks and the outer walls are nearest.
float nearness(vec2 uv) {
	float ground = smoothstep(0.62, 1.0, uv.y);
	float walls = 1.0 - smoothstep(0.1, 0.32, min(uv.x, 1.0 - uv.x));
	return max(ground, walls * 0.7);
}

float rockId(vec4 m) {
	return floor(m.r * 255.0 / MASK_ID_STEP + 0.5);
}

// The seven specialists rise out of the landscape: each rock is sampled lower by its
// remaining travel and clipped at its base row, so it emerges from the fog line.
vec3 emergingRocks(vec2 uv, vec3 col) {
	for (int i = 0; i < 7; i++) {
		vec4 r = uRise[i];
		if (r.x <= 0.0) continue;
		vec2 src = vec2(uv.x, uv.y - r.y * (1.0 - r.x));
		vec4 m = texture(uMask9, src);
		if (abs(rockId(m) - r.w) > 0.5) continue;
		float a = m.g * smoothstep(r.z, r.z - RISE_FOG_EDGE, uv.y) * smoothstep(0.0, 0.3, r.x);
		vec3 rc = mix(texture(uEmergeSrc, src).rgb, FOG_TINT, (1.0 - r.x) * 0.35);
		col = mix(col, rc, a * uMix);
	}
	return col;
}

// Coverage of one rock here and its inner rim (inside pixels near the silhouette edge).
vec2 rockGlow(sampler2D mask, vec2 uv, float id) {
	vec4 m = texture(mask, uv);
	float inside = abs(rockId(m) - id) < 0.5 ? m.g : 0.0;
	if (inside <= 0.0) return vec2(0.0);
	float same = 0.0;
	for (int k = 0; k < 8; k++) {
		float a = float(k) * 0.785398;
		vec2 o = vec2(cos(a), sin(a) * 1.397) * HALO_TAP;
		same += abs(rockId(texture(mask, uv + o)) - id) < 0.5 ? 0.125 : 0.0;
	}
	return vec2(inside, inside * (1.0 - same));
}

// Warm rim light + gentle lift on one rock: hover highlight and the always-on strategy glow.
vec3 lightRock(vec2 uv, vec3 col, float id, float amount) {
	if (amount <= 0.001 || id < 0.5) return col;
	vec2 g = mix(rockGlow(uMask9, uv, id), rockGlow(uMask10, uv, id), uMaskMix);
	col *= 1.0 + 0.28 * g.x * amount;
	col += WARM * (0.04 * g.x + 0.42 * g.y) * amount;
	return col;
}

float maskDepth(vec2 uv) {
	return mix(texture(uMask9, uv).b, texture(uMask10, uv).b, uMaskMix);
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
	float near = mix(nearness(uv), maskDepth(uv), uS3 * uMaskOn);
	uv += uParallax * near;
	float s = surfaced(uv);
	// The light is crisp from its first moment; only the rock surfaces emerge from soft focus.
	vec3 sharp = scene(uv, 0.0);
	vec3 rock = s > 0.999 ? sharp : scene(uv, (1.0 - s) * EMERGE_MAX_LOD);
	vec3 col = mix(sliverOfLight(uv, sharp) * uSlit, rock, s);
	if (uEmergeOn > 0.5) col = emergingRocks(uv, col);
	if (uMaskOn > 0.5) {
		col = lightRock(uv, col, 1.0, uCoreGlow * uS3);
		col = lightRock(uv, col, uHoverId, uHoverAmt * uS3);
	}
	col = groundFog(uv, col);
	outColor = vec4(clamp(filmGrain(col), 0.0, 1.0), 1.0);
}`;
