import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { decodeImage, isImageFile } from '../util/image'

/** Global drag&drop + paste + file-picker wiring. */
export function useImageInput() {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragDepth = useRef(0)

  const loadBlob = useCallback(async (blob: Blob, name: string) => {
    const { setImage, showToast } = useStore.getState()
    try {
      const bmp = await decodeImage(blob)
      setImage(bmp, name)
    } catch {
      showToast('UNSUPPORTED FORMAT')
    }
  }, [])

  const openPicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      dragDepth.current++
      setDragging(true)
    }
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
    }
    const onDragLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragging(false)
      const file = Array.from(e.dataTransfer?.files ?? []).find(isImageFile)
      if (file) void loadBlob(file, file.name)
    }
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/'),
      )
      const file = item?.getAsFile()
      if (file) {
        e.preventDefault()
        void loadBlob(file, 'PASTED')
      }
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('paste', onPaste)
    }
  }, [loadBlob])

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void loadBlob(file, file.name)
      e.target.value = ''
    },
    [loadBlob],
  )

  const loadSample = useCallback(async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}samples/dahlia.jpg`)
    const blob = await res.blob()
    void loadBlob(blob, 'SAMPLE')
  }, [loadBlob])

  return { dragging, fileInputRef, openPicker, onFileChange, loadSample }
}
