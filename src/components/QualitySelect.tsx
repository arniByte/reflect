import { useStore, type Quality } from '../state/store'

const OPTIONS: { value: Quality; label: string }[] = [
  { value: 'fast', label: 'FAST' },
  { value: 'std', label: 'STD' },
  { value: 'hd', label: 'HD' },
]

export function QualitySelect() {
  const quality = useStore((s) => s.quality)
  const setQuality = useStore((s) => s.setQuality)
  return (
    <div className="dock__quality">
      <span className="lbl">PREVIEW</span>
      <div className="seg">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            className={`seg__btn${quality === o.value ? ' seg__btn--on' : ''}`}
            onClick={() => setQuality(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
