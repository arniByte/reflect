import type { EffectDef } from '../types'
import { hexToRgb } from '../types'
import frag from '../../shaders/effects/laser.frag?raw'

export const laserDef: EffectDef = {
  id: 'laser',
  name: 'LASER',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uCount: Math.round(p.count as number),
        uSpread: p.spread as number,
        uWidth: p.width as number,
        uBaseMix: p.base as number,
        uColor: hexToRgb(p.color as string),
        uBg: hexToRgb(p.bg as string),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'count', label: 'LINES', min: 8, max: 64, step: 1, unit: 'int' },
    { kind: 'slider', key: 'spread', label: 'SPREAD', min: 0.4, max: 2, step: 0.01 },
    { kind: 'slider', key: 'width', label: 'WIDTH', min: 0.5, max: 6, step: 0.05 },
    { kind: 'slider', key: 'base', label: 'BASE', min: 0, max: 0.5, step: 0.01 },
    { kind: 'color', key: 'color', label: 'COLOR' },
    { kind: 'color', key: 'bg', label: 'BG' },
  ],
  defaults: {
    count: 28,
    spread: 1.1,
    width: 1.6,
    base: 0.24,
    color: '#37ff8b',
    bg: '#000000',
  },
}
