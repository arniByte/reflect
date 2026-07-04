import { useStore } from '../../state/store'
import { Slider } from '../controls/Slider'
import { Toggle } from '../controls/Toggle'
import { ColorField } from '../controls/ColorField'

interface Props {
  onExport(): void
}

export function ColorPanel({ onExport }: Props) {
  const color = useStore((s) => s.color)
  const setColor = useStore((s) => s.setColor)
  const resetColor = useStore((s) => s.resetColor)
  const hasImage = useStore((s) => s.bitmap !== null)

  return (
    <aside className="panel panel--right">
      <div className="panel__head">
        <span className="lbl">COLOR</span>
        <button className="panel__reset" onClick={resetColor}>
          RESET
        </button>
      </div>
      <Slider label="EXPOSURE" value={color.exposure} min={-2} max={2} step={0.01} def={0} unit="x100" onChange={(v) => setColor({ exposure: v })} />
      <Slider label="CONTRAST" value={color.contrast} min={-1} max={1} step={0.01} def={0} unit="x100" onChange={(v) => setColor({ contrast: v })} />
      <Slider label="SATURATION" value={color.saturation} min={-1} max={1} step={0.01} def={0} unit="x100" onChange={(v) => setColor({ saturation: v })} />
      <Slider label="HUE" value={color.hue} min={-180} max={180} step={1} def={0} unit="deg" onChange={(v) => setColor({ hue: v })} />
      <Slider label="TEMP" value={color.temperature} min={-1} max={1} step={0.01} def={0} unit="x100" onChange={(v) => setColor({ temperature: v })} />
      <Slider label="TINT" value={color.tint} min={-1} max={1} step={0.01} def={0} unit="x100" onChange={(v) => setColor({ tint: v })} />
      <Toggle label="INVERT" value={color.invert} onChange={(v) => setColor({ invert: v })} />

      <div className="panel__rule" />

      <Toggle label="DUOTONE" value={color.duoEnabled} onChange={(v) => setColor({ duoEnabled: v })} />
      {color.duoEnabled && (
        <>
          <ColorField label="SHADOW" value={color.duoShadow} onChange={(v) => setColor({ duoShadow: v })} />
          <ColorField label="HIGHLIGHT" value={color.duoHighlight} onChange={(v) => setColor({ duoHighlight: v })} />
          <Slider label="MIX" value={color.duoMix} min={0} max={1} step={0.01} def={1} unit="pct" onChange={(v) => setColor({ duoMix: v })} />
        </>
      )}

      <div className="panel__rule" />
      <div className="ctl">
        <button className="textbtn textbtn--fill" style={{ width: '100%' }} disabled={!hasImage} onClick={onExport}>
          EXPORT
        </button>
      </div>
    </aside>
  )
}
