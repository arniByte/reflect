import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })
await page.goto('http://127.0.0.1:4173/')
await page.getByText('LOAD SAMPLE').click()
await page.waitForTimeout(1200)
await page.locator('.fxlist__item', { hasText: 'DOT MATRIX' }).click()
await page.waitForTimeout(500)
// mean color of the on-screen canvas (whole backing store)
const prev = await page.evaluate(() => {
  const c = document.querySelector('.stage__canvas')
  const t = document.createElement('canvas'); t.width=c.width; t.height=c.height
  const x = t.getContext('2d'); x.drawImage(c,0,0)
  const d = x.getImageData(0,0,c.width,c.height).data
  let r=0,g=0,b=0,n=d.length/4, nb=0
  for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]; if(d[i]+d[i+1]+d[i+2]>30)nb++}
  return {w:c.width,h:c.height, r:r/n|0,g:g/n|0,b:b/n|0, lit:(nb/n*100).toFixed(1)}
})
// export via dialog at 2x, decode, measure
await page.getByRole('button',{name:'EXPORT'}).first().click()
await page.waitForTimeout(300)
const dl = page.waitForEvent('download',{timeout:60000})
await page.getByRole('button',{name:'DOWNLOAD'}).click()
const d = await dl; const buf = readFileSync(await d.path())
const b64 = buf.toString('base64')
const exp = await page.evaluate(async (b64)=>{
  const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode()
  const t=document.createElement('canvas'); t.width=img.width; t.height=img.height
  const x=t.getContext('2d'); x.drawImage(img,0,0)
  const dd=x.getImageData(0,0,img.width,img.height).data
  let r=0,g=0,b=0,n=dd.length/4,nb=0
  for(let i=0;i<dd.length;i+=4){r+=dd[i];g+=dd[i+1];b+=dd[i+2]; if(dd[i]+dd[i+1]+dd[i+2]>30)nb++}
  return {w:img.width,h:img.height,r:r/n|0,g:g/n|0,b:b/n|0,lit:(nb/n*100).toFixed(1)}
}, b64)
console.log('PREVIEW', JSON.stringify(prev))
console.log('EXPORT ', JSON.stringify(exp))
await browser.close()
