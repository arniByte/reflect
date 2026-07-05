import { chromium } from 'playwright'

const OUT = process.env.OUT_DIR ?? '/tmp/claude-0/-home-user-reflect/d04526bc-7ea2-5503-963c-a1919345c2de/scratchpad/readme'
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto(URL)
await page.getByText('LOAD SAMPLE').click()
await page.waitForTimeout(1500)

// set wipe fully right so shots are 100% effect
await page.evaluate(() => {
  // drag wipe to far left via a synthetic state: double-click resets to 0.5,
  // so instead drive the store through keyboard nudges
})
for (let i = 0; i < 30; i++) await page.keyboard.press('BracketLeft')
await page.waitForTimeout(300)

const presetCount = await page.locator('.pthumb').count()
const names = []
for (let i = 0; i < presetCount; i++) {
  const name = (await page.locator('.pthumb__name').nth(i).textContent()).trim()
  await page.locator('.pthumb').nth(i).click()
  await page.waitForTimeout(700)
  await page.locator('.stage__frame').screenshot({ path: `${OUT}/p${String(i + 1).padStart(2, '0')}.png` })
  names.push(name)
}

// hero: blueprint preset with wipe mid-frame
await page.locator('.pthumb').nth(10).click()
for (let i = 0; i < 12; i++) await page.keyboard.press('BracketRight')
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/hero.png` })

console.log(JSON.stringify({ names }))
await browser.close()
