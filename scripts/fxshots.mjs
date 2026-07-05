import { chromium } from 'playwright'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-reflect/d04526bc-7ea2-5503-963c-a1919345c2de/scratchpad/g'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)))
await page.goto('http://127.0.0.1:4173/')
await page.getByText('LOAD SAMPLE').click(); await page.waitForTimeout(1200)
for(let i=0;i<30;i++) await page.keyboard.press('BracketLeft') // wipe fully to effect
const fx=(process.env.FX||'DOT MATRIX,ASCII,PILLS,BLOCKS,BLUEPRINT,LASER').split(',')
for(const name of fx){
  await page.locator('.fxlist__item',{hasText:name}).first().click()
  await page.waitForTimeout(600)
  await page.locator('.stage__frame').screenshot({path:`${OUT}/${name.replace(/ /g,'_')}.png`})
}
console.log(JSON.stringify({errs}))
await browser.close()
