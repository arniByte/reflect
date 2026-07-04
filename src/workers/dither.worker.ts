/// <reference lib="webworker" />

/**
 * Error-diffusion dithering (Floyd–Steinberg / Atkinson) with palette
 * quantization. Input/output: straight RGBA bytes, row order irrelevant.
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
  const px = new Uint8ClampedArray(data)
  const pal = parsePalette(palette)

  // work in float to carry error
  const buf = new Float32Array(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = px[i * 4]
    buf[i * 3 + 1] = px[i * 4 + 1]
    buf[i * 3 + 2] = px[i * 4 + 2]
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
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const j = (y * w + x) * 3
    buf[j] += er * k
    buf[j + 1] += eg * k
    buf[j + 2] += eb * k
  }

  for (let y = 0; y < h; y++) {
    const reverse = serpentine && y % 2 === 1
    for (let i = 0; i < w; i++) {
      const x = reverse ? w - 1 - i : i
      const dir = reverse ? -1 : 1
      const j = (y * w + x) * 3
      const r = buf[j]
      const g = buf[j + 1]
      const b = buf[j + 2]
      const q = nearest(r, g, b)
      const er = r - q[0]
      const eg = g - q[1]
      const eb = b - q[2]
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

  const out = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = buf[i * 3]
    out[i * 4 + 1] = buf[i * 3 + 1]
    out[i * 4 + 2] = buf[i * 3 + 2]
    out[i * 4 + 3] = 255
  }
  const result: DitherResult = { id, data: out.buffer }
  ;(self as unknown as Worker).postMessage(result, [out.buffer])
}
