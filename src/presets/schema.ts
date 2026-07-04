import type { EffectId, Params } from '../effects/types'
import type { ColorState } from '../state/store'

export interface Preset {
  id: string
  /** display name, uppercase */
  name: string
  effectId: EffectId
  /** param overrides on top of the effect's defaults */
  params: Params
  /** color overrides on top of DEFAULT_COLOR */
  color?: Partial<ColorState>
}
