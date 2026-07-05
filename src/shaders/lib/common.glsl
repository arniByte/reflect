// ── common.glsl ─────────────────────────────────────────────────────────
// Prepended to every fragment shader (after the version/precision header).
// Provides: tile-safe global UVs, color grading, graded source sampling,
// luma, hashes. All cell math must be done in GLOBAL output pixels so that
// tiled export is seam-free.

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSrc;      // full source image, mipmapped
uniform vec2 uSrcSize;       // source size in px
uniform vec2 uOutputSize;    // FULL output size in px (not the tile)
uniform vec2 uTileOrigin;    // px offset of the current tile inside the output
uniform float uBgAlpha;      // 1 on screen, 0 for transparent export
uniform float uSeed;

// color grade
uniform float uExposure;     // stops
uniform float uContrast;     // -1..1
uniform float uSaturation;   // -1..1
uniform float uHue;          // radians
uniform float uTemperature;  // -1..1
uniform float uTint;         // -1..1
uniform float uInvert;       // 0|1
uniform float uDuoMix;       // 0..1
uniform vec3 uDuoShadow;
uniform vec3 uDuoHighlight;

// tile-safe uv of this fragment inside the full output, 0..1
vec2 globalUV() {
  return (uTileOrigin + gl_FragCoord.xy) / uOutputSize;
}
// global position of this fragment in output pixels
vec2 globalPx() {
  return uTileOrigin + gl_FragCoord.xy;
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  return fract(p * (p + p));
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// hue rotation via Rodrigues rotation around the grey axis
vec3 hueRotate(vec3 c, float a) {
  const vec3 k = vec3(0.57735026919);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

// full color grade, fixed order
vec3 grade(vec3 c) {
  c *= exp2(uExposure);
  c.r *= 1.0 + 0.25 * uTemperature;
  c.b *= 1.0 - 0.25 * uTemperature;
  c.g *= 1.0 + 0.20 * uTint;
  c = (c - 0.5) * (1.0 + uContrast) + 0.5;
  float l = luma(clamp(c, 0.0, 1.0));
  c = mix(vec3(l), c, 1.0 + uSaturation);
  if (abs(uHue) > 0.0001) c = hueRotate(c, uHue);
  c = clamp(c, 0.0, 1.0);
  c = mix(c, 1.0 - c, uInvert);
  float dl = luma(c);
  c = mix(c, mix(uDuoShadow, uDuoHighlight, smoothstep(0.0, 1.0, dl)), uDuoMix);
  return clamp(c, 0.0, 1.0);
}

// The source texture stores row 0 = image TOP at v=0 (ImageBitmap uploads
// ignore UNPACK_FLIP_Y), while our uv space has v=0 at the bottom — flip at
// sample time. ALL source access must go through srcUV/srcAt*/cellColor.
vec2 srcUV(vec2 uv) {
  return vec2(uv.x, 1.0 - uv.y);
}

// graded source at uv (global 0..1), explicit mip lod
vec3 srcAtLod(vec2 uv, float lod) {
  return grade(textureLod(uSrc, srcUV(uv), lod).rgb);
}
vec3 srcAt(vec2 uv) {
  return grade(texture(uSrc, srcUV(uv)).rgb);
}

// mip level that averages a cell of `cellPx` output pixels
float lodForCell(float cellPx) {
  float srcPx = cellPx * (uSrcSize.x / uOutputSize.x);
  return max(0.0, log2(max(srcPx, 1.0)));
}

// average graded color of the cell containing global-px position `gp`,
// for a grid of `cellPx`-sized cells anchored at output origin
vec3 cellColor(vec2 gp, float cellPx) {
  vec2 cellCenter = (floor(gp / cellPx) + 0.5) * cellPx;
  return srcAtLod(cellCenter / uOutputSize, lodForCell(cellPx));
}

// GROUND: an image-derived layer that sits BEHIND the marks, so the effect
// reads as "the picture became this" instead of marks floating in a void.
// uGround 0 = solid bg color; 1 = the graded source, dimmed and pulled toward
// the ink hue for cohesion. Set globally (default 0); mark effects that want
// it expose a control.
uniform float uGround;      // 0..1 image-ground amount
uniform float uGroundDark;  // brightness of the image ground (0..1)
uniform float uGroundDesat; // 0 keep source color .. 1 monochrome toward ink

vec3 groundColor(vec3 bg, vec3 ink) {
  if (uGround < 0.001) return bg;
  vec3 g = srcAtLod(globalUV(), 1.0);
  float gl = luma(g);
  // desaturate toward an ink-tinted greyscale for a cohesive treatment
  vec3 mono = mix(bg, ink, gl);
  g = mix(g, mono, uGroundDesat) * uGroundDark;
  return mix(bg, g, uGround);
}

// Standard output composition for mark-on-background effects.
// On screen (uBgAlpha=1): marks over the (optional image) ground.
// Transparent export (uBgAlpha=0): straight-alpha ink with coverage `a`.
vec4 withBg(vec3 ink, vec3 bg, float a) {
  vec3 ground = groundColor(bg, ink);
  vec3 solid = mix(ground, ink, a);
  return vec4(mix(ink, solid, uBgAlpha), mix(a, 1.0, uBgAlpha));
}
