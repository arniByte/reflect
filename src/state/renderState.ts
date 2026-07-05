import type { EffectId, Params } from '../effects/types'
import type { AppState, ColorState } from './store'
import { effectiveParams } from './store'

/** Plain snapshot consumed by the Renderer — no store references. */
export interface RenderState {
  imageId: number
  color: ColorState
  effectId: EffectId
  params: Params
  wipe: number // effective wipe (0 when holding "show original" is done via 1.0)
}

export function buildRenderState(s: AppState): RenderState {
  return {
    imageId: s.imageId,
    color: s.color,
    effectId: s.effectId,
    params: effectiveParams(s.effectId, s.params),
    wipe: s.showOriginal ? 1 : s.wipe,
  }
}

/** color-state → uniform dict shared by every pass */
export function colorUniforms(c: ColorState): Record<string, number | [number, number, number]> {
  return {
    uExposure: c.exposure,
    uContrast: c.contrast,
    uSaturation: c.saturation,
    uHue: (c.hue * Math.PI) / 180,
    uTemperature: c.temperature,
    uTint: c.tint,
    uInvert: c.invert ? 1 : 0,
    uDuoMix: c.duoEnabled ? c.duoMix : 0,
    uDuoShadow: hexToRgb3(c.duoShadow),
    uDuoHighlight: hexToRgb3(c.duoHighlight),
    // ground defaults (void); mark effects override via their own uniforms()
    uGround: 0,
    uGroundDark: 0.5,
    uGroundDesat: 0.6,
  }
}

function hexToRgb3(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const s = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h
  const n = parseInt(s, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
