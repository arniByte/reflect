import { useStore, DEFAULT_COLOR, effectiveParams } from '../state/store'
import { PRESETS } from '../presets/presets'
import { useThumbnails } from '../hooks/useThumbnails'
import type { Renderer } from '../render/Renderer'
import type { Preset } from '../presets/schema'

interface Props {
  renderer: Renderer | null
}

export function applyPresetToStore(p: Preset) {
  const st = useStore.getState()
  st.applyPreset(
    p.id,
    { ...DEFAULT_COLOR, ...(p.color ?? {}) },
    p.effectId,
    { ...effectiveParams(p.effectId, {}), ...p.params },
  )
}

export function stepPreset(dir: 1 | -1) {
  const st = useStore.getState()
  const idx = PRESETS.findIndex((p) => p.id === st.activePresetId)
  const next = PRESETS[(idx + dir + PRESETS.length) % PRESETS.length]
  applyPresetToStore(next)
}

export function PresetStrip({ renderer }: Props) {
  const imageId = useStore((s) => s.imageId)
  const activeId = useStore((s) => s.activePresetId)
  const dirty = useStore((s) => s.presetDirty)
  const hasImage = useStore((s) => s.bitmap !== null)
  const urls = useThumbnails(renderer, imageId, PRESETS)

  if (!hasImage) {
    return (
      <div className="dock__presets">
        <span className="lbl">PRESETS — LOAD AN IMAGE</span>
      </div>
    )
  }

  return (
    <div className="dock__presets">
      {PRESETS.map((p, i) => (
        <button
          key={p.id}
          className={`pthumb${p.id === activeId ? ' pthumb--on' : ''}`}
          onClick={() => applyPresetToStore(p)}
          title={p.name}
        >
          {urls[p.id] ? (
            <img className="pthumb__img" src={urls[p.id]} alt={p.name} />
          ) : (
            <span className="pthumb__img" />
          )}
          <span className="pthumb__name">
            {String(i + 1).padStart(2, '0')} {p.name}
            {p.id === activeId && dirty ? '*' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}
