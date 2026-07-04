/** Capability checks + share/copy actions with graceful fallbacks. */

export function canCopyImage(): boolean {
  return typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write
}

export function canWebShare(): boolean {
  if (!navigator.canShare) return false
  try {
    const f = new File([new Uint8Array(4)], 'x.png', { type: 'image/png' })
    return navigator.canShare({ files: [f] })
  } catch {
    return false
  }
}

/**
 * Copy a PNG blob to the clipboard. Safari requires the ClipboardItem to be
 * constructed with a promise inside the user gesture — pass a producer.
 */
export async function copyImage(produce: () => Promise<Blob>): Promise<void> {
  const item = new ClipboardItem({ 'image/png': produce() })
  await navigator.clipboard.write([item])
}

export async function shareImage(blob: Blob, name: string, title: string): Promise<void> {
  const file = new File([blob], name, { type: blob.type })
  await navigator.share({ files: [file], title })
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
