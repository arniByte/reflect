interface Props {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange(v: string): void
}

export function Select({ label, value, options, onChange }: Props) {
  return (
    <div className="ctl">
      <div className="ctl__row">
        <span className="lbl">{label}</span>
      </div>
      <div className="chips" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            className={`chip${o.value === value ? ' chip--on' : ''}`}
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
