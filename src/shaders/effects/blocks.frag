// BLOCKS — terminal-green sub-pixel blocks. Each coarse cell is subdivided
// into uSub × uSub mini-squares; a mini switches ON when its 4×4 Bayer
// threshold falls below the coarse cell's gamma-shaped luma. Scanline
// darkening + phosphor glow finish the CRT-terminal look.
uniform float uCells; // coarse cells across the output width
uniform float uSub;   // mini-squares per cell side (2..5, int-valued)
uniform float uGamma; // luma response
uniform float uScan;  // 0..1 scanline darkening
uniform float uGlow;  // 0..1 phosphor bleed
uniform vec3 uInk;
uniform vec3 uBg;

// 4×4 Bayer thresholds, (v + 0.5)/16
const float BAYER[16] = float[16](
  0.03125, 0.53125, 0.15625, 0.65625,
  0.78125, 0.28125, 0.90625, 0.40625,
  0.21875, 0.71875, 0.09375, 0.59375,
  0.96875, 0.46875, 0.84375, 0.34375
);

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;
  float subPx = cellPx / uSub;

  // coarse cell luma decides how many minis turn on inside the cell
  vec2 cell = floor(gp / cellPx);
  vec3 cc = cellColor(gp, cellPx);
  float l = clamp(luma(cc), 0.0, 1.0);
  float lg = pow(l, uGamma);

  // ordered threshold indexed by the GLOBAL sub-grid position, so the
  // dither pattern tiles seamlessly across cells (and export tiles)
  vec2 sg = floor(gp / subPx);
  int bi = int(mod(sg.x, 4.0)) + 4 * int(mod(sg.y, 4.0));
  float on = step(BAYER[bi], lg);

  // mini-square with an inset gap — tighter vertically for the dash-row
  // block look; gaps stay sane when subPx gets tiny on small previews
  vec2 sl = mod(gp, subPx) - 0.5 * subPx;
  vec2 gap = vec2(
    min(max(0.07 * subPx, 0.5), 0.25 * subPx),
    min(max(0.16 * subPx, 0.75), 0.30 * subPx)
  );
  float d = sdBox(sl, vec2(0.5 * subPx) - gap);
  float mark = fillAAw(d, 0.7) * on;

  // glow: bleed into the block gaps + a broad phosphor haze that leaks
  // outside the lit blocks (heavily averaged source luma)
  float nearGlow = uGlow * lg * exp(-max(d, 0.0) / (0.45 * subPx + 1e-3)) * on;
  float lsoft = clamp(luma(srcAtLod(globalUV(), lodForCell(cellPx) + 1.5)), 0.0, 1.0);
  float halo = uGlow * 0.30 * pow(lsoft, max(uGamma, 1.0));

  // scanline darkening — one dark band per mini row, dark at row seams
  float scan = 1.0 - uScan * (0.5 + 0.5 * cos(6.28318530718 * fract(gp.y / subPx)));

  // subtle deterministic per-cell brightness flicker (data-terminal feel)
  float flick = mix(0.88, 1.0, hash12(cell + uSeed));

  vec3 ink = uInk * mix(0.62, 1.0, lg) * flick * scan;
  float a = clamp(mark + nearGlow + halo, 0.0, 1.0);
  outColor = withBg(ink, uBg, a);
}
