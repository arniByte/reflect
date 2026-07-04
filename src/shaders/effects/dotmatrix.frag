// DOT MATRIX — grid of glowing dots sized by cell luminance (LED wall).
uniform float uCells;     // cells across the image width
uniform float uDotMin;    // 0..1 of half-cell
uniform float uDotMax;    // 0..1 of half-cell
uniform float uGamma;     // luma response
uniform float uGlow;      // 0..1
uniform float uColorMode; // 0 mono, 1 source color
uniform vec3 uMonoColor;
uniform vec3 uBg;

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;
  vec3 cc = cellColor(gp, cellPx);
  float l = pow(clamp(luma(cc), 0.0, 1.0), uGamma);

  vec2 local = mod(gp, cellPx) - 0.5 * cellPx;
  float r = mix(uDotMin, uDotMax, l) * 0.5 * cellPx;
  float d = sdCircle(local, r);

  float dot_ = fillAAw(d, 0.75);
  // soft glow ring outside the dot, scaled with brightness
  float glow = uGlow * l * exp(-max(d, 0.0) / (0.35 * cellPx + 1e-3));

  vec3 ink = uColorMode > 0.5 ? cc : uMonoColor * l;
  float a = clamp(dot_ + glow, 0.0, 1.0);
  outColor = withBg(ink, uBg, a);
}
