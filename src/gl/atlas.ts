import { createCanvasTexture } from './texture'

export interface AtlasHandle {
  tex: WebGLTexture
  count: number
  /** px size of one glyph cell inside the atlas */
  cell: number
}

export interface GlyphAtlasSpec {
  kind: 'glyph'
  charset: string
  /** css font, e.g. '48px "IBM Plex Mono"' — drawn into 64px cells */
  font?: string
  bold?: boolean
}

export interface SymbolAtlasSpec {
  kind: 'symbol'
  /** ordered list of symbol ids drawn vectorially */
  symbols: ('x' | 'square' | 'square-fill' | 'dot' | 'plus' | 'diamond')[]
}

export type AtlasSpec = GlyphAtlasSpec | SymbolAtlasSpec

const CELL = 64

function drawGlyphAtlas(spec: GlyphAtlasSpec): HTMLCanvasElement {
  const chars = [...spec.charset]
  const canvas = document.createElement('canvas')
  canvas.width = CELL * Math.max(chars.length, 1)
  canvas.height = CELL
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const weight = spec.bold ? '700 ' : ''
  ctx.font = `${weight}${spec.font ?? '46px "IBM Plex Mono", monospace'}`
  chars.forEach((ch, i) => {
    ctx.fillText(ch, i * CELL + CELL / 2, CELL / 2 + 2)
  })
  return canvas
}

function drawSymbolAtlas(spec: SymbolAtlasSpec): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = CELL * Math.max(spec.symbols.length, 1)
  canvas.height = CELL
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#fff'
  ctx.fillStyle = '#fff'
  ctx.lineWidth = 7
  ctx.lineCap = 'square'
  const m = 16 // margin inside cell
  spec.symbols.forEach((sym, i) => {
    const x0 = i * CELL
    ctx.save()
    ctx.translate(x0, 0)
    switch (sym) {
      case 'x':
        ctx.beginPath()
        ctx.moveTo(m, m)
        ctx.lineTo(CELL - m, CELL - m)
        ctx.moveTo(CELL - m, m)
        ctx.lineTo(m, CELL - m)
        ctx.stroke()
        break
      case 'square':
        ctx.strokeRect(m, m, CELL - 2 * m, CELL - 2 * m)
        break
      case 'square-fill':
        ctx.fillRect(m, m, CELL - 2 * m, CELL - 2 * m)
        break
      case 'dot':
        ctx.beginPath()
        ctx.arc(CELL / 2, CELL / 2, (CELL - 2 * m) / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'plus':
        ctx.beginPath()
        ctx.moveTo(CELL / 2, m)
        ctx.lineTo(CELL / 2, CELL - m)
        ctx.moveTo(m, CELL / 2)
        ctx.lineTo(CELL - m, CELL / 2)
        ctx.stroke()
        break
      case 'diamond':
        ctx.beginPath()
        ctx.moveTo(CELL / 2, m)
        ctx.lineTo(CELL - m, CELL / 2)
        ctx.lineTo(CELL / 2, CELL - m)
        ctx.lineTo(m, CELL / 2)
        ctx.closePath()
        ctx.fill()
        break
    }
    ctx.restore()
  })
  return canvas
}

/** Cache of built atlases, keyed by spec. */
export class AtlasCache {
  private cache = new Map<string, AtlasHandle>()

  constructor(private gl: WebGL2RenderingContext) {}

  get(spec: AtlasSpec): AtlasHandle {
    const key = JSON.stringify(spec)
    const hit = this.cache.get(key)
    if (hit) return hit
    const canvas = spec.kind === 'glyph' ? drawGlyphAtlas(spec) : drawSymbolAtlas(spec)
    const count = spec.kind === 'glyph' ? [...spec.charset].length : spec.symbols.length
    // flipY=false: atlas v runs top-down; shaders index columns by u only
    const tex = createCanvasTexture(this.gl, canvas, { flipY: false })
    const handle: AtlasHandle = { tex, count, cell: CELL }
    this.cache.set(key, handle)
    return handle
  }

  dispose() {
    for (const { tex } of this.cache.values()) this.gl.deleteTexture(tex)
    this.cache.clear()
  }
}
