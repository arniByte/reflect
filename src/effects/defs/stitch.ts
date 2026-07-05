import type { EffectDef } from '../types'
import { hexToRgb } from '../types'
import frag from '../../shaders/effects/stitch.frag?raw'

export const stitchDef: EffectDef = {
  id: 'stitch',
  name: 'STITCH',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uCells: p.cells as number,
        uChromaT: p.chromaT as number,
        uColorA: hexToRgb(p.colorA as string),
        uColorB: hexToRgb(p.colorB as string),
        uBg: hexToRgb(p.bg as string),
        uGlyphCount: 3,
      }),
      textures: (_p, ctx) => ({
        uAtlas: ctx.getAtlas({ kind: 'symbol', symbols: ['x', 'square', 'square-fill'] }).tex,
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'cells', label: 'CELLS', min: 30, max: 120, step: 1, unit: 'int' },
    { kind: 'slider', key: 'chromaT', label: 'CHROMA T', min: 0, max: 1, step: 0.01 },
    { kind: 'color', key: 'colorA', label: 'COLOR A' },
    { kind: 'color', key: 'colorB', label: 'COLOR B' },
    { kind: 'color', key: 'bg', label: 'BG' },
  ],
  defaults: {
    cells: 56,
    chromaT: 0.35,
    colorA: '#ffffff',
    colorB: '#ff2222',
    bg: '#000000',
  },
}
