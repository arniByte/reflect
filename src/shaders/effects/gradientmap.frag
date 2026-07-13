// GRADIENT MAP — remap image luminance through a curated gradient. Full-frame
// regrade (every pixel changes), optional posterize banding. Very Ikeda in 2
// tones, lush in 3–4. Reads only the graded source → tile-safe.
uniform vec3 uStops[5];
uniform float uStopN;    // active stops (2..5)
uniform float uLevels;   // 0 = smooth, else posterize into N bands
uniform float uMix;      // blend back toward source color
uniform float uCurve;    // luminance curve steepness (uContrast is taken by grade)

vec3 sampleGradient(float t) {
  t = clamp(t, 0.0, 1.0);
  float seg = uStopN - 1.0;
  float f = t * seg;
  int i = int(floor(f));
  float k = fract(f);
  // guard the top edge
  if (float(i) >= seg) { i = int(seg) - 1; k = 1.0; }
  vec3 a = uStops[i];
  vec3 b = uStops[i + 1];
  return mix(a, b, smoothstep(0.0, 1.0, k));
}

void main() {
  vec2 guv = globalUV();
  vec3 src = srcAt(guv);
  float l = luma(src);

  // luminance curve: push toward the ends for punch
  l = pow(l, uCurve);
  if (uLevels > 1.5) {
    float n = uLevels;
    l = floor(l * n + 0.5) / n;
  }

  vec3 g = sampleGradient(l);
  vec3 outc = mix(g, src, uMix);
  outColor = vec4(clamp(outc, 0.0, 1.0), 1.0);
}
