import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox'] })
const p = await b.newPage({ viewport:{width:390,height:844} })  // no isMobile
await p.goto('http://127.0.0.1:4173/'); await p.waitForTimeout(500)
const info = await p.evaluate(()=>{
  const de=document.documentElement
  const mq = matchMedia('(max-width:760px)').matches
  // find widest element
  let widest=null,ww=0
  document.querySelectorAll('*').forEach(el=>{ if(el.scrollWidth>ww){ww=el.scrollWidth;widest=el.className||el.tagName}})
  return {mq, innerW:innerWidth, docScrollW:de.scrollWidth, bodyScrollW:document.body.scrollWidth, widest, ww}
})
console.log(JSON.stringify(info))
await b.close()
