import type { Preset } from './schema'

/**
 * Curated looks. Params ride on top of each effect's defaults; color rides on
 * top of DEFAULT_COLOR. Numbered order = the strip.
 */
export const PRESETS: Preset[] = [
  {
    id: 'matrix-board',
    name: 'MATRIX BOARD',
    effectId: 'dotmatrix',
    params: { cells: 96, monoColor: '#fff2d9', glow: 0.55, gamma: 1.1 },
    color: { contrast: 0.08 },
  },
  {
    id: 'signal-red',
    name: 'SIGNAL RED',
    effectId: 'dotmatrix',
    params: { cells: 68, colorMode: 'source', glow: 0.35, dotMax: 1.0, gamma: 1.0 },
    color: {
      contrast: 0.22,
      saturation: 0.3,
      duoEnabled: true,
      duoShadow: '#0a0000',
      duoHighlight: '#ff3b30',
      duoMix: 0.8,
    },
  },
  {
    id: 'terminal-01',
    name: 'TERMINAL 01',
    effectId: 'ascii',
    params: { charset: 'binary', ink: 'mono', monoColor: '#37ff8b', cells: 120, jitter: 0.15 },
    color: { contrast: 0.15 },
  },
  {
    id: 'wire-photo',
    name: 'WIRE PHOTO',
    effectId: 'ascii',
    params: { charset: 'wire', ink: 'source', cells: 110, jitter: 0.4 },
    color: { saturation: 0.2, contrast: 0.1 },
  },
  {
    id: 'cross-stitch',
    name: 'CROSS STITCH',
    effectId: 'stitch',
    params: { cells: 56, chromaT: 0.3 },
    color: { contrast: 0.12 },
  },
  {
    id: 'candy-code',
    name: 'CANDY CODE',
    effectId: 'pills',
    params: { rows: 44, segAspect: 3, gap: 0.3, round: 1 },
    color: { saturation: 0.2 },
  },
  {
    id: 'phosphor-grid',
    name: 'PHOSPHOR GRID',
    effectId: 'blocks',
    params: { cells: 72, sub: 3, scan: 0.35, glow: 0.5 },
    color: { contrast: 0.1 },
  },
  {
    id: 'laser-field',
    name: 'LASER FIELD',
    effectId: 'laser',
    params: { count: 28, spread: 1.1, base: 0.15 },
    color: { contrast: 0.15 },
  },
  {
    id: 'newsprint',
    name: 'NEWSPRINT',
    effectId: 'halftone',
    params: { cells: 150, angle: 22.5 },
    color: { contrast: 0.2 },
  },
  {
    id: 'obra-1bit',
    name: 'OBRA 1-BIT',
    effectId: 'dither',
    params: { method: 'bayer4', palette: 'mono', pixel: 3, strength: 0.9 },
    color: { contrast: 0.25 },
  },
  {
    id: 'blueprint-00',
    name: 'BLUEPRINT 00',
    effectId: 'blueprint',
    params: { contours: 6, points: 8, arc: true },
    color: { contrast: 0.15 },
  },
  {
    id: 'signal-loss',
    name: 'SIGNAL LOSS',
    effectId: 'glitch',
    params: { bands: 24, shift: 0.08, density: 0.55, smearLen: 0.18, decay: 0.92 },
    color: { saturation: -0.25 },
  },
]
