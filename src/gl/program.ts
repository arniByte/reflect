import vertSrc from '../shaders/fullscreen.vert?raw'
import commonSrc from '../shaders/lib/common.glsl?raw'
import sdfSrc from '../shaders/lib/sdf.glsl?raw'

const HEADER = '#version 300 es\nprecision highp float;\nprecision highp int;\n'

/** Values assignable to uniforms via setUniforms. */
export type UniformValue =
  | number
  | boolean
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | { v3v: Float32Array } // array of vec3
  | { fv: Float32Array } // array of float
  | { i: number } // explicit int

export interface ProgramHandle {
  prog: WebGLProgram
  locs: Map<string, WebGLUniformLocation>
}

/** Assemble a full fragment source: header + common lib + sdf lib + body. */
export function assembleFrag(body: string): string {
  return HEADER + commonSrc + '\n' + sdfSrc + '\n' + body
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`shader compile failed:\n${log}\n--- source ---\n${withLineNumbers(src)}`)
  }
  return sh
}

function withLineNumbers(src: string): string {
  return src
    .split('\n')
    .map((l, i) => `${String(i + 1).padStart(3)}: ${l}`)
    .join('\n')
}

export class ProgramCache {
  private cache = new Map<string, ProgramHandle>()
  private vert: WebGLShader | null = null

  constructor(private gl: WebGL2RenderingContext) {}

  /** Get (or build) the program for a fragment body. Key: the body string. */
  get(fragBody: string): ProgramHandle {
    const hit = this.cache.get(fragBody)
    if (hit) return hit
    const gl = this.gl
    if (!this.vert) this.vert = compile(gl, gl.VERTEX_SHADER, vertSrc)
    const frag = compile(gl, gl.FRAGMENT_SHADER, assembleFrag(fragBody))
    const prog = gl.createProgram()!
    gl.attachShader(prog, this.vert)
    gl.attachShader(prog, frag)
    gl.linkProgram(prog)
    gl.deleteShader(frag)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog)
      gl.deleteProgram(prog)
      throw new Error(`program link failed: ${log}`)
    }
    const locs = new Map<string, WebGLUniformLocation>()
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i)
      if (!info) continue
      // strip array suffix "[0]"
      const name = info.name.replace(/\[0\]$/, '')
      const loc = gl.getUniformLocation(prog, info.name)
      if (loc) locs.set(name, loc)
    }
    const handle = { prog, locs }
    this.cache.set(fragBody, handle)
    return handle
  }

  setUniforms(handle: ProgramHandle, values: Record<string, UniformValue>) {
    const gl = this.gl
    for (const [name, v] of Object.entries(values)) {
      const loc = handle.locs.get(name)
      if (!loc) continue // uniform unused / optimized out
      if (typeof v === 'number') gl.uniform1f(loc, v)
      else if (typeof v === 'boolean') gl.uniform1f(loc, v ? 1 : 0)
      else if (Array.isArray(v)) {
        if (v.length === 2) gl.uniform2f(loc, v[0], v[1])
        else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2])
        else gl.uniform4f(loc, v[0], v[1], v[2], v[3])
      } else if ('v3v' in v) gl.uniform3fv(loc, v.v3v)
      else if ('fv' in v) gl.uniform1fv(loc, v.fv)
      else if ('i' in v) gl.uniform1i(loc, v.i)
    }
  }

  dispose() {
    for (const { prog } of this.cache.values()) this.gl.deleteProgram(prog)
    this.cache.clear()
    if (this.vert) this.gl.deleteShader(this.vert)
    this.vert = null
  }
}
