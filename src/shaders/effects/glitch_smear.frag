// GLITCH pass 2 — directional max-decay smear toward +x.
// Running max over SMEAR_TAPS taps to the LEFT of each pixel, each weighted
// by uDecay^tap, so bright pixels streak rightward with an exponential tail
// while dark background stays dark (max keeps the base pixel — a continuous
// luma gate, no hard threshold). Reads uPrev ONLY, at TILE-LOCAL vUv: tap
// offsets are computed in OUTPUT px and converted to tile uv with the actual
// tile size (textureSize) — the def's apron guarantees the data is in-tile.
uniform sampler2D uPrev;
uniform float uSmearLen; // streak length, fraction of output width
uniform float uDecay;    // per-tap decay, 0.7..0.99

const int SMEAR_TAPS = 48;

void main() {
  vec3 acc = texture(uPrev, vUv).rgb;
  float lenPx = uSmearLen * uOutputSize.x;
  vec2 tilePx = vec2(textureSize(uPrev, 0));
  float w = 1.0;
  for (int i = 1; i <= SMEAR_TAPS; i++) {
    w *= uDecay;
    float offPx = lenPx * float(i) / float(SMEAR_TAPS);
    vec2 tuv = vUv - vec2(offPx / tilePx.x, 0.0);
    // taps march monotonically left; past the tile edge there is no data
    // (apron exhausted) — stop instead of smearing the clamped edge column
    if (tuv.x < 0.0) break;
    acc = max(acc, texture(uPrev, tuv).rgb * w);
  }
  outColor = vec4(acc, 1.0);
}
