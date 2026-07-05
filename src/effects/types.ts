import type { UniformValue } from '../gl/program'
import type { AtlasCache, AtlasSpec, AtlasHandle } from '../gl/atlas'

export type EffectId =
  | 'none'
  | 'dotmatrix'
  | 'ascii'
  | 'stitch'
  | 'pills'
  | 'blocks'
  | 'dither'
  | 'halftone'
  | 'glitch'
  | 'laser'
  | 'blueprint'
  | 'gradientmap'
  | 'crystal'

export type ParamValue = number | string | boolean
export type Params = Record<string, ParamValue>

/* ── controls (schema-driven UI) ─────────────────────────────────────── */

export interface SliderControl {
  kind: 'slider'
  key: string
  label: string
  min: number
  max: number
  step: number
  /** display formatter; default = raw number, zero-padded ints */
  unit?: 'int' | 'pct' | 'deg' | 'x100'
}
export interface SelectControl {
  kind: 'select'
  key: string
  label: string
  options: { value: string; label: string }[]
}
export interface ToggleControl {
  kind: 'toggle'
  key: string
  label: string
}
export interface ColorControl {
  kind: 'color'
  key: string
  label: string
}
export type ControlDef = SliderControl | SelectControl | ToggleControl | ColorControl

/* ── effect definition ───────────────────────────────────────────────── */

/** Context handed to uniform/texture builders each frame. */
export interface EffectCtx {
  gl: WebGL2RenderingContext
  atlases: AtlasCache
  /** full output size in px (canvas backing store, or export size) */
  outputSize: [number, number]
  /** px offset of the current tile inside the output ([0,0] on screen) */
  tileOrigin: [number, number]
  /** size of the current render viewport (tile or full output) */
  tileSize: [number, number]
  srcSize: [number, number]
  /** 128×128-ish luminance field of the current image, values 0..1 */
  lumaField: { data: Float32Array; w: number; h: number } | null
  /**
   * Cached canvas→texture helper for CPU-drawn overlays (e.g. blueprint
   * annotations). `key` must change when the drawing would change; `draw`
   * renders into a canvas of the given size (origin = full output origin).
   */
  getOverlayTexture(
    key: string,
    w: number,
    h: number,
    draw: (c2d: CanvasRenderingContext2D, w: number, h: number) => void,
  ): WebGLTexture
  getAtlas(spec: AtlasSpec): AtlasHandle
}

export interface PassSpec {
  /** raw fragment body (no #version header — common lib is prepended) */
  frag: string
  /** uniforms for this pass; `uPrev` (previous pass output) is bound automatically for pass > 0 */
  uniforms?: (params: Params, ctx: EffectCtx) => Record<string, UniformValue>
  /** extra textures: uniform name → texture */
  textures?: (params: Params, ctx: EffectCtx) => Record<string, WebGLTexture>
}

/** CPU compute for effects that cannot run on the GPU (error-diffusion). */
export interface CpuSpec {
  /** true when the current params take the CPU path */
  active: (params: Params) => boolean
  /** message posted to the dither worker */
  request: (params: Params) => Record<string, ParamValue>
}

export interface EffectDef {
  id: EffectId
  /** display name, uppercase, ≤ 10 chars */
  name: string
  passes: PassSpec[]
  controls: ControlDef[]
  defaults: Params
  /** px of neighborhood a pass reads beyond its own pixel at the given
   *  output size (tiled export apron) */
  apron?: (params: Params, outputSize: [number, number]) => number
  cpu?: CpuSpec
  /** true for full-frame effects that always emit opaque pixels (they don't
   *  call withBg) — the TRANSPARENT export toggle is meaningless for these */
  opaque?: boolean
}

/* ── shared helpers for defs ─────────────────────────────────────────── */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(s, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function paletteToV3v(hexes: string[]): { v3v: Float32Array } {
  const arr = new Float32Array(hexes.length * 3)
  hexes.forEach((hx, i) => {
    const [r, g, b] = hexToRgb(hx)
    arr[i * 3] = r
    arr[i * 3 + 1] = g
    arr[i * 3 + 2] = b
  })
  return { v3v: arr }
}

/** GROUND control — reusable across mark effects (image shows behind marks). */
export const groundControl: ControlDef = {
  kind: 'slider',
  key: 'ground',
  label: 'GROUND',
  min: 0,
  max: 1,
  step: 0.01,
  unit: 'pct',
}

/** Uniforms for the shared image-ground helper in common.glsl. */
export function groundUniforms(
  p: Params,
  opts: { dark?: number; desat?: number } = {},
): Record<string, number> {
  return {
    uGround: (p.ground as number) ?? 0,
    uGroundDark: opts.dark ?? 0.5,
    uGroundDesat: opts.desat ?? 0.6,
  }
}
