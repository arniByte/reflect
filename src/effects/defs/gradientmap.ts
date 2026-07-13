import type { EffectDef, Params } from '../types'
import frag from '../../shaders/effects/gradientmap.frag?raw'

/** Gradient presets (dark → light stops). */
const GRADIENTS: Record<string, string[]> = {
  ink: ['#000000', '#ffffff'],
  ember: ['#0b0300', '#7a1500', '#ff5a1f', '#ffd089', '#fff7ec'],
  cyan: ['#03060f', '#0a3d62', '#00a8cc', '#7ef9ff'],
  gold: ['#0a0600', '#3d2c00', '#c98f16', '#ffe08a'],
  magma: ['#000004', '#3b0f70', '#e3611e', '#fcffa4'],
  mint: ['#001108', '#0d3b2e', '#37ff8b', '#ecfff6'],
  violet: ['#07000f', '#2a0a4a', '#8a2be2', '#f2c8ff'],
}

function stops(p: Params): string[] {
  return GRADIENTS[p.gradient as string] ?? GRADIENTS.ember
}

function stopsToV5(hexes: string[]): { v3v: Float32Array } {
  const arr = new Float32Array(5 * 3)
  for (let i = 0; i < 5; i++) {
    const hex = hexes[Math.min(i, hexes.length - 1)]
    const n = parseInt(hex.replace('#', ''), 16)
    arr[i * 3] = ((n >> 16) & 255) / 255
    arr[i * 3 + 1] = ((n >> 8) & 255) / 255
    arr[i * 3 + 2] = (n & 255) / 255
  }
  return { v3v: arr }
}

export const gradientmapDef: EffectDef = {
  id: 'gradientmap',
  name: 'GRADIENT',
  passes: [
    {
      frag,
      uniforms: (p) => {
        const s = stops(p)
        return {
          uStops: stopsToV5(s),
          uStopN: s.length,
          uLevels: Math.round(p.levels as number),
          uMix: p.blend as number,
          uCurve: p.curve as number,
        }
      },
    },
  ],
  controls: [
    {
      kind: 'select',
      key: 'gradient',
      label: 'RAMP',
      options: [
        { value: 'ink', label: 'INK' },
        { value: 'ember', label: 'EMBER' },
        { value: 'magma', label: 'MAGMA' },
        { value: 'gold', label: 'GOLD' },
        { value: 'cyan', label: 'CYAN' },
        { value: 'mint', label: 'MINT' },
        { value: 'violet', label: 'VIOLET' },
      ],
    },
    { kind: 'slider', key: 'levels', label: 'BANDS', min: 0, max: 12, step: 1, unit: 'int' },
    { kind: 'slider', key: 'curve', label: 'CURVE', min: 0.3, max: 3, step: 0.01 },
    { kind: 'slider', key: 'blend', label: 'SOURCE', min: 0, max: 1, step: 0.01, unit: 'pct' },
  ],
  defaults: {
    gradient: 'ember',
    levels: 0,
    curve: 1,
    blend: 0,
  },
  opaque: true,
}
