import { PingPong } from '../gl/fbo'
import { getEffect } from '../effects/registry'
import type { Renderer } from './Renderer'
import type { RenderState } from '../state/renderState'
import { flipIntoImageData } from '../util/pixels'

/** rAF that still resolves in a backgrounded tab (where rAF never fires). */
function yieldFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(t)
      resolve()
    }
    const t = setTimeout(finish, 120)
    requestAnimationFrame(finish)
  })
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp'
  scale: 1 | 2 | 4
  transparent: boolean
  /** stamp a subtle "REFLECT · BY ARNI" corner signature */
  signature?: boolean
  /** original image size (uncapped) */
  srcW: number
  srcH: number
  onProgress?(done: number, total: number): void
}

function drawSignature(c2d: OffscreenCanvasRenderingContext2D, W: number, H: number) {
  const s = Math.max(W / 1400, 0.6)
  const pad = 22 * s
  const fs = Math.max(11, 13 * s)
  c2d.save()
  c2d.font = `500 ${fs}px "IBM Plex Mono", monospace`
  c2d.textAlign = 'right'
  c2d.textBaseline = 'alphabetic'
  const text = 'REFLECT · BY ARNI'
  const x = W - pad
  const y = H - pad
  // dark plate for legibility on any background
  const w = c2d.measureText(text).width
  c2d.fillStyle = 'rgba(0,0,0,0.35)'
  c2d.fillRect(x - w - 8 * s, y - fs, w + 16 * s, fs + 10 * s)
  c2d.fillStyle = 'rgba(255,255,255,0.9)'
  c2d.fillText(text, x, y)
  c2d.restore()
}

/** error-diffusion at export size is CPU-bound — cap it */
export const CPU_EXPORT_CAP = 4096
/** outputs up to this edge render as ONE tile (no seams possible at all) */
const SINGLE_TILE_MAX = 4096

export interface ExportPlan {
  w: number
  h: number
  capped: boolean
  cpuPath: boolean
}

/** Compute the actual export size for the current state + caps. */
export function planExport(renderer: Renderer, s: RenderState, opts: Pick<ExportOptions, 'scale' | 'srcW' | 'srcH'>): ExportPlan {
  const def = getEffect(s.effectId)
  const cpuPath = !!def.cpu?.active(s.params)
  let limit = Math.min(renderer.caps.maxRb, renderer.caps.maxSafeTex, 8192)
  if (cpuPath) limit = Math.min(limit, CPU_EXPORT_CAP)
  const wantW = opts.srcW * opts.scale
  const wantH = opts.srcH * opts.scale
  const k = Math.min(1, limit / wantW, limit / wantH)
  return {
    w: Math.max(1, Math.round(wantW * k)),
    h: Math.max(1, Math.round(wantH * k)),
    capped: k < 1,
    cpuPath,
  }
}

export async function exportImage(renderer: Renderer, s: RenderState, opts: ExportOptions): Promise<Blob> {
  const plan = planExport(renderer, s, opts)
  const { w: W, h: H } = plan
  const def = getEffect(s.effectId)
  const bgAlpha = opts.transparent && opts.format !== 'jpeg' ? 0 : 1

  const canvas = new OffscreenCanvas(W, H)
  const c2d = canvas.getContext('2d')!

  if (plan.cpuPath) {
    // single-shot CPU dither at full export size
    opts.onProgress?.(0, 2)
    const px = renderer.readGradedPixels(s, W, H)
    opts.onProgress?.(1, 2)
    const req = def.cpu!.request(s.params)
    const out = await renderer.cpuEngine.runOnce(px, W, H, req)
    c2d.putImageData(flipIntoImageData(out, W, H), 0, 0)
    opts.onProgress?.(2, 2)
  } else {
    // single-tile whenever the whole output fits — zero seam risk; tile only
    // for the biggest exports, with a generous apron for nonlocal effects
    const single = W <= SINGLE_TILE_MAX && H <= SINGLE_TILE_MAX
    // honor the FULL apron an effect declares (glitch can want ~0.4·W), and
    // shrink the tile so tile+2·apron still fits the texture budget — capping
    // the apron instead would reintroduce visible seams
    const budget = Math.min(renderer.caps.maxRb, renderer.caps.maxSafeTex, 8192)
    const wantApron = single ? 0 : Math.ceil(def.apron?.(s.params, [W, H]) ?? 0)
    const apron = single ? 0 : Math.min(wantApron, Math.floor((budget - 256) / 2))
    const TILE = single ? Math.max(W, H) : Math.max(256, budget - 2 * apron)
    const gl = renderer.gl
    const pp = new PingPong(gl)
    const tilesX = Math.ceil(W / TILE)
    const tilesY = Math.ceil(H / TILE)
    const total = tilesX * tilesY
    let done = 0
    opts.onProgress?.(0, total)
    try {
      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          // tile rect in output px, y bottom-up (GL convention)
          const x0 = tx * TILE
          const y0 = ty * TILE
          const tw = Math.min(TILE, W - x0)
          const th = Math.min(TILE, H - y0)
          pp.ensure(tw + 2 * apron, th + 2 * apron)
          const styled = renderer.runEffect(
            def,
            s,
            [W, H],
            [x0 - apron, y0 - apron],
            pp,
            bgAlpha,
          )
          gl.bindFramebuffer(gl.FRAMEBUFFER, styled.fb)
          const px = new Uint8Array(tw * th * 4)
          gl.readPixels(apron, apron, tw, th, gl.RGBA, gl.UNSIGNED_BYTE, px)
          gl.bindFramebuffer(gl.FRAMEBUFFER, null)
          if (gl.isContextLost()) throw new Error('WEBGL CONTEXT LOST')
          // GL y0 is from the bottom → canvas y = H - y0 - th
          c2d.putImageData(flipIntoImageData(px, tw, th), x0, H - y0 - th)
          done++
          opts.onProgress?.(done, total)
          // let the GPU/compositor breathe (watchdog-friendly); survives bg tab
          await yieldFrame()
        }
      }
    } finally {
      pp.dispose()
    }
  }

  // skip the signature only when the output is genuinely a transparent cutout
  // (a mark effect exported transparent) — full-frame opaque effects always
  // render solid pixels, so the signature must still show there
  const cutout = opts.transparent && opts.format !== 'jpeg' && !def.opaque
  if (opts.signature && !cutout) {
    drawSignature(c2d, W, H)
  }

  const type = opts.format === 'png' ? 'image/png' : opts.format === 'jpeg' ? 'image/jpeg' : 'image/webp'
  return canvas.convertToBlob({ type, quality: opts.format === 'png' ? undefined : 0.92 })
}
