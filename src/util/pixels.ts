/**
 * Copy GL readPixels output (rows bottom-up) into an ImageData (rows
 * top-down), flipping vertically.
 */
export function flipIntoImageData(px: Uint8Array | Uint8ClampedArray, w: number, h: number): ImageData {
  const img = new ImageData(w, h)
  const rowBytes = w * 4
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * rowBytes
    img.data.set(px.subarray(src, src + rowBytes), y * rowBytes)
  }
  return img
}
