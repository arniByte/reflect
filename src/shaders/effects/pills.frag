// PILLS — rows of rounded candy-colored bars on black. Each row is split
// into segments with a hashed per-row phase offset so boundaries never
// align; bar presence/length follow segment luminance, hue is a hashed
// pick from a 3-color candy palette biased warmer where the image is
// brighter. All geometry in GLOBAL output pixels (tile-safe).
uniform float uRows;      // rows down the output height
uniform float uSegAspect; // segment length as a multiple of row height
uniform float uGap;       // vertical gap fraction of the row (0..0.6)
uniform float uRound;     // 0 square corners .. 1 full stadium ends
uniform vec3 uPalette[3]; // 0 cyan, 1 pink, 2 orange (cool -> warm)
uniform vec3 uBg;

void main() {
  vec2 gp = globalPx();
  float rowPx = uOutputSize.y / uRows;
  float segPx = rowPx * uSegAspect;

  float row = floor(gp.y / rowPx);

  // per-row phase so segment boundaries don't line up across rows
  float phase = hash12(vec2(row * 5.17 + 11.0, uSeed * 19.7 + 3.1)) * segPx;
  float seg = floor((gp.x + phase) / segPx);

  // segment center in global output px (undo the phase for sampling)
  vec2 segCenter = vec2((seg + 0.5) * segPx - phase, (row + 0.5) * rowPx);
  vec2 uv = clamp(segCenter / uOutputSize, vec2(0.0), vec2(1.0));
  vec3 cc = srcAtLod(uv, lodForCell(sqrt(segPx * rowPx)));
  float l = clamp(luma(cc), 0.0, 1.0);

  // near-black segments stay empty (soft gate; constant per segment)
  float presence = smoothstep(0.045, 0.10, l);

  // bar fills the luma fraction of its segment, never less than 1/4
  float wFrac = max(smoothstep(0.04, 0.72, l), 0.25);

  // geometry, centered in the segment; small fixed side inset keeps
  // adjacent full bars in a row from fusing
  float inset = max(0.045 * segPx, 1.25);
  float halfW = max(0.5 * wFrac * segPx - inset, 1.0);
  float halfH = 0.5 * rowPx * (1.0 - clamp(uGap, 0.0, 0.9));
  float r = min(halfH * uRound, halfW);
  vec2 p = vec2(gp.x + phase - (seg + 0.5) * segPx, gp.y - (row + 0.5) * rowPx);
  float d = sdRoundedBox(p, vec2(halfW, halfH), r);
  float bar = fillAAw(d, 0.75);

  // candy palette: hashed per (row, segment), biased warm when bright.
  // dark ~ 41% cyan / 41% pink / 18% orange; bright ~ 4% / 41% / 55%.
  float h = hash12(vec2(seg * 7.31 + 2.7, row * 3.79 + 1.3) + uSeed * 31.0);
  float t = clamp(h * 0.82 + 0.30 * smoothstep(0.18, 0.85, l), 0.0, 0.999);
  int idx = int(t * 3.0);
  vec3 ink = uPalette[idx];

  // subtle candy gloss: a touch brighter toward the top edge of the pill
  ink = clamp(ink * (0.90 + 0.18 * smoothstep(-halfH, halfH, p.y)), 0.0, 1.0);

  outColor = withBg(ink, uBg, bar * presence);
}
