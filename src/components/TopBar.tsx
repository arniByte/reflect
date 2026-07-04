import { useStore } from '../state/store'

interface Props {
  onOpen(): void
  onExport(): void
}

export function TopBar({ onOpen, onExport }: Props) {
  const hasImage = useStore((s) => s.bitmap !== null)
  const resetAll = useStore((s) => s.resetAll)

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__tag">[WEBGL2]</span>
        <span className="topbar__name">REFLECT</span>
      </div>
      <span className="topbar__stat">IMAGE FX CONSOLE · ALL LOCAL · NO UPLOAD</span>
      <div className="topbar__spacer" />
      <button className="textbtn" onClick={onOpen}>
        OPEN
      </button>
      <button className="textbtn" onClick={resetAll} disabled={!hasImage}>
        RESET
      </button>
      <button className="textbtn textbtn--fill" onClick={onExport} disabled={!hasImage}>
        EXPORT
      </button>
    </header>
  )
}
