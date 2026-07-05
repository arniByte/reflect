import type { EffectDef } from '../types'
import { hexToRgb, groundControl, groundUniforms } from '../types'
import frag from '../../shaders/effects/dotmatrix.frag?raw'

export const dotmatrixDef: EffectDef = {
  id: 'dotmatrix',
  name: 'DOT MATRIX',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uCells: p.cells as number,
        uDotMin: p.dotMin as number,
        uDotMax: p.dotMax as number,
        uGamma: p.gamma as number,
        uGlow: p.glow as number,
        uColorMode: p.colorMode === 'source' ? 1 : 0,
        uMonoColor: hexToRgb(p.monoColor as string),
        uBg: hexToRgb(p.bg as string),
        ...groundUniforms(p, { dark: 0.4, desat: 0.7 }),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'cells', label: 'CELLS', min: 24, max: 240, step: 1, unit: 'int' },
    { kind: 'slider', key: 'dotMax', label: 'DOT SIZE', min: 0.2, max: 1.4, step: 0.01 },
    { kind: 'slider', key: 'gamma', label: 'GAMMA', min: 0.4, max: 3, step: 0.01 },
    { kind: 'slider', key: 'glow', label: 'GLOW', min: 0, max: 1, step: 0.01 },
    {
      kind: 'select',
      key: 'colorMode',
      label: 'INK',
      options: [
        { value: 'mono', label: 'MONO' },
        { value: 'source', label: 'SOURCE' },
      ],
    },
    { kind: 'color', key: 'monoColor', label: 'COLOR' },
    { kind: 'color', key: 'bg', label: 'BG' },
    groundControl,
  ],
  defaults: {
    cells: 104,
    dotMin: 0.28,
    dotMax: 1.15,
    gamma: 0.95,
    glow: 0.5,
    colorMode: 'source',
    monoColor: '#fff2d9',
    bg: '#000000',
    ground: 0.28,
  },
}
