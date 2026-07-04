import type { Preset } from './schema'

/**
 * Curated looks. Params ride on top of each effect's defaults; color rides on
 * top of DEFAULT_COLOR. (Extended as effects land.)
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
    params: { cells: 72, colorMode: 'source', glow: 0.3, dotMax: 1.0 },
    color: { contrast: 0.2, saturation: 0.35, duoEnabled: true, duoShadow: '#0a0000', duoHighlight: '#ff3b30', duoMix: 0.85 },
  },
  {
    id: 'newsprint',
    name: 'NEWSPRINT',
    effectId: 'halftone',
    params: { cells: 150, angle: 22.5 },
    color: { contrast: 0.2 },
  },
]
