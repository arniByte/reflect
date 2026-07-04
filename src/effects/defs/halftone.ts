import type { EffectDef } from '../types'
import { hexToRgb } from '../types'
import frag from '../../shaders/effects/halftone.frag?raw'

export const halftoneDef: EffectDef = {
  id: 'halftone',
  name: 'HALFTONE',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uCells: p.cells as number,
        uAngle: ((p.angle as number) * Math.PI) / 180,
        uShape: p.shape === 'line' ? 1 : p.shape === 'diamond' ? 2 : 0,
        uInk: hexToRgb(p.ink as string),
        uPaper: hexToRgb(p.paper as string),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'cells', label: 'FREQ', min: 40, max: 320, step: 1, unit: 'int' },
    { kind: 'slider', key: 'angle', label: 'ANGLE', min: 0, max: 90, step: 0.5, unit: 'deg' },
    {
      kind: 'select',
      key: 'shape',
      label: 'SHAPE',
      options: [
        { value: 'dot', label: 'DOT' },
        { value: 'line', label: 'LINE' },
        { value: 'diamond', label: 'DIAMOND' },
      ],
    },
    { kind: 'color', key: 'ink', label: 'INK' },
    { kind: 'color', key: 'paper', label: 'PAPER' },
  ],
  defaults: {
    cells: 140,
    angle: 22.5,
    shape: 'dot',
    ink: '#111111',
    paper: '#f4f4f0',
  },
}
