// STITCH — cross-stitch / symbol mosaic. White X's carry luminance; strongly
// red cells become red squares (outline mid / filled bright), like a stitch
// chart. Near-black cells stay empty.
uniform sampler2D uAtlas;  // symbol strip: 0=x, 1=square, 2=square-fill
uniform float uGlyphCount; // symbols in the atlas strip
uniform float uCells;      // cells across the image width
uniform float uChromaT;    // red-dominance threshold (r - max(g,b))
uniform vec3 uColorA;      // X ink (white-ish)
uniform vec3 uColorB;      // symbol ink (red)
uniform vec3 uBg;

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;

  vec3 cc = cellColor(gp, cellPx);
  float l = clamp(luma(cc), 0.0, 1.0);
  float chroma = cc.r - max(cc.g, cc.b); // red dominance

  // near-black cells are left empty (soft gate so edges don't sizzle)
  float presence = smoothstep(0.035, 0.08, max(l, chroma));

  // symbol choice: red-dominant cells → square (outline mid / fill bright),
  // otherwise the luminance X. Constant per cell, so no seams inside a cell.
  float isRed = step(uChromaT, chroma);
  float gi = isRed > 0.5 ? (l > 0.55 ? 2.0 : 1.0) : 0.0;

  // sample the atlas strip (cells anchored at output origin)
  vec2 local = mod(gp, cellPx) / cellPx; // 0..1, y up
  vec2 auv = vec2((gi + local.x) / uGlyphCount, 1.0 - local.y);
  float mask = texture(uAtlas, auv).a;

  // ink: X brightness follows cell luma; red symbols stay near full ink
  vec3 inkX = uColorA * pow(l, 0.85);
  vec3 inkR = uColorB * mix(0.78, 1.0, smoothstep(0.12, 0.6, l));
  vec3 ink = mix(inkX, inkR, isRed);

  float a = mask * presence;
  outColor = withBg(ink, uBg, a);
}
