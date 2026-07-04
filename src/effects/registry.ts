import type { EffectDef, EffectId } from './types'
import { noneDef } from './defs/none'
import { dotmatrixDef } from './defs/dotmatrix'
import { halftoneDef } from './defs/halftone'

/** Ordered list — drives the numbered effect list in the UI. */
export const EFFECT_LIST: EffectDef[] = [
  noneDef,
  dotmatrixDef,
  halftoneDef,
]

export const EFFECTS: Partial<Record<EffectId, EffectDef>> = Object.fromEntries(
  EFFECT_LIST.map((d) => [d.id, d]),
)

export function getEffect(id: EffectId): EffectDef {
  return EFFECTS[id] ?? noneDef
}
