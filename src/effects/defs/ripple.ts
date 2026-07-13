import type { EffectDef, Params } from '../types'
import frag from '../../shaders/effects/ripple.frag?raw'

export const rippleDef: EffectDef = {
  id: 'ripple',
  name: 'RIPPLE',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uFreq: p.freq as number,
        uAmp: p.amp as number,
        uSpeed: p.speed as number,
        uSpec: p.spec as number,
        uDrift: p.drift as number,
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'amp', label: 'AMOUNT', min: 0, max: 0.12, step: 0.002 },
    { kind: 'slider', key: 'freq', label: 'FREQ', min: 4, max: 80, step: 0.5 },
    { kind: 'slider', key: 'spec', label: 'GLINT', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'drift', label: 'DRIFT', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'speed', label: 'SPEED', min: 0, max: 3, step: 0.01 },
    { kind: 'slider', key: 'trails', label: 'TRAILS', min: 0, max: 1, step: 0.01, unit: 'pct' },
  ],
  defaults: {
    amp: 0.03,
    freq: 26,
    spec: 0.25,
    drift: 0.4,
    speed: 1,
    trails: 0,
  },
  opaque: true,
  animated: (p: Params) => (p.speed as number) > 0 || (p.trails as number) > 0,
}
