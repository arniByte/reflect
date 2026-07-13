import type { EffectDef, Params } from '../types'
import { paletteToV3v } from '../types'
import frag from '../../shaders/effects/dither.frag?raw'

/** hex lists WITHOUT '#' — the same strings feed the GPU palette uniform
 *  and the CPU worker request (`palette: "000000,ffffff"`). */
const PALETTES: Record<string, string[]> = {
  mono: ['000000', 'ffffff'],
  terminal: ['001905', '37ff8b'],
  gameboy: ['0f380f', '306230', '8bac0f', '9bbc0e'],
  cream: ['1a1208', 'f4e8d0'],
}

const METHODS: Record<string, number> = {
  bayer2: 0,
  bayer4: 1,
  bayer8: 2,
  fs: 3,
  atkinson: 4,
}

function paletteHexes(p: Params): string[] {
  return PALETTES[p.palette as string] ?? PALETTES.mono
}

export const ditherDef: EffectDef = {
  id: 'dither',
  name: 'DITHER',
  passes: [
    {
      frag,
      uniforms: (p) => {
        const pal = paletteHexes(p)
        // pad to the shader's fixed vec3[4]; uPaletteN bounds the search
        const padded = [...pal]
        while (padded.length < 4) padded.push(pal[pal.length - 1])
        return {
          uMethod: METHODS[p.method as string] ?? 1,
          uPixel: Math.max(1, Math.round(p.pixel as number)),
          uStrength: p.strength as number,
          uPalette: paletteToV3v(padded),
          uPaletteN: pal.length,
        }
      },
    },
  ],
  controls: [
    {
      kind: 'select',
      key: 'method',
      label: 'METHOD',
      options: [
        { value: 'bayer2', label: 'BAYER 2' },
        { value: 'bayer4', label: 'BAYER 4' },
        { value: 'bayer8', label: 'BAYER 8' },
        { value: 'fs', label: 'FLOYD-S' },
        { value: 'atkinson', label: 'ATKINSON' },
      ],
    },
    {
      kind: 'select',
      key: 'palette',
      label: 'PALETTE',
      options: [
        { value: 'mono', label: 'MONO' },
        { value: 'terminal', label: 'TERMINAL' },
        { value: 'gameboy', label: 'GAME BOY' },
        { value: 'cream', label: 'CREAM' },
      ],
    },
    { kind: 'slider', key: 'pixel', label: 'PIXEL', min: 1, max: 8, step: 1, unit: 'int' },
    { kind: 'slider', key: 'strength', label: 'STRENGTH', min: 0, max: 1, step: 0.01 },
  ],
  defaults: {
    method: 'bayer4',
    palette: 'mono',
    pixel: 2,
    strength: 0.85,
  },
  cpu: {
    active: (p) => p.method === 'fs' || p.method === 'atkinson',
    request: (p) => ({
      method: p.method as string,
      palette: paletteHexes(p).join(','),
      serpentine: true,
      // included in the request so the preview cache key invalidates AND the
      // worker honors them — otherwise both sliders are dead on the CPU path
      pixel: Math.max(1, Math.round(p.pixel as number)),
      strength: p.strength as number,
    }),
  },
  opaque: true,
}
