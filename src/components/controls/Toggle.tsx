interface Props {
  label: string
  value: boolean
  onChange(v: boolean): void
}

export function Toggle({ label, value, onChange }: Props) {
  return (
    <div className="ctl ctl--inline">
      <button
        className="toggle"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
      >
        <span className={`togglebox${value ? ' togglebox--on' : ''}`} />
        <span className="lbl">{label}</span>
      </button>
    </div>
  )
}
