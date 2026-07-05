// Motion-trails accumulation: keep the brighter of the current frame and the
// decayed history, so moving bright detail smears into luminous trails while
// still tracks fade out. Runs only when an animated effect has trails > 0.
uniform sampler2D uCur;   // current styled frame
uniform sampler2D uHist;  // previous accumulation
uniform float uDecay;     // history persistence 0..1 (higher = longer trails)
uniform float uMix;       // 0 = show current only, 1 = full trails

void main() {
  vec3 cur = texture(uCur, vUv).rgb;
  vec3 hist = texture(uHist, vUv).rgb;
  vec3 trail = max(cur, hist * uDecay);
  outColor = vec4(mix(cur, trail, uMix), 1.0);
}
