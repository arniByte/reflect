import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import lz from 'lz-string'

const OUT = process.env.OUT_DIR ?? '/tmp/claude-0/-home-user-reflect/d04526bc-7ea2-5503-963c-a1919345c2de/scratchpad/shots'
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/'
const results = {}
const errors = []

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)))
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)))

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

await page.goto(URL)
await page.getByText('LOAD SAMPLE').click()
await page.waitForTimeout(1200)

// ── 1. plain PNG export at 2× ────────────────────────────────────────────
await page.locator('.fxlist__item', { hasText: 'DOT MATRIX' }).click()
await page.getByRole('button', { name: 'EXPORT' }).first().click()
await page.waitForTimeout(300)
const dl1 = page.waitForEvent('download', { timeout: 60000 })
await page.getByRole('button', { name: 'DOWNLOAD' }).click()
const d1 = await dl1
const p1 = await d1.path()
const buf1 = readFileSync(p1)
results.export2x = { ...pngSize(buf1), bytes: buf1.length }

// ── 2. transparent PNG export at 1× ─────────────────────────────────────
await page.getByRole('button', { name: 'EXPORT' }).first().click()
await page.waitForTimeout(300)
await page.getByText('1×', { exact: true }).click()
await page.getByText('TRANSPARENT BG').click()
const dl2 = page.waitForEvent('download', { timeout: 60000 })
await page.getByRole('button', { name: 'DOWNLOAD' }).click()
const d2 = await dl2
const buf2 = readFileSync(await d2.path())
// decode in-page and probe corner alpha
const b64 = buf2.toString('base64')
results.transparent = await page.evaluate(async (b64) => {
  const img = new Image()
  img.src = 'data:image/png;base64,' + b64
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const corner = ctx.getImageData(2, 2, 1, 1).data
  const center = ctx.getImageData(Math.floor(img.width / 2), Math.floor(img.height * 0.4), 1, 1).data
  return { w: img.width, h: img.height, cornerAlpha: corner[3], centerAlpha: center[3] }
}, b64)

// ── 3. CPU dither (Floyd–Steinberg worker path) ─────────────────────────
await page.locator('.fxlist__item', { hasText: 'DITHER' }).click()
await page.getByRole('radio', { name: 'FLOYD-S' }).click()
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/verify-fs-dither.png` })
results.fsDither = 'screenshot taken'

// ── 4. look-link hash restore ────────────────────────────────────────────
const payload = { v: 1, e: 'pills', p: { rows: 30 }, c: { saturation: 0.3 } }
const hash = '#s=' + lz.compressToEncodedURIComponent(JSON.stringify(payload))
await page.goto('about:blank')
await page.goto(URL + hash)
await page.waitForTimeout(600)
const pillsActive = await page.locator('.fxlist__item--on').textContent()
await page.getByText('LOAD SAMPLE').click()
await page.waitForTimeout(800)
const rowsReadout = await page.locator('.ctl', { hasText: 'ROWS' }).locator('.val').textContent()
const satReadout = await page.locator('.ctl', { hasText: 'SATURATION' }).locator('.val').textContent()
results.hashRestore = { pillsActive, rowsReadout, satReadout }
await page.screenshot({ path: `${OUT}/verify-hash-restore.png` })

// ── 5. mobile layout ─────────────────────────────────────────────────────
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } })
mob.on('pageerror', (e) => errors.push('mobile: ' + String(e).slice(0, 200)))
await mob.goto(URL)
await mob.getByText('LOAD SAMPLE').click()
await mob.waitForTimeout(1200)
await mob.screenshot({ path: `${OUT}/verify-mobile.png` })
results.mobile = 'screenshot taken'

console.log(JSON.stringify({ results, errors }, null, 2))
await browser.close()
