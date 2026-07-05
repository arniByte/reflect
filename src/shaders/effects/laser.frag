// LASER — a fan of glowing scan lines from a vanishing point above the top
// edge, over the image reduced to a dot field. All geometry in global
// output px / uv (tile-safe), single pass.
uniform float uCount;   // number of lines in the fan
uniform float uSpread;  // total fan angle, radians
uniform float uWidth;   // beam core width, ~px at 1080p scale
uniform float uBaseMix; // base dot-field brightness
uniform vec3 uColor;
uniform vec3 uBg;

void main() {
  vec2 guv = globalUV();
  vec2 gp = globalPx();

  // vanishing point above the top edge (uv y=1 is the top)
  vec2 origin = vec2(0.5, 1.18);
  vec2 rel = guv - origin;
  float dist = length(rel * uOutputSize); // px distance to origin

  // angle from the straight-down axis
  float ang = atan(rel.x, -rel.y);
  float halfFan = 0.5 * uSpread;
  float stepA = uSpread / max(uCount - 1.0, 1.0);
  float n = clamp(floor(ang / stepA + 0.5), -floor((uCount - 1.0) / 2.0), floor(uCount * 0.5));
  float da = ang - n * stepA;
  // arc-length distance to the nearest beam, in output px
  float dpx = abs(da) * max(dist, 1.0);

  // luma under this fragment brightens the beam (laser "hits" the subject)
  float l = clamp(luma(srcAtLod(guv, 1.5)), 0.0, 1.0);

  float w = uWidth * (uOutputSize.x / 1400.0 + 0.35);
  float inFan = step(abs(ang), halfFan + 0.5 * stepA);
  float beam = exp(-dpx * dpx / (w * w)) * inFan;
  float haze = 0.22 * exp(-dpx / (7.0 * w)) * inFan;
  float beamI = (beam + haze) * (0.25 + 0.75 * l);

  // base layer: the image as a coarse dot grid in the laser color
  float cellPx = max(uOutputSize.x / 150.0, 2.0);
  vec3 cc = cellColor(gp, cellPx);
  float cl = pow(clamp(luma(cc), 0.0, 1.0), 1.2);
  vec2 local = mod(gp, cellPx) - 0.5 * cellPx;
  float dd = sdBox(local, vec2(0.5 * cellPx * clamp(cl * 1.4, 0.0, 0.86)) - 0.75);
  float baseDot = fillAAw(dd, 0.7) * step(0.05, cl);
  float baseA = baseDot * uBaseMix * 2.0;

  float a = clamp(baseA + beamI, 0.0, 1.0);
  vec3 ink = uColor * clamp(baseA * mix(0.6, 1.0, cl) + beamI * 1.15, 0.0, 1.35);
  outColor = withBg(min(ink, 1.0), uBg, a);
}
