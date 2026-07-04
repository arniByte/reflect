import { useEffect, useRef, useState } from 'react'
import { Renderer } from '../render/Renderer'
import { useStore } from '../state/store'
import { buildRenderState } from '../state/renderState'

/**
 * Mounts the Renderer on a canvas and keeps it fed with store snapshots.
 * Returns the renderer instance (null until the canvas mounts).
 */
export function useRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [renderer, setRenderer] = useState<Renderer | null>(null)
  const rendererRef = useRef<Renderer | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let r: Renderer
    try {
      r = new Renderer(canvas)
    } catch (e) {
      console.error(e)
      return
    }
    rendererRef.current = r
    setRenderer(r)

    // feed image changes
    const unsubImg = useStore.subscribe((s, prev) => {
      if (s.bitmap && s.imageId !== prev.imageId) {
        r.setImage(s.bitmap)
        r.invalidate(buildRenderState(s))
      }
    })
    // feed param changes
    const unsubState = useStore.subscribe((s, prev) => {
      if (
        s.color !== prev.color ||
        s.effectId !== prev.effectId ||
        s.params !== prev.params ||
        s.wipe !== prev.wipe ||
        s.showOriginal !== prev.showOriginal
      ) {
        r.invalidate(buildRenderState(s))
      }
    })

    // initial image may already be set
    const s0 = useStore.getState()
    if (s0.bitmap) {
      r.setImage(s0.bitmap)
      r.invalidate(buildRenderState(s0))
    }

    return () => {
      unsubImg()
      unsubState()
      r.dispose()
      rendererRef.current = null
      setRenderer(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return renderer
}

/** Re-render on canvas size changes (quality/layout). */
export function pokeRenderer(r: Renderer | null) {
  if (!r) return
  r.invalidate(buildRenderState(useStore.getState()))
}
