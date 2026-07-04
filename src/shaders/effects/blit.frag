// Raw blit of uPrev (used to present CPU-computed results). No grading.
uniform sampler2D uPrev;
void main() {
  outColor = texture(uPrev, vUv);
}
