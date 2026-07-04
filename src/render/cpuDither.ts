import type { EffectDef } from '../effects/types'
import type { RenderState } from '../state/renderState'
import type { Renderer } from './Renderer'
import type { DitherResult } from '../workers/dither.worker'

const PREVIEW_MAX_W = 1024
const DEBOUNCE_MS = 80

/**
 * Manages the error-diffusion worker for the live preview path.
 * Caches one result keyed by (imageId, color, params, size). While a job is
 * in flight the renderer falls back to the GPU approximation.
 */
export class CpuDitherEngine {
  private worker: Worker | null = null
  private cacheKey = ''
  private cacheTex: WebGLTexture | null = null
  private cacheGl: WebGL2RenderingContext | null = null
  private pendingKey = ''
  private debounceId = 0
  private jobId = 0

  constructor(private onResult: () => void) {}

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/dither.worker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return this.worker
  }

  /** Preview texture for the current state, or null while computing. */
  getPreviewTex(renderer: Renderer, def: EffectDef, s: RenderState, outW: number, outH: number): WebGLTexture | null {
    const w = Math.min(outW, PREVIEW_MAX_W)
    const h = Math.max(1, Math.round((w * outH) / outW))
    const req = def.cpu!.request(s.params)
    const key = JSON.stringify([s.imageId, s.color, req, w, h])
    if (key === this.cacheKey) return this.cacheTex
    if (key === this.pendingKey) return null

    this.pendingKey = key
    window.clearTimeout(this.debounceId)
    this.debounceId = window.setTimeout(() => {
      if (this.pendingKey !== key) return
      const px = renderer.readGradedPixels(s, w, h)
      const id = ++this.jobId
      const worker = this.ensureWorker()
      const onMsg = (e: MessageEvent<DitherResult>) => {
        if (e.data.id !== id) return
        worker.removeEventListener('message', onMsg)
        if (this.pendingKey !== key) return
        if (this.cacheTex && this.cacheGl) this.cacheGl.deleteTexture(this.cacheTex)
        this.cacheTex = renderer.uploadCpuResult(new Uint8Array(e.data.data), w, h)
        this.cacheGl = renderer.gl
        this.cacheKey = key
        this.pendingKey = ''
        this.onResult()
      }
      worker.addEventListener('message', onMsg)
      worker.postMessage(
        { id, w, h, data: px.buffer, ...req },
        [px.buffer],
      )
    }, DEBOUNCE_MS)
    return null
  }

  /** Run a one-shot full-size job (export path). */
  runOnce(
    px: Uint8Array,
    w: number,
    h: number,
    req: Record<string, unknown>,
  ): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const id = ++this.jobId
      const worker = this.ensureWorker()
      const onMsg = (e: MessageEvent<DitherResult>) => {
        if (e.data.id !== id) return
        worker.removeEventListener('message', onMsg)
        resolve(new Uint8Array(e.data.data))
      }
      worker.addEventListener('message', onMsg)
      worker.postMessage({ id, w, h, data: px.buffer, ...req }, [px.buffer])
    })
  }

  invalidate() {
    this.cacheKey = ''
    this.pendingKey = ''
    if (this.cacheTex && this.cacheGl) this.cacheGl.deleteTexture(this.cacheTex)
    this.cacheTex = null
  }

  dispose() {
    this.invalidate()
    this.worker?.terminate()
    this.worker = null
  }
}
