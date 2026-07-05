import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
function mean(dd){let r=0,g=0,b=0,n=dd.length/4;for(let i=0;i<dd.length;i+=4){r+=dd[i];g+=dd[i+1];b+=dd[i+2]}return {r:r/n|0,g:g/n|0,b:b/n|0}}
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
await page.goto('http://127.0.0.1:4173/')
await page.getByText('LOAD SAMPLE').click(); await page.waitForTimeout(1000)
await page.locator('.fxlist__item', { hasText: 'NONE' }).click(); await page.waitForTimeout(400)
await page.getByRole('button',{name:'EXPORT'}).first().click(); await page.waitForTimeout(200)
await page.getByText('1×',{exact:true}).click()
const dl = page.waitForEvent('download',{timeout:60000})
await page.getByRole('button',{name:'DOWNLOAD'}).click()
const buf = readFileSync(await (await dl).path())
const res = await page.evaluate(async (b64)=>{
  async function m(src){const img=new Image();img.src=src;await img.decode();const t=document.createElement('canvas');t.width=img.width;t.height=img.height;const x=t.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,img.width,img.height).data;let r=0,g=0,b=0,n=d.length/4;for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}return {w:img.width,h:img.height,r:r/n|0,g:g/n|0,b:b/n|0}}
  const exp = await m('data:image/png;base64,'+b64)
  const src = await m(location.origin+'/samples/dahlia.jpg')
  return {exp, src}
}, buf.toString('base64'))
console.log('SOURCE', JSON.stringify(res.src))
console.log('NONE EXPORT', JSON.stringify(res.exp))
await browser.close()
