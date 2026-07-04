import { chromium } from 'playwright'

const OUT = process.env.OUT_DIR ?? '/tmp/claude-0/-home-user-reflect/d04526bc-7ea2-5503-963c-a1919345c2de/scratchpad/shots'
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(URL)
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/00-empty.png` })

// load the sample image
await page.getByText('LOAD SAMPLE').click()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/01-dotmatrix.png` })

// switch to halftone
await page.getByText('HALFTONE').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/02-halftone.png` })

// switch to none + tweak color
await page.getByText('01', { exact: true }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/03-none.png` })

const webgl = await page.evaluate(() => {
  const c = document.createElement('canvas')
  return !!c.getContext('webgl2')
})

console.log(JSON.stringify({ webgl, errors }, null, 2))
await browser.close()
