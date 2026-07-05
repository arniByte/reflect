import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore, type Quality } from '../state/store'
import { useRenderer, pokeRenderer } from '../hooks/useRenderer'
import { WipeSlider } from './WipeSlider'
import type { Renderer } from '../render/Renderer'
import { getEffect } from '../effects/registry'

const QUALITY_FACTOR: Record<Quality, number> = { fast: 0.5, std: 1, hd: 2 }
const MAX_BACKING = 4096

interface Props {
  onRenderer(r: Renderer | null): void
  emptySlot: React.ReactNode
}

export function CanvasStage({ onRenderer, emptySlot }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderer = useRenderer(canvasRef)

  const srcW = useStore((s) => s.srcW)
  const srcH = useStore((s) => s.srcH)
  const hasImage = useStore((s) => s.bitmap !== null)
  const fileName = useStore((s) => s.fileName)
  const quality = useStore((s) => s.quality)
  const effectId = useStore((s) => s.effectId)

  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [renderMs, setRenderMs] = useState(0)

  useEffect(() => {
    onRenderer(renderer)
    if (renderer) {
      renderer.onFrame = (ms) => setRenderMs(ms)
    }
  }, [renderer, onRenderer])

  // fit the frame to the stage, preserving image aspect
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const compute = () => {
      const pad = 28
      const availW = stage.clientWidth - pad * 2
      const availH = stage.clientHeight - pad * 2
      if (!hasImage || srcW === 0 || availW <= 0 || availH <= 0) {
        setFrame({ w: 0, h: 0 })
        return
      }
      const s = Math.min(availW / srcW, availH / srcH)
      setFrame({ w: Math.max(1, Math.floor(srcW * s)), h: Math.max(1, Math.floor(srcH * s)) })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [hasImage, srcW, srcH])

  // size the backing store: css × dpr × quality
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || frame.w === 0) return
    const dpr = window.devicePixelRatio || 1
    const f = QUALITY_FACTOR[quality]
    // clamp BOTH axes by one shared scale so backing aspect == CSS aspect —
    // per-axis clamping would squash procedural marks into ellipses
    const rawW = frame.w * dpr * f
    const rawH = frame.h * dpr * f
    const k = Math.min(1, MAX_BACKING / rawW, MAX_BACKING / rawH)
    const w = Math.max(1, Math.round(rawW * k))
    const h = Math.max(1, Math.round(rawH * k))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    pokeRenderer(renderer)
  }, [frame, quality, renderer])

  const effectName = getEffect(effectId).name

  return (
    <main className="stage" ref={stageRef}>
      {!hasImage && emptySlot}
      <div
        className="stage__frame"
        style={{ width: frame.w || 0, height: frame.h || 0, display: hasImage ? 'block' : 'none' }}
      >
        <canvas ref={canvasRef} className="stage__canvas" />
        {hasImage && <WipeSlider />}
        {hasImage && (
          <>
            <div className="hud hud--tl">{`${fileName || 'IMAGE'}  ${srcW}×${srcH}`}</div>
            <div className="hud hud--tr">{effectName}</div>
            <div className="hud hud--bl">{`${(canvasRef.current?.width ?? 0)}×${canvasRef.current?.height ?? 0}PX  ${renderMs.toFixed(1)}MS`}</div>
            <div className="hud hud--br">{`${Math.round(((frame.w || 1) / (srcW || 1)) * 100)}%`}</div>
          </>
        )}
      </div>
    </main>
  )
}
