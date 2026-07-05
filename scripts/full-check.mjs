import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const OUT='/tmp/claude-0/-home-user-reflect/d04526bc-7ea2-5503-963c-a1919345c2de/scratchpad/g'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox'] })
const errs=[]
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror',e=>errs.push('desk: '+String(e).slice(0,180)))
page.on('console',m=>{if(m.type()==='error')errs.push('c: '+m.text().slice(0,140))})
await page.goto('http://127.0.0.1:4173/')
await page.getByText('LOAD SAMPLE').click(); await page.locator('.empty').waitFor({state:'hidden',timeout:15000})
const names = await page.locator('.fxlist__item').allTextContents()
for(let i=0;i<names.length;i++){ await page.locator('.fxlist__item').nth(i).click(); await page.waitForTimeout(200) }
await page.screenshot({path:`${OUT}/desktop-full.png`})
console.log('EFFECTS', names.length, JSON.stringify(names))
console.log('ERRS_AFTER_CYCLE', JSON.stringify(errs))
// export signature test — use color-panel EXPORT (last button)
try {
  await page.locator('.fxlist__item').first().click(); await page.waitForTimeout(300)
  await page.locator('.panel--right').getByRole('button',{name:'EXPORT'}).click()
  await page.waitForTimeout(400)
  const dl=page.waitForEvent('download',{timeout:40000})
  await page.locator('dialog').getByRole('button',{name:'DOWNLOAD'}).click()
  const buf=readFileSync(await (await dl).path())
  const sig = await page.evaluate(async(b64)=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(img.width-280,img.height-60,270,50).data;let bright=0;for(let i=0;i<d.length;i+=4){if(d[i]+d[i+1]+d[i+2]>360)bright++}return {w:img.width,h:img.height,sigPixels:bright}}, buf.toString('base64'))
  console.log('SIG', JSON.stringify(sig))
} catch(e){ console.log('EXPORT_FAIL', String(e).slice(0,120)) }
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile:true, hasTouch:true })
mob.on('pageerror',e=>errs.push('mob: '+String(e).slice(0,160)))
await mob.goto('http://127.0.0.1:4173/')
await mob.getByText('LOAD SAMPLE').click(); await mob.locator('.empty').waitFor({state:'hidden',timeout:15000})
await mob.screenshot({path:`${OUT}/mobile-full.png`, fullPage:true})
console.log('ERRS', JSON.stringify(errs))
await browser.close()
