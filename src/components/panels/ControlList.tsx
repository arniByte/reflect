import type { ControlDef, Params, ParamValue } from '../../effects/types'
import { Slider } from '../controls/Slider'
import { Select } from '../controls/Select'
import { Toggle } from '../controls/Toggle'
import { ColorField } from '../controls/ColorField'

interface Props {
  controls: ControlDef[]
  values: Params
  defaults: Params
  onChange(key: string, value: ParamValue): void
}

export function ControlList({ controls, values, defaults, onChange }: Props) {
  return (
    <>
      {controls.map((c) => {
        switch (c.kind) {
          case 'slider':
            return (
              <Slider
                key={c.key}
                label={c.label}
                value={(values[c.key] as number) ?? 0}
                min={c.min}
                max={c.max}
                step={c.step}
                def={defaults[c.key] as number | undefined}
                unit={c.unit}
                onChange={(v) => onChange(c.key, v)}
              />
            )
          case 'select':
            return (
              <Select
                key={c.key}
                label={c.label}
                value={String(values[c.key] ?? '')}
                options={c.options}
                onChange={(v) => onChange(c.key, v)}
              />
            )
          case 'toggle':
            return (
              <Toggle
                key={c.key}
                label={c.label}
                value={Boolean(values[c.key])}
                onChange={(v) => onChange(c.key, v)}
              />
            )
          case 'color':
            return (
              <ColorField
                key={c.key}
                label={c.label}
                value={String(values[c.key] ?? '#ffffff')}
                onChange={(v) => onChange(c.key, v)}
              />
            )
        }
      })}
    </>
  )
}
