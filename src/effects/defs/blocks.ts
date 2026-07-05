import type { EffectDef } from '../types'
import { hexToRgb, groundControl, groundUniforms } from '../types'
import frag from '../../shaders/effects/blocks.frag?raw'

export const blocksDef: EffectDef = {
  id: 'blocks',
  name: 'BLOCKS',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uCells: p.cells as number,
        uSub: Math.round(p.sub as number),
        uGamma: p.gamma as number,
        uScan: p.scan as number,
        uGlow: p.glow as number,
        uInk: hexToRgb(p.ink as string),
        uBg: hexToRgb(p.bg as string),
        ...groundUniforms(p, { dark: 0.28, desat: 0.85 }),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'cells', label: 'CELLS', min: 30, max: 140, step: 1, unit: 'int' },
    { kind: 'slider', key: 'sub', label: 'SUBDIV', min: 2, max: 5, step: 1, unit: 'int' },
    { kind: 'slider', key: 'gamma', label: 'GAMMA', min: 0.4, max: 3, step: 0.01 },
    { kind: 'slider', key: 'scan', label: 'SCAN', min: 0, max: 1, step: 0.01 },
    { kind: 'slider', key: 'glow', label: 'GLOW', min: 0, max: 1, step: 0.01 },
    { kind: 'color', key: 'ink', label: 'INK' },
    { kind: 'color', key: 'bg', label: 'BG' },
    groundControl,
  ],
  defaults: {
    cells: 78,
    sub: 3,
    gamma: 1.05,
    scan: 0.3,
    glow: 0.5,
    ink: '#37ff8b',
    bg: '#000814',
    ground: 0.16,
  },
}
