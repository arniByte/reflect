import { create } from 'zustand'
import type { EffectId, Params, ParamValue } from '../effects/types'
import { getEffect, EFFECT_LIST } from '../effects/registry'

export interface ColorState {
  exposure: number // stops -2..2
  contrast: number // -1..1
  saturation: number // -1..1
  hue: number // deg -180..180
  temperature: number // -1..1
  tint: number // -1..1
  invert: boolean
  duoEnabled: boolean
  duoShadow: string
  duoHighlight: string
  duoMix: number
}

export const DEFAULT_COLOR: ColorState = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  invert: false,
  duoEnabled: false,
  duoShadow: '#000000',
  duoHighlight: '#ffffff',
  duoMix: 1,
}

export type Quality = 'fast' | 'std' | 'hd'

export interface AppState {
  /* image */
  bitmap: ImageBitmap | null
  imageId: number // bumped on every new image
  srcW: number
  srcH: number
  fileName: string

  /* color */
  color: ColorState

  /* effect */
  effectId: EffectId
  /** params kept per effect so switching preserves tweaks */
  params: Partial<Record<EffectId, Params>>

  /* view */
  wipe: number
  showOriginal: boolean
  quality: Quality

  /* preset */
  activePresetId: string | null
  presetDirty: boolean

  /* ui */
  toast: string | null

  /* actions */
  setImage(bitmap: ImageBitmap, name: string): void
  setColor(patch: Partial<ColorState>): void
  resetColor(): void
  setEffect(id: EffectId): void
  setParam(key: string, value: ParamValue): void
  resetEffectParams(): void
  setWipe(v: number): void
  setShowOriginal(v: boolean): void
  setQuality(q: Quality): void
  applyPreset(presetId: string, color: Partial<ColorState>, effectId: EffectId, params: Params): void
  resetAll(): void
  showToast(msg: string): void
  clearToast(): void
}

export const useStore = create<AppState>((set, get) => ({
  bitmap: null,
  imageId: 0,
  srcW: 0,
  srcH: 0,
  fileName: '',

  color: { ...DEFAULT_COLOR },

  effectId: 'dotmatrix',
  params: {},

  wipe: 0.42,
  showOriginal: false,
  quality: 'std',

  activePresetId: null,
  presetDirty: false,

  toast: null,

  setImage(bitmap, name) {
    const prev = get().bitmap
    if (prev && prev !== bitmap) prev.close()
    set({
      bitmap,
      imageId: get().imageId + 1,
      srcW: bitmap.width,
      srcH: bitmap.height,
      fileName: name,
    })
  },

  setColor(patch) {
    set({ color: { ...get().color, ...patch }, presetDirty: true })
  },
  resetColor() {
    set({ color: { ...DEFAULT_COLOR }, presetDirty: true })
  },

  setEffect(id) {
    set({ effectId: id, activePresetId: null, presetDirty: false })
  },

  setParam(key, value) {
    const { effectId, params } = get()
    const cur = params[effectId] ?? {}
    set({
      params: { ...params, [effectId]: { ...cur, [key]: value } },
      presetDirty: true,
    })
  },

  resetEffectParams() {
    const { effectId, params } = get()
    const next = { ...params }
    delete next[effectId]
    set({ params: next, presetDirty: true })
  },

  setWipe(v) {
    set({ wipe: Math.min(1, Math.max(0, v)) })
  },
  setShowOriginal(v) {
    set({ showOriginal: v })
  },
  setQuality(q) {
    set({ quality: q })
  },

  applyPreset(presetId, color, effectId, params) {
    set({
      color: { ...DEFAULT_COLOR, ...color },
      effectId,
      params: { ...get().params, [effectId]: params },
      activePresetId: presetId,
      presetDirty: false,
    })
  },

  resetAll() {
    set({
      color: { ...DEFAULT_COLOR },
      params: {},
      activePresetId: null,
      presetDirty: false,
    })
  },

  showToast(msg) {
    set({ toast: msg })
    window.setTimeout(() => {
      if (get().toast === msg) set({ toast: null })
    }, 2200)
  },
  clearToast() {
    set({ toast: null })
  },
}))

/** effective params for an effect = defaults ⊕ user overrides */
export function effectiveParams(effectId: EffectId, overrides: Partial<Record<EffectId, Params>>): Params {
  const def = getEffect(effectId)
  return { ...def.defaults, ...(overrides[effectId] ?? {}) }
}

/** index of effect in the ordered list (for the 01–11 labels) */
export function effectIndex(id: EffectId): number {
  return EFFECT_LIST.findIndex((d) => d.id === id)
}
