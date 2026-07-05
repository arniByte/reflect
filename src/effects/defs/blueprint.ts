import type { EffectCtx, EffectDef, Params } from '../types'
import { hexToRgb } from '../types'
import edgeFrag from '../../shaders/effects/blueprint_edge.frag?raw'
import mainFrag from '../../shaders/effects/blueprint.frag?raw'

interface Anchor {
  /** output-px position (canvas coords, y down) */
  x: number
  y: number
  /** source-px label coordinates */
  sx: number
  sy: number
  v: number
}

/** Pick up to n bright anchor points from the luma field, spaced apart. */
function pickAnchors(
  field: { data: Float32Array; w: number; h: number },
  n: number,
  outW: number,
  outH: number,
  srcW: number,
  srcH: number,
): Anchor[] {
  const { data, w, h } = field
  const cand: { v: number; x: number; y: number }[] = []
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const v = data[y * w + x]
      if (v < 0.22) continue
      // local maximum in a 3×3 neighborhood
      if (
        v >= data[y * w + x - 1] &&
        v >= data[y * w + x + 1] &&
        v >= data[(y - 1) * w + x] &&
        v >= data[(y + 1) * w + x]
      ) {
        cand.push({ v, x, y })
      }
    }
  }
  cand.sort((a, b) => b.v - a.v)
  const minD = 0.16 * Math.min(w, h)
  const picked: { v: number; x: number; y: number }[] = []
  for (const c of cand) {
    if (picked.length >= n) break
    if (picked.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= minD)) picked.push(c)
  }
  return picked.map((p) => ({
    x: ((p.x + 0.5) / w) * outW,
    y: ((p.y + 0.5) / h) * outH,
    sx: Math.round(((p.x + 0.5) / w) * srcW),
    sy: Math.round(((p.y + 0.5) / h) * srcH),
    v: p.v,
  }))
}

function drawAnnotations(
  c2d: CanvasRenderingContext2D,
  p: Params,
  ctx: EffectCtx,
) {
  const [outW, outH] = ctx.outputSize
  const [srcW, srcH] = ctx.srcSize
  const n = Math.round(p.points as number)
  const field = ctx.lumaField
  if (!field || n === 0) return

  c2d.save()
  c2d.translate(-ctx.tileOrigin[0], ctx.tileOrigin[1] + ctx.tileSize[1] - outH)
  // ^ canvas y is top-down while tileOrigin is bottom-up GL px:
  //   canvasY = outputTopDownY - (outH - tileOriginY - tileH)

  const sc = Math.max(outW / 1400, 0.55)
  const font = Math.max(8, 0.013 * outW)
  c2d.strokeStyle = 'rgba(255,255,255,0.92)'
  c2d.fillStyle = 'rgba(255,255,255,0.92)'
  c2d.lineWidth = Math.max(1, sc)
  c2d.font = `${font}px "IBM Plex Mono", monospace`
  c2d.textBaseline = 'middle'

  const anchors = pickAnchors(field, n, outW, outH, srcW, srcH)

  anchors.forEach((a, i) => {
    // crosshair ring + center dot
    const r = 8 * sc
    c2d.beginPath()
    c2d.arc(a.x, a.y, r, 0, Math.PI * 2)
    c2d.stroke()
    c2d.beginPath()
    c2d.arc(a.x, a.y, 1.6 * sc, 0, Math.PI * 2)
    c2d.fill()
    c2d.beginPath()
    c2d.moveTo(a.x - r - 4 * sc, a.y)
    c2d.lineTo(a.x - r + 3 * sc, a.y)
    c2d.moveTo(a.x + r - 3 * sc, a.y)
    c2d.lineTo(a.x + r + 4 * sc, a.y)
    c2d.stroke()

    // dashed leader to the label, alternating side to reduce overlap
    const side = i % 2 === 0 ? 1 : -1
    const lx = a.x + side * 46 * sc
    const ly = a.y - 26 * sc
    c2d.setLineDash([4 * sc, 4 * sc])
    c2d.beginPath()
    c2d.moveTo(a.x + side * r, a.y)
    c2d.lineTo(lx, ly)
    c2d.lineTo(lx + side * 30 * sc, ly)
    c2d.stroke()
    c2d.setLineDash([])

    const label = `${a.sx},${a.sy}`
    c2d.textAlign = side > 0 ? 'left' : 'right'
    c2d.fillText(label, lx + side * 34 * sc, ly)
  })

  // one large measurement arc around the brightest anchor
  if ((p.arc as boolean) && anchors.length > 0) {
    const a = anchors[0]
    const R = 0.42 * outW
    c2d.strokeStyle = 'rgba(255,255,255,0.5)'
    c2d.beginPath()
    c2d.arc(a.x, a.y, R, (-70 * Math.PI) / 180, (40 * Math.PI) / 180)
    c2d.stroke()
    // radial ticks at the arc ends
    for (const deg of [-70, 40]) {
      const t = (deg * Math.PI) / 180
      c2d.beginPath()
      c2d.moveTo(a.x + Math.cos(t) * (R - 6 * sc), a.y + Math.sin(t) * (R - 6 * sc))
      c2d.lineTo(a.x + Math.cos(t) * (R + 6 * sc), a.y + Math.sin(t) * (R + 6 * sc))
      c2d.stroke()
    }
  }
  c2d.restore()
}

export const blueprintDef: EffectDef = {
  id: 'blueprint',
  name: 'BLUEPRINT',
  passes: [
    { frag: edgeFrag },
    {
      frag: mainFrag,
      uniforms: (p) => ({
        uEdgeT: p.edgeT as number,
        uContours: Math.round(p.contours as number),
        uLabels: p.labels as number,
        uEdgeColor: hexToRgb(p.color as string),
        uBg: hexToRgb(p.bg as string),
      }),
      textures: (p, ctx) => ({
        uAnnot: ctx.getOverlayTexture(
          JSON.stringify([p.points, p.arc, ctx.outputSize]),
          ctx.tileSize[0],
          ctx.tileSize[1],
          (c2d) => drawAnnotations(c2d, p, ctx),
        ),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'edgeT', label: 'EDGE T', min: 0.02, max: 0.5, step: 0.01 },
    { kind: 'slider', key: 'contours', label: 'CONTOURS', min: 0, max: 12, step: 1, unit: 'int' },
    { kind: 'slider', key: 'points', label: 'POINTS', min: 0, max: 16, step: 1, unit: 'int' },
    { kind: 'toggle', key: 'arc', label: 'ARC' },
    { kind: 'slider', key: 'labels', label: 'LABELS', min: 0, max: 1, step: 0.01 },
    { kind: 'color', key: 'color', label: 'COLOR' },
    { kind: 'color', key: 'bg', label: 'BG' },
  ],
  defaults: {
    edgeT: 0.12,
    contours: 6,
    points: 8,
    arc: true,
    labels: 0.9,
    color: '#ffffff',
    bg: '#000000',
  },
  apron: () => 4,
}
