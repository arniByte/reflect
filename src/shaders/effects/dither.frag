// DITHER — ordered-Bayer quantization to a retro palette (1-bit pixel art).
// fs/atkinson run on the CPU worker; this pass doubles as the live preview
// fallback for those methods (approximated with Bayer 4×4).
uniform float uMethod;    // 0 bayer2, 1 bayer4, 2 bayer8, 3 fs, 4 atkinson
uniform float uPixel;     // pixelation factor in source pixels (1..8)
uniform float uStrength;  // 0..1 threshold spread
uniform vec3 uPalette[4]; // padded to 4 entries
uniform float uPaletteN;  // active palette entries (2..4)

const float B2[4] = float[4](0.0, 2.0, 3.0, 1.0);

const float B4[16] = float[16](
   0.0,  8.0,  2.0, 10.0,
  12.0,  4.0, 14.0,  6.0,
   3.0, 11.0,  1.0,  9.0,
  15.0,  7.0, 13.0,  5.0
);

const float B8[64] = float[64](
   0.0, 32.0,  8.0, 40.0,  2.0, 34.0, 10.0, 42.0,
  48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
  12.0, 44.0,  4.0, 36.0, 14.0, 46.0,  6.0, 38.0,
  60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
   3.0, 35.0, 11.0, 43.0,  1.0, 33.0,  9.0, 41.0,
  51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
  15.0, 47.0,  7.0, 39.0, 13.0, 45.0,  5.0, 37.0,
  63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
);

// normalized threshold 0..1 for the dither cell at integer grid coord `cell`
float bayerAt(vec2 cell) {
  // fs/atkinson (3/4) preview with bayer4 while the worker computes
  float m = uMethod > 2.5 ? 1.0 : uMethod;
  if (m < 0.5) {
    ivec2 p = ivec2(mod(cell, 2.0));
    return (B2[p.y * 2 + p.x] + 0.5) / 4.0;
  } else if (m < 1.5) {
    ivec2 p = ivec2(mod(cell, 4.0));
    return (B4[p.y * 4 + p.x] + 0.5) / 16.0;
  }
  ivec2 p = ivec2(mod(cell, 8.0));
  return (B8[p.y * 8 + p.x] + 0.5) / 64.0;
}

void main() {
  vec2 gp = globalPx();
  // one dither pixel = uPixel SOURCE pixels, expressed in output px so the
  // grid stays locked to the image at any export resolution
  float pixelPx = max(uPixel * (uOutputSize.x / uSrcSize.x), 1.0);
  vec3 c = cellColor(gp, pixelPx);

  vec2 cell = floor(gp / pixelPx);
  c += (bayerAt(cell) - 0.5) * uStrength;

  // nearest palette color, luma-weighted like the CPU worker
  vec3 best = uPalette[0];
  float bd = 1e9;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uPaletteN) break;
    vec3 d = c - uPalette[i];
    float dist = dot(d * d, vec3(0.299, 0.587, 0.114));
    if (dist < bd) {
      bd = dist;
      best = uPalette[i];
    }
  }

  outColor = vec4(best, 1.0);
}
