import { useCallback, useRef } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** default value — double-click resets to it; a tick marks it on the track */
  def?: number
  unit?: 'int' | 'pct' | 'deg' | 'x100'
  onChange(v: number): void
}

function fmt(v: number, unit?: Props['unit']): string {
  switch (unit) {
    case 'int':
      return String(Math.round(v)).padStart(3, '0')
    case 'pct':
      return `${Math.round(v * 100)}%`.padStart(4, ' ')
    case 'deg':
      return `${v.toFixed(1)}°`
    case 'x100':
      return (v >= 0 ? '+' : '') + Math.round(v * 100).toString().padStart(2, '0')
    default:
      return v.toFixed(2)
  }
}

export function Slider({ label, value, min, max, step, def, unit, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
      let v = min + t * (max - min)
      v = Math.round(v / step) * step
      onChange(Math.min(max, Math.max(min, v)))
    },
    [min, max, step, onChange],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons & 1) setFromClientX(e.clientX)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = (max - min) / 10
    if (e.key === 'ArrowLeft') onChange(Math.max(min, value - (e.shiftKey ? big : step)))
    else if (e.key === 'ArrowRight') onChange(Math.min(max, value + (e.shiftKey ? big : step)))
    else return
    e.preventDefault()
  }
  const onDoubleClick = () => {
    if (def !== undefined) onChange(def)
  }

  const pct = ((value - min) / (max - min)) * 100
  const defPct = def !== undefined ? ((def - min) / (max - min)) * 100 : null

  return (
    <div className="ctl">
      <div className="ctl__row">
        <span className="lbl">{label}</span>
        <span className="val">{fmt(value, unit)}</span>
      </div>
      <div
        ref={trackRef}
        className="slider"
        style={{ ['--pct' as string]: `${pct}%` }}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        onDoubleClick={onDoubleClick}
      >
        {defPct !== null && <span className="slider__tick" style={{ left: `${defPct}%` }} />}
        <span className="slider__fill" />
        <span className="slider__thumb" />
      </div>
    </div>
  )
}
