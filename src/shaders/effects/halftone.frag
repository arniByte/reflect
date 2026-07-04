// HALFTONE — rotated print-dot screen. Ink on paper.
uniform float uCells;   // dots across width
uniform float uAngle;   // radians
uniform float uShape;   // 0 dot, 1 line, 2 diamond
uniform vec3 uInk;
uniform vec3 uPaper;

void main() {
  vec2 gp = globalPx();
  float cellPx = uOutputSize.x / uCells;

  mat2 rot = mat2(cos(uAngle), -sin(uAngle), sin(uAngle), cos(uAngle));
  vec2 rp = rot * gp;

  vec2 cellIdx = floor(rp / cellPx);
  vec2 center = (cellIdx + 0.5) * cellPx;
  // sample at the rotated cell center mapped back to image space
  vec2 sampleGp = transpose(rot) * center;
  vec2 suv = clamp(sampleGp / uOutputSize, 0.0, 1.0);
  vec3 cc = srcAtLod(suv, lodForCell(cellPx));

  // darkness drives mark size (print logic)
  float dark = 1.0 - clamp(luma(cc), 0.0, 1.0);
  vec2 local = rp - center;

  float d;
  if (uShape < 0.5) {
    d = sdCircle(local, sqrt(dark) * 0.62 * cellPx);
  } else if (uShape < 1.5) {
    d = abs(local.y) - dark * 0.5 * cellPx;
  } else {
    d = (abs(local.x) + abs(local.y)) - dark * 0.75 * cellPx;
  }

  float a = fillAAw(d, 0.75);
  outColor = withBg(uInk, uPaper, a);
}
