export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function exportFileName(base: string, effectId: string, ext: string): string {
  const stem = (base.replace(/\.[a-z0-9]+$/i, '') || 'reflect').slice(0, 40)
  return `${stem}-${effectId}.${ext}`
}
