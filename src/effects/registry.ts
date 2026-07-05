import type { EffectDef, EffectId } from './types'
import { noneDef } from './defs/none'
import { dotmatrixDef } from './defs/dotmatrix'
import { asciiDef } from './defs/ascii'
import { stitchDef } from './defs/stitch'
import { pillsDef } from './defs/pills'
import { blocksDef } from './defs/blocks'
import { ditherDef } from './defs/dither'
import { halftoneDef } from './defs/halftone'
import { glitchDef } from './defs/glitch'
import { laserDef } from './defs/laser'
import { blueprintDef } from './defs/blueprint'

/** Ordered list — drives the numbered effect list in the UI (01–11). */
export const EFFECT_LIST: EffectDef[] = [
  noneDef,
  dotmatrixDef,
  asciiDef,
  stitchDef,
  pillsDef,
  blocksDef,
  ditherDef,
  halftoneDef,
  glitchDef,
  laserDef,
  blueprintDef,
]

export const EFFECTS: Partial<Record<EffectId, EffectDef>> = Object.fromEntries(
  EFFECT_LIST.map((d) => [d.id, d]),
)

export function getEffect(id: EffectId): EffectDef {
  return EFFECTS[id] ?? noneDef
}
