interface Props {
  label: string
  value: string
  onChange(v: string): void
}

export function ColorField({ label, value, onChange }: Props) {
  return (
    <div className="ctl ctl--inline">
      <div className="ctl__row">
        <span className="lbl">{label}</span>
        <span className="colorfield">
          <span className="val">{value.toUpperCase()}</span>
          <span className="colorfield__swatch" style={{ background: value }}>
            <input
              type="color"
              value={value}
              aria-label={label}
              onChange={(e) => onChange(e.target.value)}
            />
          </span>
        </span>
      </div>
    </div>
  )
}
