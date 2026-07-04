/** Fullscreen triangle. Bind once per context; draw() per pass. */
export function createQuad(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray()!
  const buf = gl.createBuffer()!
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)

  return {
    draw() {
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    },
    dispose() {
      gl.deleteVertexArray(vao)
      gl.deleteBuffer(buf)
    },
  }
}
export type Quad = ReturnType<typeof createQuad>
