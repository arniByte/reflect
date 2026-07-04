export interface GLCaps {
  maxTex: number
  maxRb: number
  /** largest texture we will actually allocate for the source image */
  maxSafeTex: number
}

export interface GLHandle {
  gl: WebGL2RenderingContext
  caps: GLCaps
}

export function createGLContext(canvas: HTMLCanvasElement): GLHandle {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  })
  if (!gl) throw new Error('WEBGL2 UNAVAILABLE')

  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
  const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory
  const memCap = deviceMemory !== undefined && deviceMemory < 8 ? 4096 : 8192
  const caps: GLCaps = {
    maxTex,
    maxRb,
    maxSafeTex: Math.min(maxTex, memCap),
  }
  return { gl, caps }
}
