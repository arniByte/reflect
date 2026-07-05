import type { EffectDef } from '../types'
import { hexToRgb } from '../types'
import frag from '../../shaders/effects/crystal.frag?raw'

export const crystalDef: EffectDef = {
  id: 'crystal',
  name: 'CRYSTAL',
  passes: [
    {
      frag,
      uniforms: (p) => ({
        uCells: p.cells as number,
        uJitter: p.jitter as number,
        uEdge: p.edge as number,
        uFacet: p.facet as number,
        uEdgeCol: hexToRgb(p.edgeColor as string),
      }),
    },
  ],
  controls: [
    { kind: 'slider', key: 'cells', label: 'FACETS', min: 12, max: 160, step: 1, unit: 'int' },
    { kind: 'slider', key: 'jitter', label: 'SCATTER', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'facet', label: 'FLATTEN', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'slider', key: 'edge', label: 'EDGES', min: 0, max: 1, step: 0.01, unit: 'pct' },
    { kind: 'color', key: 'edgeColor', label: 'EDGE' },
  ],
  defaults: {
    cells: 64,
    jitter: 0.9,
    facet: 1,
    edge: 0.35,
    edgeColor: '#000000',
  },
  // reads a 1-cell neighborhood; a modest apron keeps tiled export seamless
  apron: (p, [w]) => Math.ceil((w / (p.cells as number)) * 1.5),
}
