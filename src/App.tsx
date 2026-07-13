import { useCallback, useEffect, useRef, useState } from 'react'
import { TopBar } from './components/TopBar'
import { CanvasStage } from './components/CanvasStage'
import { EffectPanel } from './components/panels/EffectPanel'
import { ColorPanel } from './components/panels/ColorPanel'
import { QualitySelect } from './components/QualitySelect'
import { EmptyState } from './components/EmptyState'
import { ExportDialog } from './components/ExportDialog'
import { ShortcutsOverlay } from './components/ShortcutsOverlay'
import { PresetStrip, stepPreset } from './components/PresetStrip'
import { useImageInput } from './hooks/useImageInput'
import { useKeyboard } from './hooks/useKeyboard'
import { useStore } from './state/store'
import { buildRenderState } from './state/renderState'
import { decodeHash, encodeStateToHash } from './share/urlState'
import { copyImage, copyText, canCopyImage } from './share/share'
import { exportImage } from './render/exporter'
import type { Renderer } from './render/Renderer'

export default function App() {
  const { dragging, fileInputRef, openPicker, onFileChange, loadSample } = useImageInput()
  const rendererRef = useRef<Renderer | null>(null)
  const [renderer, setRenderer] = useState<Renderer | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const toast = useStore((s) => s.toast)

  const handleRenderer = useCallback((r: Renderer | null) => {
    rendererRef.current = r
    setRenderer(r)
  }, [])

  // restore a shared look from the URL hash (once)
  useEffect(() => {
    const decoded = decodeHash(location.hash)
    if (decoded) {
      useStore.getState().applyPreset('shared', decoded.color, decoded.effectId, decoded.params)
      useStore.getState().showToast('LOOK RESTORED FROM LINK')
      history.replaceState(null, '', location.pathname + location.search)
    }
  }, [])

  const openExport = useCallback(() => {
    if (useStore.getState().bitmap) setExportOpen(true)
  }, [])

  const quickCopy = useCallback(() => {
    const r = rendererRef.current
    const st = useStore.getState()
    if (!r || !st.bitmap || !canCopyImage()) return
    const s = { ...buildRenderState(st), wipe: 1 }
    copyImage(() =>
      exportImage(r, s, { format: 'png', scale: 1, transparent: false, srcW: st.srcW, srcH: st.srcH }),
    )
      .then(() => st.showToast('COPIED TO CLIPBOARD'))
      .catch(() => st.showToast('CLIPBOARD BLOCKED'))
  }, [])

  const quickCopyLink = useCallback(() => {
    const st = useStore.getState()
    const hash = encodeStateToHash(st.effectId, buildRenderState(st).params, st.color)
    copyText(`${location.origin}${location.pathname}${hash}`)
      .then(() => st.showToast('LOOK LINK COPIED'))
      .catch(() => st.showToast('CLIPBOARD BLOCKED'))
  }, [])

  useKeyboard({
    onOpen: openPicker,
    onExport: openExport,
    onCopy: quickCopy,
    onCopyLink: quickCopyLink,
    onToggleKeys: () => setKeysOpen((v) => !v),
    onPresetStep: (dir) => {
      if (useStore.getState().bitmap) stepPreset(dir)
    },
  })

  return (
    <div className="app">
      <TopBar onOpen={openPicker} onExport={openExport} />
      <EffectPanel />
      <CanvasStage
        onRenderer={handleRenderer}
        emptySlot={<EmptyState onOpen={openPicker} onSample={() => void loadSample()} />}
      />
      <ColorPanel onExport={openExport} />
      <footer className="dock">
        <QualitySelect />
        <PresetStrip renderer={renderer} />
        <div className="dock__keys">
          <button className="iconbtn" onClick={() => setKeysOpen(true)} aria-label="shortcuts">
            ?
          </button>
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
      <ExportDialog open={exportOpen} renderer={renderer} onClose={() => setExportOpen(false)} />
      <ShortcutsOverlay open={keysOpen} onClose={() => setKeysOpen(false)} />
    </div>
  )
}
