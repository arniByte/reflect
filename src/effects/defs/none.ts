import type { EffectDef } from '../types'
import frag from '../../shaders/effects/none.frag?raw'

export const noneDef: EffectDef = {
  id: 'none',
  name: 'NONE',
  passes: [{ frag }],
  controls: [],
  defaults: {},
  opaque: true,
}
