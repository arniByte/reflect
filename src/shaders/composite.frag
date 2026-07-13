// Screen composite: original (left of wipe) vs styled (right of wipe).
// The styled texture is tile-local; the source is sampled globally.
uniform sampler2D uStyled;
uniform float uWipe;      // 0..1 split position in global uv space
uniform float uLeftGrade; // 0 = raw original on the left, 1 = graded

void main() {
  vec2 guv = globalUV();
  vec4 styled = texture(uStyled, vUv);
  vec3 orig = mix(texture(uSrc, srcUV(guv)).rgb, srcAt(guv), uLeftGrade);
  // over black stage; styled alpha only matters for transparent export
  vec3 right = styled.rgb * styled.a;
  vec3 c = guv.x < uWipe ? orig : right;
  outColor = vec4(c, 1.0);
}
