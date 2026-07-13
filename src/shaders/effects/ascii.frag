// ASCII — the image rebuilt from monospace glyphs (terminal aesthetic).
// Cell luma indexes a dark→bright charset ramp; per-cell jitter scrambles
// neighbouring indices for the mixed-character data look.
uniform sampler2D uAtlas; // horizontal strip of glyph cells, dark→bright
uniform float uGlyphCount; // glyphs in the atlas strip
uniform float uCells;      // cells across the output width
uniform float uJitter;     // 0..1 per-cell glyph-index scatter
uniform float uColorMode;  // 0 mono, 1 source color
uniform vec3 uMonoColor;
uniform vec3 uBg;

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;
  vec2 cell = floor(gp / cellPx);

  vec3 cc = cellColor(gp, cellPx);
  float l = clamp(luma(cc), 0.0, 1.0);

  // luma ramp into the charset, plus a deterministic per-cell index shift
  float fi = l * (uGlyphCount - 1.0);
  float jit = (hash12(cell + uSeed) - 0.5) * uJitter * uGlyphCount;
  float gi = clamp(floor(fi + jit + 0.5), 0.0, uGlyphCount - 1.0);

  // sample the atlas strip (v = 0 is the TOP of the drawn glyph)
  vec2 local = mod(gp, cellPx) / cellPx; // 0..1 inside cell, y up
  vec2 auv = vec2((gi + local.x) / uGlyphCount, 1.0 - local.y);
  float mask = texture(uAtlas, auv).a;
  mask = smoothstep(0.35, 0.65, mask); // sharpen + embolden strokes

  // near-black cells render NO glyph so the background stays clean
  float on = step(0.04, l);
  float a = mask * on;

  // ink: source color lifted toward full brightness (hue kept, reads like
  // vivid terminal text), or constant mono with a gentle luma falloff
  float mx = max(cc.r, max(cc.g, cc.b));
  vec3 vivid = cc / max(mx, 1e-4);
  vec3 srcInk = mix(cc, vivid, 0.55);
  vec3 monoInk = uMonoColor * mix(0.5, 1.0, smoothstep(0.0, 1.0, l));
  vec3 ink = uColorMode > 0.5 ? srcInk : monoInk;

  outColor = withBg(ink, uBg, a);
}
