import { useStore, effectiveParams } from '../../state/store'
import { EFFECT_LIST } from '../../effects/registry'
import { ControlList } from './ControlList'

export function EffectPanel() {
  const effectId = useStore((s) => s.effectId)
  const params = useStore((s) => s.params)
  const setEffect = useStore((s) => s.setEffect)
  const setParam = useStore((s) => s.setParam)
  const resetEffectParams = useStore((s) => s.resetEffectParams)

  const def = EFFECT_LIST.find((d) => d.id === effectId) ?? EFFECT_LIST[0]
  const values = effectiveParams(def.id, params)

  return (
    <aside className="panel panel--left">
      <div className="panel__head">
        <span className="lbl">EFFECT</span>
        <button className="panel__reset" onClick={resetEffectParams}>
          RESET
        </button>
      </div>
      <div className="fxlist" role="listbox" aria-label="effect">
        {EFFECT_LIST.map((d, i) => (
          <button
            key={d.id}
            className={`fxlist__item${d.id === effectId ? ' fxlist__item--on' : ''}`}
            role="option"
            aria-selected={d.id === effectId}
            onClick={() => setEffect(d.id)}
          >
            <span className="fxlist__idx">{String(i + 1).padStart(2, '0')}</span>
            <span>{d.name}</span>
          </button>
        ))}
      </div>
      {def.controls.length > 0 && <div className="panel__rule" />}
      <ControlList
        controls={def.controls}
        values={values}
        defaults={def.defaults}
        onChange={setParam}
      />
    </aside>
  )
}
