export interface Target {
  tex: WebGLTexture
  fb: WebGLFramebuffer
  w: number
  h: number
}

export function createTarget(gl: WebGL2RenderingContext, w: number, h: number): Target {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fb = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`framebuffer incomplete: 0x${status.toString(16)}`)
  }
  return { tex, fb, w, h }
}

export function deleteTarget(gl: WebGL2RenderingContext, t: Target) {
  gl.deleteTexture(t.tex)
  gl.deleteFramebuffer(t.fb)
}

/** Two targets for multi-pass chains. read → shader → write, then swap(). */
export class PingPong {
  a: Target | null = null
  b: Target | null = null

  constructor(private gl: WebGL2RenderingContext) {}

  ensure(w: number, h: number) {
    if (this.a && this.a.w === w && this.a.h === h) return
    this.dispose()
    this.a = createTarget(this.gl, w, h)
    this.b = createTarget(this.gl, w, h)
  }

  get read(): Target {
    if (!this.a) throw new Error('pingpong not sized')
    return this.a
  }
  get write(): Target {
    if (!this.b) throw new Error('pingpong not sized')
    return this.b
  }
  swap() {
    const t = this.a
    this.a = this.b
    this.b = t
  }

  dispose() {
    if (this.a) deleteTarget(this.gl, this.a)
    if (this.b) deleteTarget(this.gl, this.b)
    this.a = this.b = null
  }
}
