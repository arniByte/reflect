import { useCallback, useRef } from 'react'
import { useStore } from '../state/store'

export function WipeSlider() {
  const wipe = useStore((s) => s.wipe)
  const setWipe = useStore((s) => s.setWipe)
  const showOriginal = useStore((s) => s.showOriginal)
  const ref = useRef<HTMLDivElement | null>(null)

  const setFromClientX = useCallback(
    (clientX: number) => {
      const parent = ref.current?.parentElement
      if (!parent) return
      const r = parent.getBoundingClientRect()
      setWipe((clientX - r.left) / r.width)
    },
    [setWipe],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons & 1) setFromClientX(e.clientX)
  }
  const onDoubleClick = () => setWipe(0.5)

  if (showOriginal) return null

  return (
    <div
      ref={ref}
      className="wipe"
      style={{ left: `${wipe * 100}%` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onDoubleClick={onDoubleClick}
    >
      <div className="wipe__zone" />
      <div className="wipe__line" />
      <div className="wipe__handle">◂▸</div>
    </div>
  )
}
