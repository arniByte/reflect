// FLOW — the image itself flows and melts along an animated noise field.
// This is pure displacement of the real pixels (no separate marks), so it
// reads as the photograph coming alive, not an overlay. Full-frame, opaque.
uniform float uScale;    // flow field frequency
uniform float uAmount;   // displacement strength (fraction of image)
uniform float uSpeed;    // animation speed
uniform float uSwirl;    // rotational vs directional flow
uniform float uChroma;   // chromatic separation along the flow

void main() {
  vec2 guv = globalUV();
  float t = uTime * uSpeed;

  // base flow direction from an animated fbm field
  vec2 p = guv * uScale;
  vec2 f = flowField(p, t * 0.35);
  // add a swirl by rotating the field 90°, mixed by uSwirl
  vec2 swirl = vec2(-f.y, f.x);
  vec2 dir = mix(f, swirl, uSwirl);

  vec2 disp = dir * uAmount;
  // chromatic separation: sample R/G/B at slightly different displacements
  float c = uChroma * uAmount;
  vec3 col;
  col.r = srcAt(guv + disp * (1.0 + c)).r;
  col.g = srcAt(guv + disp).g;
  col.b = srcAt(guv + disp * (1.0 - c)).b;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
