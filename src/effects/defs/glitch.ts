import type { EffectDef } from '../types'
import displaceFrag from '../../shaders/effects/glitch_displace.frag?raw'
import smearFrag from '../../shaders/effects/glitch_smear.frag?raw'

export const glitchDef: EffectDef = {
  id: 'glitch',
  name: 'GLITCH',
  passes: [
    {
      frag: displaceFrag,
      uniforms: (p) => ({
        uBands: p.bands as number,
        uShift: p.shift as number,
        uDensity: p.density as number,
        uRGBSplit: p.rgbSplit as number,
      }),
    },
    {
      frag: smearFrag,
      uniforms: (p) => ({
        uSmearLen: p.smearLen as number,
        uDecay: p.decay as number,
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'bands', label: 'BANDS', min: 4, max: 64, step: 1, unit: 'int' },
    { kind: 'slider', key: 'shift', label: 'SHIFT', min: 0, max: 0.25, step: 0.001 },
    { kind: 'slider', key: 'density', label: 'DENSITY', min: 0, max: 1, step: 0.01 },
    { kind: 'slider', key: 'rgbSplit', label: 'RGB SPLIT', min: 0, max: 0.02, step: 0.0005 },
    { kind: 'slider', key: 'smearLen', label: 'SMEAR', min: 0, max: 0.4, step: 0.005 },
    { kind: 'slider', key: 'decay', label: 'DECAY', min: 0.7, max: 0.99, step: 0.005 },
  ],
  defaults: {
    bands: 24,
    shift: 0.08,
    density: 0.55,
    rgbSplit: 0.004,
    smearLen: 0.18,
    decay: 0.92,
  },
  // pass 2 reads uPrev up to smearLen * output-width px to the left
  apron: (p, [w]) => Math.ceil((p.smearLen as number) * w),
}
