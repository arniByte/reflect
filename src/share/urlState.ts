import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { DEFAULT_COLOR, type ColorState } from '../state/store'
import { getEffect, EFFECTS } from '../effects/registry'
import type { EffectId, Params, ParamValue } from '../effects/types'

interface ShareState {
  v: 1
  e: EffectId
  p: Params // param deltas from defaults
  c: Partial<ColorState> // color deltas from defaults
}

const HEX_RE = /^#[0-9a-f]{3,8}$/i

export function encodeStateToHash(effectId: EffectId, params: Params, color: ColorState): string {
  const def = getEffect(effectId)
  const p: Params = {}
  for (const [k, v] of Object.entries(params)) {
    if (def.defaults[k] !== v) p[k] = v
  }
  const c: Partial<ColorState> = {}
  for (const k of Object.keys(DEFAULT_COLOR) as (keyof ColorState)[]) {
    if (color[k] !== DEFAULT_COLOR[k]) (c as Record<string, unknown>)[k] = color[k]
  }
  const payload: ShareState = { v: 1, e: effectId, p, c }
  return '#s=' + compressToEncodedURIComponent(JSON.stringify(payload))
}

/** Parse + validate a location hash. Unknown keys dropped, numbers clamped. */
export function decodeHash(hash: string): { effectId: EffectId; params: Params; color: Partial<ColorState> } | null {
  const m = hash.match(/#s=(.+)$/)
  if (!m) return null
  try {
    const json = decompressFromEncodedURIComponent(m[1])
    if (!json) return null
    const raw = JSON.parse(json) as ShareState
    if (raw.v !== 1) return null
    const def = EFFECTS[raw.e]
    if (!def) return null

    const params: Params = {}
    for (const c of def.controls) {
      const v = raw.p?.[c.key]
      if (v === undefined) continue
      params[c.key] = sanitizeParam(v, c.kind, c.kind === 'slider' ? c : undefined)
    }

    const color: Partial<ColorState> = {}
    if (raw.c && typeof raw.c === 'object') {
      for (const k of Object.keys(DEFAULT_COLOR) as (keyof ColorState)[]) {
        const v = (raw.c as Record<string, unknown>)[k]
        if (v === undefined) continue
        const d = DEFAULT_COLOR[k]
        if (typeof d === 'number' && typeof v === 'number' && isFinite(v)) {
          ;(color as Record<string, unknown>)[k] = Math.max(-1000, Math.min(1000, v))
        } else if (typeof d === 'boolean' && typeof v === 'boolean') {
          ;(color as Record<string, unknown>)[k] = v
        } else if (typeof d === 'string' && typeof v === 'string' && HEX_RE.test(v)) {
          ;(color as Record<string, unknown>)[k] = v
        }
      }
    }
    return { effectId: raw.e, params, color }
  } catch {
    return null
  }
}

function sanitizeParam(
  v: unknown,
  kind: string,
  slider?: { min: number; max: number },
): ParamValue {
  if (kind === 'slider') {
    const n = typeof v === 'number' && isFinite(v) ? v : 0
    return slider ? Math.max(slider.min, Math.min(slider.max, n)) : n
  }
  if (kind === 'toggle') return Boolean(v)
  if (kind === 'color') {
    return typeof v === 'string' && HEX_RE.test(v) ? v : '#ffffff'
  }
  return typeof v === 'string' ? v.slice(0, 32) : ''
}
