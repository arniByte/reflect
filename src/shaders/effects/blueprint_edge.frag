// BLUEPRINT pass 1 — Sobel edge magnitude + luma, packed for pass 2.
// Samples only uSrc at global uvs → tile-safe.
void main() {
  vec2 guv = globalUV();
  vec2 px = 1.5 / uOutputSize;

  float tl = luma(srcAt(guv + vec2(-px.x, px.y)));
  float t  = luma(srcAt(guv + vec2(0.0, px.y)));
  float tr = luma(srcAt(guv + vec2(px.x, px.y)));
  float l  = luma(srcAt(guv + vec2(-px.x, 0.0)));
  float c  = luma(srcAt(guv));
  float r  = luma(srcAt(guv + vec2(px.x, 0.0)));
  float bl = luma(srcAt(guv + vec2(-px.x, -px.y)));
  float b  = luma(srcAt(guv + vec2(0.0, -px.y)));
  float br = luma(srcAt(guv + vec2(px.x, -px.y)));

  float gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
  float gy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
  float edge = clamp(length(vec2(gx, gy)), 0.0, 1.0);

  outColor = vec4(edge, c, 0.0, 1.0);
}
