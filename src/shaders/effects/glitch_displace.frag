// GLITCH pass 1 — band displacement + RGB split.
// Horizontal bands of random height: nominal lattice of uBands rows whose
// boundaries are jittered by a hash on the boundary index + uSeed, so band
// heights vary ~0.1..1.9 of the nominal. A band participates when its hash
// clears uDensity; participating bands shift horizontally by a hashed
// sign/magnitude up to uShift of the output width. Chromatic split samples
// R/G/B at uv +/- uRGBSplit horizontally. Reads ONLY uSrc via srcAt with
// global uvs -> tile-safe. Full-coverage output.
uniform float uBands;    // nominal band count across output height
uniform float uShift;    // max band shift, fraction of output width
uniform float uDensity;  // 0..1 fraction of bands that participate
uniform float uRGBSplit; // chromatic split, fraction of output width

// jitter of boundary k in units of one nominal band, in (-0.45, 0.45)
float edgeJitter(float k) {
  return (hash11(k * 13.73 + uSeed * 101.0) - 0.5) * 0.9;
}

void main() {
  vec2 uv = globalUV();

  // band index on a boundary-jittered lattice -> random band heights
  float bandF = uv.y * uBands;
  float k = floor(bandF);
  float band = k;
  if (bandF < k + edgeJitter(k)) {
    band = k - 1.0;
  } else if (bandF >= k + 1.0 + edgeJitter(k + 1.0)) {
    band = k + 1.0;
  }

  // participation gate + hashed shift (sign and magnitude per band)
  float on = step(hash11(band * 3.71 + uSeed + 17.0), uDensity);
  float sgn = hash11(band * 5.13 + uSeed + 31.0) < 0.5 ? -1.0 : 1.0;
  float mag = 0.35 + 0.65 * hash11(band * 9.77 + uSeed + 57.0);
  float shift = on * sgn * mag * uShift;

  vec2 suv = vec2(uv.x - shift, uv.y);
  vec2 split = vec2(uRGBSplit, 0.0);
  vec3 rgb = vec3(srcAt(suv + split).r, srcAt(suv).g, srcAt(suv - split).b);
  outColor = vec4(rgb, 1.0);
}
