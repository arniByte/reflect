import { useEffect, useRef } from 'react'

const ROWS: [string, string][] = [
  ['1–9 0', 'SELECT EFFECT'],
  ['SPACE (HOLD)', 'SHOW ORIGINAL'],
  ['[ / ]', 'MOVE WIPE'],
  ['P / ⇧P', 'NEXT / PREV PRESET'],
  ['O', 'OPEN IMAGE'],
  ['E', 'EXPORT'],
  ['C', 'COPY IMAGE'],
  ['L', 'COPY LOOK LINK'],
  ['R / ⇧R', 'RESET EFFECT / ALL'],
  ['F', 'CYCLE PREVIEW QUALITY'],
  ['?', 'THIS PANEL'],
]

interface Props {
  open: boolean
  onClose(): void
}

export function ShortcutsOverlay({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onCancel={onClose}>
      <div className="sheet__head">
        <span className="lbl">KEYS</span>
        <button className="panel__reset" onClick={onClose}>
          ESC
        </button>
      </div>
      <div className="sheet__body">
        <div className="keys">
          {ROWS.map(([k, v]) => (
            <span key={k} style={{ display: 'contents' }}>
              <kbd>{k}</kbd>
              <span className="lbl">{v}</span>
            </span>
          ))}
        </div>
      </div>
    </dialog>
  )
}
