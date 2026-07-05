// DOT MATRIX — grid of glowing dots sized by cell luminance (LED wall).
// Optional animated wave sweeps a brightness pulse across the panel.
uniform float uCells;     // cells across the image width
uniform float uDotMin;    // 0..1 of half-cell
uniform float uDotMax;    // 0..1 of half-cell
uniform float uGamma;     // luma response
uniform float uGlow;      // 0..1
uniform float uColorMode; // 0 mono, 1 source color
uniform float uWave;      // 0..1 animated pulse depth
uniform vec3 uMonoColor;
uniform vec3 uBg;

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;
  vec3 cc = cellColor(gp, cellPx);
  float l = pow(clamp(luma(cc), 0.0, 1.0), uGamma);

  // diagonal brightness wave across the panel, per-cell phase
  if (uWave > 0.001) {
    vec2 cell = floor(gp / cellPx);
    float phase = (cell.x + cell.y) * 0.18 - uTime * 3.0;
    float pulse = 0.5 + 0.5 * sin(phase);
    l *= mix(1.0, 0.35 + 1.15 * pulse, uWave);
  }
  l = clamp(l, 0.0, 1.0);

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
