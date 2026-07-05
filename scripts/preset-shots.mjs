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
  if (m.type() === 'error') errors.push(m.text().slice(0, 500))
})
page.on('pageerror', (e) => errors.push(String(e).slice(0, 500)))

await page.goto(URL)
await page.getByText('LOAD SAMPLE').click()
await page.waitForTimeout(1500)

// 1) every effect at defaults, via the numbered list
const effects = ['NONE','DOT MATRIX','ASCII','STITCH','PILLS','BLOCKS','DITHER','HALFTONE','GLITCH','LASER','BLUEPRINT']
for (let i = 0; i < effects.length; i++) {
  await page.locator('.fxlist__item', { hasText: effects[i] }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/fx-${String(i).padStart(2, '0')}-${effects[i].replace(/ /g, '_')}.png` })
}

// 2) every preset from the strip
const presetCount = await page.locator('.pthumb').count()
for (let i = 0; i < presetCount; i++) {
  await page.locator('.pthumb').nth(i).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/preset-${String(i + 1).padStart(2, '0')}.png` })
}

console.log(JSON.stringify({ presetCount, errors }, null, 2))
await browser.close()
