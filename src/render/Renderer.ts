import { createGLContext, type GLCaps } from '../gl/context'
import { createQuad, type Quad } from '../gl/quad'
import { ProgramCache, type UniformValue } from '../gl/program'
import { PingPong, createTarget, deleteTarget, type Target } from '../gl/fbo'
import { createSourceTexture, createCanvasTexture, createDataTexture } from '../gl/texture'
import { AtlasCache, type AtlasSpec } from '../gl/atlas'
import { getEffect } from '../effects/registry'
import type { EffectCtx, EffectDef } from '../effects/types'
import type { RenderState } from '../state/renderState'
import { colorUniforms } from '../state/renderState'
import compositeFrag from '../shaders/composite.frag?raw'
import blitFrag from '../shaders/effects/blit.frag?raw'
import { CpuDitherEngine } from './cpuDither'

export interface LumaField {
  data: Float32Array
  w: number
  h: number
}

interface OverlayEntry {
  key: string
  tex: WebGLTexture
}

export class Renderer {
  readonly gl: WebGL2RenderingContext
  readonly caps: GLCaps
  private quad: Quad
  private programs: ProgramCache
  private atlases: AtlasCache
  private pp: PingPong
  private srcTex: WebGLTexture | null = null
  private srcW = 0
  private srcH = 0
  private lumaField: LumaField | null = null
  private state: RenderState | null = null
  private rafId = 0
  private overlays = new Map<string, OverlayEntry>()
  private cpu: CpuDitherEngine
  /** called after a frame renders (for HUD render-time readout) */
  onFrame: ((ms: number) => void) | null = null

  constructor(private canvas: HTMLCanvasElement) {
    const { gl, caps } = createGLContext(canvas)
    this.gl = gl
    this.caps = caps
    this.quad = createQuad(gl)
    this.programs = new ProgramCache(gl)
    this.atlases = new AtlasCache(gl)
    this.pp = new PingPong(gl)
    this.cpu = new CpuDitherEngine(() => this.requestFrame())
  }

  /* ── image ─────────────────────────────────────────────────────────── */

  setImage(bitmap: ImageBitmap) {
    const gl = this.gl
    if (this.srcTex) gl.deleteTexture(this.srcTex)

    // cap the stored texture to GPU-safe size; shapes are procedural so
    // exports stay crisp even when the sampled source is capped
    const cap = this.caps.maxSafeTex
    let source: TexImageSource & { width: number; height: number } = bitmap
    if (bitmap.width > cap || bitmap.height > cap) {
      const s = Math.min(cap / bitmap.width, cap / bitmap.height)
      const w = Math.round(bitmap.width * s)
      const h = Math.round(bitmap.height * s)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
      source = c
    }
    this.srcTex = createSourceTexture(gl, source)
    this.srcW = source.width
    this.srcH = source.height
    this.lumaField = computeLumaField(bitmap)
    this.clearOverlays()
    this.cpu.invalidate()
    this.requestFrame()
  }

  /* ── frame scheduling ──────────────────────────────────────────────── */

  invalidate(state: RenderState) {
    this.state = state
    this.requestFrame()
  }

  private requestFrame() {
    if (this.rafId) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0
      this.renderFrame()
    })
  }

  private renderFrame() {
    const { gl } = this
    const s = this.state
    if (!s || !this.srcTex) return
    const w = this.canvas.width
    const h = this.canvas.height
    if (w === 0 || h === 0) return

    const t0 = performance.now()
    const def = getEffect(s.effectId)
    this.pp.ensure(w, h)

    const styled = this.runEffect(def, s, [w, h], [0, 0], this.pp)

    // composite to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, w, h)
    const prog = this.programs.get(compositeFrag)
    gl.useProgram(prog.prog)
    this.bindCommon(prog, s, [w, h], [0, 0], 1)
    this.bindTexture(prog, 'uStyled', styled.tex, 1)
    this.programs.setUniforms(prog, {
      uWipe: s.wipe,
      uLeftGrade: 0,
    })
    this.quad.draw()

    this.onFrame?.(performance.now() - t0)
  }

  /* ── effect chain (shared by screen / thumbs / export) ─────────────── */

  /**
   * Run all passes of an effect. Renders into `pp`, returns the target
   * holding the final styled result. `outputSize` is the FULL output;
   * the viewport is pp's target size (tile or full).
   */
  runEffect(
    def: EffectDef,
    s: RenderState,
    outputSize: [number, number],
    tileOrigin: [number, number],
    pp: PingPong,
    bgAlpha = 1,
    cpuTexOverride?: WebGLTexture | null,
  ): Target {
    const gl = this.gl
    const colorU = colorUniforms(s.color)
    const ctx = this.effectCtx(outputSize, tileOrigin, pp.read.w, pp.read.h, s.imageId)

    // CPU path (error-diffusion): show worker result when ready, else fall
    // through to the GPU passes as a live approximation
    if (def.cpu?.active(s.params)) {
      const cpuTex =
        cpuTexOverride !== undefined
          ? cpuTexOverride
          : this.cpu.getPreviewTex(this, def, s, pp.read.w, pp.read.h)
      if (cpuTex) {
        const target = pp.write
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb)
        gl.viewport(0, 0, target.w, target.h)
        const prog = this.programs.get(blitFrag)
        gl.useProgram(prog.prog)
        this.bindCommon(prog, s, outputSize, tileOrigin, bgAlpha)
        this.bindTexture(prog, 'uPrev', cpuTex, 1)
        this.quad.draw()
        pp.swap()
        return pp.read
      }
    }

    let prevTex: WebGLTexture | null = null
    for (let i = 0; i < def.passes.length; i++) {
      const pass = def.passes[i]
      // evaluate uniforms/textures FIRST — these may lazily create GL
      // textures (atlases, overlays), which must not clobber bound units
      const uvals = pass.uniforms ? pass.uniforms(s.params, ctx) : null
      const tmap = pass.textures ? pass.textures(s.params, ctx) : null

      const target = pp.write
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb)
      gl.viewport(0, 0, target.w, target.h)
      const prog = this.programs.get(pass.frag)
      gl.useProgram(prog.prog)
      this.bindCommon(prog, s, outputSize, tileOrigin, bgAlpha)
      this.programs.setUniforms(prog, colorU as Record<string, UniformValue>)
      if (uvals) this.programs.setUniforms(prog, uvals)
      let unit = 1
      if (prevTex) {
        this.bindTexture(prog, 'uPrev', prevTex, unit)
        unit++
      }
      if (tmap) {
        for (const [name, tex] of Object.entries(tmap)) {
          this.bindTexture(prog, name, tex, unit)
          unit++
        }
      }
      this.quad.draw()
      pp.swap()
      prevTex = pp.read.tex
    }
    return pp.read
  }

  /** Render the graded source (none-pass) into a fresh target of w×h and read it back. */
  readGradedPixels(s: RenderState, w: number, h: number): Uint8Array {
    const gl = this.gl
    const target = createTarget(gl, w, h)
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb)
    gl.viewport(0, 0, w, h)
    const prog = this.programs.get(gradeFrag)
    gl.useProgram(prog.prog)
    this.bindCommon(prog, s, [w, h], [0, 0], 1)
    this.programs.setUniforms(prog, colorUniforms(s.color) as Record<string, UniformValue>)
    this.quad.draw()
    const px = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    deleteTarget(gl, target)
    return px
  }

  uploadCpuResult(data: Uint8Array, w: number, h: number): WebGLTexture {
    return createDataTexture(this.gl, data, w, h)
  }

  /* ── common uniform/texture binding ────────────────────────────────── */

  private bindCommon(
    prog: ReturnType<ProgramCache['get']>,
    s: RenderState,
    outputSize: [number, number],
    tileOrigin: [number, number],
    bgAlpha: number,
  ) {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex)
    const loc = prog.locs.get('uSrc')
    if (loc) gl.uniform1i(loc, 0)
    this.programs.setUniforms(prog, {
      uSrcSize: [this.srcW, this.srcH],
      uOutputSize: outputSize,
      uTileOrigin: tileOrigin,
      uBgAlpha: bgAlpha,
      uSeed: s.imageId % 997,
    })
  }

  private bindTexture(
    prog: ReturnType<ProgramCache['get']>,
    name: string,
    tex: WebGLTexture,
    unit: number,
  ) {
    const gl = this.gl
    const loc = prog.locs.get(name)
    if (!loc) return
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform1i(loc, unit)
  }

  /* ── effect ctx ────────────────────────────────────────────────────── */

  private effectCtx(
    outputSize: [number, number],
    tileOrigin: [number, number],
    tileW: number,
    tileH: number,
    imageId: number,
  ): EffectCtx {
    return {
      gl: this.gl,
      atlases: this.atlases,
      outputSize,
      srcSize: [this.srcW, this.srcH],
      lumaField: this.lumaField,
      tileOrigin,
      tileSize: [tileW, tileH],
      getAtlas: (spec: AtlasSpec) => this.atlases.get(spec),
      getOverlayTexture: (key, w, h, draw) => {
        const fullKey = `${imageId}|${w}x${h}|${tileOrigin[0]},${tileOrigin[1]}|${key}`
        const hit = this.overlays.get(fullKey)
        if (hit) return hit.tex
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const c2d = canvas.getContext('2d')!
        draw(c2d, w, h)
        const tex = createCanvasTexture(this.gl, canvas, { flipY: true })
        // keep the overlay cache small
        if (this.overlays.size > 8) {
          const first = this.overlays.entries().next().value
          if (first) {
            this.gl.deleteTexture(first[1].tex)
            this.overlays.delete(first[0])
          }
        }
        this.overlays.set(fullKey, { key: fullKey, tex })
        return tex
      },
    }
  }

  private clearOverlays() {
    for (const { tex } of this.overlays.values()) this.gl.deleteTexture(tex)
    this.overlays.clear()
  }

  /* ── thumbnails ────────────────────────────────────────────────────── */

  /** Render a preset thumbnail; returns pixels (bottom-up rows). */
  renderThumbPixels(s: RenderState, w: number, h: number): Uint8Array {
    const gl = this.gl
    const pp = new PingPong(gl)
    pp.ensure(w, h)
    const def = getEffect(s.effectId)
    // thumbnails never wait for the CPU path — GPU approximation only
    const styled = this.runEffect(def, s, [w, h], [0, 0], pp, 1, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, styled.fb)
    const px = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    pp.dispose()
    return px
  }

  get sourceSize(): [number, number] {
    return [this.srcW, this.srcH]
  }
  get cpuEngine(): CpuDitherEngine {
    return this.cpu
  }
  get hasImage(): boolean {
    return this.srcTex !== null
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.cpu.dispose()
    this.clearOverlays()
    this.pp.dispose()
    this.atlases.dispose()
    this.programs.dispose()
    this.quad.dispose()
  }
}

/* grade-only pass reused for CPU dither input */
const gradeFrag = `void main() { outColor = vec4(srcAt(globalUV()), 1.0); }\n`

function computeLumaField(bitmap: ImageBitmap): LumaField {
  const W = 128
  const H = Math.max(1, Math.round((W * bitmap.height) / bitmap.width))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, W, H)
  const img = ctx.getImageData(0, 0, W, H)
  const data = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = img.data[i * 4] / 255
    const g = img.data[i * 4 + 1] / 255
    const b = img.data[i * 4 + 2] / 255
    data[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  return { data, w: W, h: H }
}
