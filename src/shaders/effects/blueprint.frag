// BLUEPRINT pass 2 — technical-drawing composite: edges + iso-contours +
// the Canvas2D annotation overlay (crosshairs, coordinates, measurement arc).
uniform sampler2D uPrev;   // r = sobel edge, g = luma
uniform sampler2D uAnnot;  // white annotation drawing with alpha
uniform float uEdgeT;      // edge threshold
uniform float uContours;   // iso-contour count (0 = off)
uniform float uLabels;     // annotation overlay opacity
uniform vec3 uEdgeColor;
uniform vec3 uBg;

void main() {
  vec2 eg = texture(uPrev, vUv).rg;
  float edge = eg.r;
  float l = eg.g;

  // edges
  float edgeA = smoothstep(uEdgeT, uEdgeT * 2.2 + 0.02, edge);

  // posterized iso-contours on luminance — thin fwidth-based lines at
  // every level crossing (fract(v) == 0)
  float contourA = 0.0;
  if (uContours > 0.5) {
    float v = l * uContours;
    float fw = fwidth(v) + 1e-4;
    float df = min(fract(v), 1.0 - fract(v));
    contourA = (1.0 - smoothstep(0.0, fw * 1.6, df)) * 0.4;
    // suppress contour noise in near-black regions
    contourA *= smoothstep(0.03, 0.10, l);
  }

  // annotations (already white with alpha)
  float annotA = texture(uAnnot, vUv).a * uLabels;

  float a = max(max(edgeA, contourA), annotA);
  // ink: edges/contours in uEdgeColor, annotations pure white on top
  vec3 ink = uEdgeColor;
  ink = mix(ink, vec3(1.0), clamp(annotA - max(edgeA, contourA) * 0.5, 0.0, 1.0));

  outColor = withBg(ink, uBg, a);
}
