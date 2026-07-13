/// <reference lib="webworker" />

/**
 * Error-diffusion dithering (Floyd–Steinberg / Atkinson) with palette
 * quantization. Input/output: straight RGBA bytes, row order irrelevant.
 * Honors `pixel` (block size, matches the GPU pixelation) and `strength`
 * (fraction of quantization error diffused) so the sliders are live.
 */

export interface DitherJob {
  id: number
  w: number
  h: number
  /** RGBA bytes, transferred */
  data: ArrayBuffer
  method: 'fs' | 'atkinson'
  /** comma-joined hex colors, e.g. "000000,ffffff" */
  palette: string
  serpentine: boolean
  /** block size in output px (pixelation); 1 = per-pixel */
  pixel?: number
  /** 0..1 fraction of error diffused */
  strength?: number
}

export interface DitherResult {
  id: number
  data: ArrayBuffer
}

function parsePalette(s: string): number[][] {
  return s.split(',').map((hex) => {
    const n = parseInt(hex.trim().replace('#', ''), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  })
}

self.onmessage = (e: MessageEvent<DitherJob>) => {
  const { id, w, h, data, method, palette, serpentine } = e.data
  const pixel = Math.max(1, Math.round(e.data.pixel ?? 1))
  const strength = e.data.strength ?? 1
  const px = new Uint8ClampedArray(data)
  const pal = parsePalette(palette)

  // coarse grid: one cell per `pixel`-sized block (matches the GPU sampling)
  const cw = Math.max(1, Math.ceil(w / pixel))
  const ch = Math.max(1, Math.ceil(h / pixel))

  // average each block into the coarse working buffer (float, carries error)
  const buf = new Float32Array(cw * ch * 3)
  const cnt = new Float32Array(cw * ch)
  for (let y = 0; y < h; y++) {
    const cy = (y / pixel) | 0
    for (let x = 0; x < w; x++) {
      const cx = (x / pixel) | 0
      const si = (y * w + x) * 4
      const ci = cy * cw + cx
      buf[ci * 3] += px[si]
      buf[ci * 3 + 1] += px[si + 1]
      buf[ci * 3 + 2] += px[si + 2]
      cnt[ci]++
    }
  }
  for (let i = 0; i < cw * ch; i++) {
    const c = cnt[i] || 1
    buf[i * 3] /= c
    buf[i * 3 + 1] /= c
    buf[i * 3 + 2] /= c
  }

  const nearest = (r: number, g: number, b: number): number[] => {
    let best = pal[0]
    let bd = Infinity
    for (const c of pal) {
      const dr = r - c[0]
      const dg = g - c[1]
      const db = b - c[2]
      const d = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114
      if (d < bd) {
        bd = d
        best = c
      }
    }
    return best
  }

  const spread = (x: number, y: number, er: number, eg: number, eb: number, k: number) => {
    if (x < 0 || x >= cw || y < 0 || y >= ch) return
    const j = (y * cw + x) * 3
    buf[j] += er * k
    buf[j + 1] += eg * k
    buf[j + 2] += eb * k
  }

  for (let y = 0; y < ch; y++) {
    const reverse = serpentine && y % 2 === 1
    for (let i = 0; i < cw; i++) {
      const x = reverse ? cw - 1 - i : i
      const dir = reverse ? -1 : 1
      const j = (y * cw + x) * 3
      const r = buf[j]
      const g = buf[j + 1]
      const b = buf[j + 2]
      const q = nearest(r, g, b)
      const er = (r - q[0]) * strength
      const eg = (g - q[1]) * strength
      const eb = (b - q[2]) * strength
      buf[j] = q[0]
      buf[j + 1] = q[1]
      buf[j + 2] = q[2]

      if (method === 'fs') {
        spread(x + dir, y, er, eg, eb, 7 / 16)
        spread(x - dir, y + 1, er, eg, eb, 3 / 16)
        spread(x, y + 1, er, eg, eb, 5 / 16)
        spread(x + dir, y + 1, er, eg, eb, 1 / 16)
      } else {
        // Atkinson: 6× 1/8, loses some error → clean highlights
        spread(x + dir, y, er, eg, eb, 1 / 8)
        spread(x + 2 * dir, y, er, eg, eb, 1 / 8)
        spread(x - dir, y + 1, er, eg, eb, 1 / 8)
        spread(x, y + 1, er, eg, eb, 1 / 8)
        spread(x + dir, y + 1, er, eg, eb, 1 / 8)
        spread(x, y + 2, er, eg, eb, 1 / 8)
      }
    }
  }

  // expand the coarse result back to full resolution (nearest)
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    const cy = (y / pixel) | 0
    for (let x = 0; x < w; x++) {
      const cx = (x / pixel) | 0
      const ci = (cy * cw + cx) * 3
      const oi = (y * w + x) * 4
      out[oi] = buf[ci]
      out[oi + 1] = buf[ci + 1]
      out[oi + 2] = buf[ci + 2]
      out[oi + 3] = 255
    }
  }
  const result: DitherResult = { id, data: out.buffer }
  ;(self as unknown as Worker).postMessage(result, [out.buffer])
}
