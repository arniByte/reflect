// CRYSTAL — Voronoi mosaic. The image shatters into flat-colored cells, each
// painted from the source at its seed. Optional dark facet edges give a
// stained-glass / low-poly read. Full-frame (every pixel changes). Tile-safe:
// all cell math in global px, seeds hashed from integer cell coords.
uniform float uCells;   // cells across width
uniform float uJitter;  // 0..1 seed scatter within each cell
uniform float uEdge;    // 0..1 facet edge darkness
uniform float uFacet;   // 0..1 flat-shade vs keep gradient
uniform vec3 uEdgeCol;

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;
  vec2 cell = floor(gp / cellPx);

  // nearest + second-nearest seed over the 3×3 neighborhood (F1/F2 for edges)
  float f1 = 1e9, f2 = 1e9;
  vec2 bestSeed = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      vec2 jit = (vec2(hash12(c + 0.13), hash12(c + 7.31)) - 0.5) * uJitter;
      vec2 seed = (c + 0.5 + jit) * cellPx;
      float d = length(seed - gp);
      if (d < f1) {
        f2 = f1; f1 = d; bestSeed = seed;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }

  vec2 suv = clamp(bestSeed / uOutputSize, 0.0, 1.0);
  vec3 flatCol = srcAtLod(suv, lodForCell(cellPx));
  vec3 grad = srcAt(gp / uOutputSize);
  vec3 col = mix(grad, flatCol, uFacet);

  // facet edge where F2-F1 is small (equidistant → cell boundary)
  float edge = smoothstep(0.0, 0.06 * cellPx + 1.0, f2 - f1);
  col = mix(uEdgeCol, col, mix(1.0, edge, uEdge));

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
