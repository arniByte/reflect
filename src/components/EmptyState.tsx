interface Props {
  onOpen(): void
  onSample(): void
}

export function EmptyState({ onOpen, onSample }: Props) {
  return (
    <div className="empty">
      <span className="empty__title">[ DROP · PASTE · OPEN ]</span>
      <div className="empty__actions">
        <button className="textbtn" onClick={onOpen}>
          OPEN IMAGE
        </button>
        <button className="textbtn" onClick={onSample}>
          LOAD SAMPLE
        </button>
      </div>
      <span className="topbar__stat">YOUR IMAGE NEVER LEAVES THIS DEVICE</span>
    </div>
  )
}
