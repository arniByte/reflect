import type { EffectDef } from '../types'
import { hexToRgb, paletteToV3v, groundControl, groundUniforms } from '../types'
import frag from '../../shaders/effects/pills.frag?raw'

const CANDY = ['#00e5ff', '#ff2e88', '#ff9f1c']

export const pillsDef: EffectDef = {
  id: 'pills',
  name: 'PILLS',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uRows: p.rows as number,
        uSegAspect: p.segAspect as number,
        uGap: p.gap as number,
        uRound: p.round as number,
        uPalette: paletteToV3v(CANDY),
        uBg: hexToRgb(p.bg as string),
        ...groundUniforms(p, { dark: 0.3, desat: 0.8 }),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'rows', label: 'ROWS', min: 20, max: 80, step: 1, unit: 'int' },
    { kind: 'slider', key: 'segAspect', label: 'SEG LEN', min: 1, max: 6, step: 0.1 },
    { kind: 'slider', key: 'gap', label: 'GAP', min: 0, max: 0.6, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'round', label: 'ROUND', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'color', key: 'bg', label: 'BG' },
    groundControl,
  ],
  defaults: {
    rows: 46,
    segAspect: 3,
    gap: 0.26,
    round: 1,
    bg: '#000000',
    ground: 0.18,
  },
}
