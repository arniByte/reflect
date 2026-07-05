import type { EffectDef, Params } from '../types'
import frag from '../../shaders/effects/flow.frag?raw'

export const flowDef: EffectDef = {
  id: 'flow',
  name: 'FLOW',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uScale: p.scale as number,
        uAmount: p.amount as number,
        uSpeed: p.speed as number,
        uSwirl: p.swirl as number,
        uChroma: p.chroma as number,
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'amount', label: 'AMOUNT', min: 0, max: 0.25, step: 0.005 },
    { kind: 'slider', key: 'scale', label: 'SCALE', min: 0.5, max: 8, step: 0.1 },
    { kind: 'slider', key: 'swirl', label: 'SWIRL', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'chroma', label: 'CHROMA', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'speed', label: 'SPEED', min: 0, max: 3, step: 0.01 },
    { kind: 'slider', key: 'trails', label: 'TRAILS', min: 0, max: 1, step: 0.01, unit: 'pct' },
  ],
  defaults: {
    amount: 0.06,
    scale: 3,
    swirl: 0.5,
    chroma: 0.3,
    speed: 0.8,
    trails: 0,
  },
  opaque: true,
  animated: (p: Params) => (p.speed as number) > 0 || (p.trails as number) > 0,
}
