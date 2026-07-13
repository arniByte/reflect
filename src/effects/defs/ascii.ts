import type { EffectDef } from '../types'
import { hexToRgb, groundControl, groundUniforms } from '../types'
import frag from '../../shaders/effects/ascii.frag?raw'

/** Charsets ordered dark → bright (index 0 = sparsest mark). */
const CHARSETS: Record<string, string> = {
  ramp: ' .:-=+*#%@',
  binary: '01',
  wire: 'M5SAH23hrsX#',
}

function charsetFor(p: Record<string, unknown>): string {
  const key = p.charset as string
  return CHARSETS[key] ?? CHARSETS.wire
}

export const asciiDef: EffectDef = {
  id: 'ascii',
  name: 'ASCII',
  passes: [
    {
      frag,
      uniforms: (p, ctx) => ({
        uCells: p.cells as number,
        uJitter: p.jitter as number,
        uColorMode: p.ink === 'source' ? 1 : 0,
        uMonoColor: hexToRgb(p.monoColor as string),
        uBg: hexToRgb(p.bg as string),
        uGlyphCount: ctx.getAtlas({ kind: 'glyph', charset: charsetFor(p), bold: true }).count,
        ...groundUniforms(p, { dark: 0.35, desat: 0.75 }),
      }),
      textures: (p, ctx) => ({
        uAtlas: ctx.getAtlas({ kind: 'glyph', charset: charsetFor(p), bold: true }).tex,
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'cells', label: 'CELLS', min: 40, max: 240, step: 1, unit: 'int' },
    {
      kind: 'select',
      key: 'charset',
      label: 'CHARSET',
      options: [
        { value: 'ramp', label: 'RAMP' },
        { value: 'binary', label: 'BINARY' },
        { value: 'wire', label: 'WIRE' },
      ],
    },
    {
      kind: 'select',
      key: 'ink',
      label: 'INK',
      options: [
        { value: 'mono', label: 'MONO' },
        { value: 'source', label: 'SOURCE' },
      ],
    },
    { kind: 'color', key: 'monoColor', label: 'COLOR' },
    { kind: 'color', key: 'bg', label: 'BG' },
    { kind: 'slider', key: 'jitter', label: 'JITTER', min: 0, max: 1, step: 0.01 },
    groundControl,
  ],
  defaults: {
    cells: 120,
    charset: 'wire',
    ink: 'source',
    monoColor: '#37ff8b',
    bg: '#000000',
    jitter: 0.3,
    ground: 0.22,
  },
}
