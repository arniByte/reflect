import { useEffect } from 'react'
import { useStore } from '../state/store'
import { EFFECT_LIST } from '../effects/registry'

interface Handlers {
  onOpen(): void
  onExport(): void
  onCopy(): void
  onCopyLink(): void
  onToggleKeys(): void
  onPresetStep(dir: 1 | -1): void
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable ||
    el.closest('dialog[open]') !== null
  )
}

export function useKeyboard(h: Handlers) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const st = useStore.getState()

      if (e.key === ' ') {
        if (!st.showOriginal) st.setShowOriginal(true)
        e.preventDefault()
        return
      }
      if (e.key >= '0' && e.key <= '9') {
        const idx = e.key === '0' ? 9 : Number(e.key) - 1
        const def = EFFECT_LIST[idx]
        if (def) st.setEffect(def.id)
        return
      }
      switch (e.key) {
        case '[':
          st.setWipe(st.wipe - 0.04)
          break
        case ']':
          st.setWipe(st.wipe + 0.04)
          break
        case 'o':
        case 'O':
          h.onOpen()
          break
        case 'e':
        case 'E':
          h.onExport()
          break
        case 'c':
        case 'C':
          h.onCopy()
          break
        case 'l':
        case 'L':
          h.onCopyLink()
          break
        case 'r':
          st.resetEffectParams()
          break
        case 'R':
          st.resetAll()
          break
        case 'p':
          h.onPresetStep(1)
          break
        case 'P':
          h.onPresetStep(-1)
          break
        case 'f':
        case 'F': {
          const order = ['fast', 'std', 'hd'] as const
          const i = order.indexOf(st.quality)
          st.setQuality(order[(i + 1) % 3])
          break
        }
        case '?':
          h.onToggleKeys()
          break
        default:
          return
      }
      e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        useStore.getState().setShowOriginal(false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [h])
}
