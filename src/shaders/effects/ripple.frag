// RIPPLE — animated waves refract the actual image, like light through water.
// Concentric waves from a moving centre displace the sampled pixels; a subtle
// specular highlight rides the wavefronts. Full-frame, opaque, displacement-
// based (transforms the picture, not an overlay).
uniform float uFreq;    // wave frequency
uniform float uAmp;     // displacement strength
uniform float uSpeed;   // wave speed
uniform float uSpec;    // specular highlight strength
uniform float uDrift;   // how much the centre wanders

void main() {
  vec2 guv = globalUV();
  float t = uTime * uSpeed;

  // aspect-correct radial coordinate around a slowly drifting centre
  float aspect = uOutputSize.x / uOutputSize.y;
  vec2 centre = vec2(0.5) + uDrift * vec2(sin(t * 0.31), cos(t * 0.27)) * 0.3;
  vec2 d = (guv - centre) * vec2(aspect, 1.0);
  float r = length(d);

  // two interfering wave trains for organic water
  float w = sin(r * uFreq - t * 3.0) + 0.5 * sin(r * uFreq * 1.7 - t * 4.3);
  float slope = cos(r * uFreq - t * 3.0); // derivative → surface normal
  vec2 nrm = r > 1e-4 ? d / r : vec2(0.0);

  vec2 disp = nrm * slope * uAmp;
  vec3 col = srcAt(guv + disp);

  // specular glints on the wavefronts
  float spec = uSpec * pow(max(w * 0.5 + 0.5, 0.0), 6.0);
  col += spec;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
