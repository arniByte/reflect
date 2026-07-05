import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { buildRenderState } from '../state/renderState'
import { exportImage, planExport, type ExportOptions } from '../render/exporter'
import { downloadBlob, exportFileName } from '../share/download'
import { canCopyImage, canWebShare, copyImage, shareImage, copyText } from '../share/share'
import { encodeStateToHash } from '../share/urlState'
import type { Renderer } from '../render/Renderer'

type Format = 'png' | 'jpeg' | 'webp'
type Scale = 1 | 2 | 4

interface Props {
  open: boolean
  renderer: Renderer | null
  onClose(): void
}

export function ExportDialog({ open, renderer, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState<Scale>(2)
  const [transparent, setTransparent] = useState(false)
  const [signature, setSignature] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const srcW = useStore((s) => s.srcW)
  const srcH = useStore((s) => s.srcH)
  const fileName = useStore((s) => s.fileName)
  const effectId = useStore((s) => s.effectId)
  const showToast = useStore((s) => s.showToast)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const plan = useMemo(() => {
    if (!renderer || !srcW) return null
    const s = buildRenderState(useStore.getState())
    return planExport(renderer, s, { scale, srcW, srcH })
  }, [renderer, srcW, srcH, scale, effectId])

  const run = async (action: 'download' | 'copy' | 'share') => {
    if (!renderer || busy) return
    setBusy(true)
    setProgress(0)
    try {
      const s = buildRenderState(useStore.getState())
      const opts: ExportOptions = {
        format,
        scale,
        transparent: transparent && format !== 'jpeg',
        signature,
        srcW,
        srcH,
        onProgress: (d, t) => setProgress(t ? d / t : 0),
      }
      if (action === 'copy') {
        // ClipboardItem promise must be created within the gesture
        await copyImage(() => exportImage(renderer, { ...s, wipe: 1 }, { ...opts, format: 'png' }))
        showToast('COPIED TO CLIPBOARD')
      } else {
        const blob = await exportImage(renderer, { ...s, wipe: 1 }, opts)
        const name = exportFileName(fileName, effectId, format === 'jpeg' ? 'jpg' : format)
        if (action === 'download') {
          downloadBlob(blob, name)
          showToast('SAVED')
        } else {
          await shareImage(blob, name, 'REFLECT')
        }
      }
      onClose()
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        console.error(e)
        showToast('EXPORT FAILED')
      }
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  const copyLink = async () => {
    const st = useStore.getState()
    const hash = encodeStateToHash(st.effectId, { ...buildRenderState(st).params }, st.color)
    const url = `${location.origin}${location.pathname}${hash}`
    try {
      await copyText(url)
      showToast('LOOK LINK COPIED')
    } catch {
      showToast('CLIPBOARD BLOCKED')
    }
  }

  const outW = plan ? plan.w : 0
  const outH = plan ? plan.h : 0

  return (
    <dialog ref={dialogRef} className="sheet" onClose={onClose} onCancel={onClose}>
      <div className="sheet__head">
        <span className="lbl">EXPORT</span>
        <button className="panel__reset" onClick={onClose}>
          ESC
        </button>
      </div>
      <div className="sheet__body">
        <div className="sheet__row">
          <span className="lbl">FORMAT</span>
          <div className="seg">
            {(['png', 'jpeg', 'webp'] as Format[]).map((f) => (
              <button
                key={f}
                className={`seg__btn${format === f ? ' seg__btn--on' : ''}`}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="sheet__row">
          <span className="lbl">SCALE</span>
          <div className="seg">
            {([1, 2, 4] as Scale[]).map((k) => (
              <button
                key={k}
                className={`seg__btn${scale === k ? ' seg__btn--on' : ''}`}
                onClick={() => setScale(k)}
              >
                {k}×
              </button>
            ))}
          </div>
        </div>
        <div className="sheet__row">
          <span className="lbl">SIZE</span>
          <span className="val">
            {outW}×{outH}PX{plan?.capped ? '  · GPU CAP' : ''}
          </span>
        </div>
        <div className="sheet__row">
          <button
            className="toggle"
            role="switch"
            aria-checked={transparent && format !== 'jpeg'}
            onClick={() => setTransparent((t) => !t)}
            disabled={format === 'jpeg'}
            style={format === 'jpeg' ? { opacity: 0.3 } : undefined}
          >
            <span className={`togglebox${transparent && format !== 'jpeg' ? ' togglebox--on' : ''}`} />
            <span className="lbl">TRANSPARENT BG</span>
          </button>
        </div>
        <div className="sheet__row">
          <button
            className="toggle"
            role="switch"
            aria-checked={signature}
            onClick={() => setSignature((v) => !v)}
          >
            <span className={`togglebox${signature ? ' togglebox--on' : ''}`} />
            <span className="lbl">SIGNATURE · BY ARNI</span>
          </button>
        </div>
        {busy && (
          <div className="progress">
            <div className="progress__bar" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="sheet__foot">
        <button className="textbtn" onClick={copyLink} disabled={busy}>
          COPY LINK
        </button>
        {canCopyImage() && (
          <button className="textbtn" onClick={() => void run('copy')} disabled={busy}>
            COPY
          </button>
        )}
        {canWebShare() && (
          <button className="textbtn" onClick={() => void run('share')} disabled={busy}>
            SHARE
          </button>
        )}
        <button className="textbtn textbtn--fill" onClick={() => void run('download')} disabled={busy}>
          {busy ? 'RENDERING…' : 'DOWNLOAD'}
        </button>
      </div>
    </dialog>
  )
}
