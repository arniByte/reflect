import { useEffect, useState } from 'react'
import type { Renderer } from '../render/Renderer'
import type { Preset } from '../presets/schema'
import { DEFAULT_COLOR, effectiveParams } from '../state/store'
import type { RenderState } from '../state/renderState'
import { flipIntoImageData } from '../util/pixels'

const THUMB_W = 168
const THUMB_H = 126

/** Live preset thumbnails rendered on the current image. */
export function useThumbnails(
  renderer: Renderer | null,
  imageId: number,
  presets: Preset[],
): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!renderer || imageId === 0) return
    let cancelled = false
    const canvas = document.createElement('canvas')
    canvas.width = THUMB_W
    canvas.height = THUMB_H
    const c2d = canvas.getContext('2d')!

    void (async () => {
      for (const p of presets) {
        if (cancelled) return
        try {
          const state: RenderState = {
            imageId,
            color: { ...DEFAULT_COLOR, ...(p.color ?? {}) },
            effectId: p.effectId,
            params: { ...effectiveParams(p.effectId, {}), ...p.params },
            wipe: 0,
          }
          const px = renderer.renderThumbPixels(state, THUMB_W, THUMB_H)
          c2d.putImageData(flipIntoImageData(px, THUMB_W, THUMB_H), 0, 0)
          const url = canvas.toDataURL('image/jpeg', 0.8)
          if (!cancelled) setUrls((u) => ({ ...u, [p.id]: url }))
        } catch (e) {
          console.error('thumb failed', p.id, e)
        }
        await new Promise((r) => requestAnimationFrame(r))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [renderer, imageId, presets])

  return urls
}
