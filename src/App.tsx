import { useCallback, useRef, useState } from 'react'
import { TopBar } from './components/TopBar'
import { CanvasStage } from './components/CanvasStage'
import { EffectPanel } from './components/panels/EffectPanel'
import { ColorPanel } from './components/panels/ColorPanel'
import { QualitySelect } from './components/QualitySelect'
import { EmptyState } from './components/EmptyState'
import { useImageInput } from './hooks/useImageInput'
import { useStore } from './state/store'
import type { Renderer } from './render/Renderer'

export default function App() {
  const { dragging, fileInputRef, openPicker, onFileChange, loadSample } = useImageInput()
  const rendererRef = useRef<Renderer | null>(null)
  const [, setRendererTick] = useState(0)
  const toast = useStore((s) => s.toast)

  const handleRenderer = useCallback((r: Renderer | null) => {
    rendererRef.current = r
    setRendererTick((t) => t + 1)
  }, [])

  const handleExport = useCallback(() => {
    // export dialog lands in M4
    useStore.getState().showToast('EXPORT: COMING NEXT')
  }, [])

  return (
    <div className="app">
      <TopBar onOpen={openPicker} onExport={handleExport} />
      <EffectPanel />
      <CanvasStage
        onRenderer={handleRenderer}
        emptySlot={<EmptyState onOpen={openPicker} onSample={() => void loadSample()} />}
      />
      <ColorPanel onExport={handleExport} />
      <footer className="dock">
        <QualitySelect />
        <div className="dock__presets">
          <span className="lbl">PRESETS — SOON</span>
        </div>
        <div className="dock__keys">
          <span className="lbl">?</span>
        </div>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      {dragging && <div className="drop">[ DROP IMAGE ]</div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
