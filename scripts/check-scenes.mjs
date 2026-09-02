// scripts/check-scenes.mjs — run against a dev or built server: BASE=http://localhost:3456 node scripts/check-scenes.mjs
import { chromium } from "playwright"
const BASE = process.env.BASE ?? "http://localhost:3456"
const URL = `${BASE}/en/dev-preview`
const browser = await chromium.launch()
const failures = []

const probeSource = `
  window.__probe = {
    eff(el){let o=1;for(let e=el;e&&e!==document.body;e=e.parentElement){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return 0;o*=+cs.opacity}return o},
    leaves(root){return [...root.querySelectorAll('*')].filter(e=>!e.closest('svg')&&!e.classList.contains('sr-only')&&[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim())).filter(e=>this.eff(e)>0.5).map(e=>({e,r:e.getBoundingClientRect(),t:e.textContent.trim().slice(0,24)})).filter(x=>x.r.width>0&&x.r.height>0)},
    collide(root){const L=this.leaves(root);const out=[];for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(a.e.contains(b.e)||b.e.contains(a.e))continue;const ox=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),oy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(ox>2&&oy>2&&a.t!=='or'&&b.t!=='or')out.push(a.t+' × '+b.t)}return out},
    imgOver(root){const L=this.leaves(root).filter(x=>!x.e.closest('figure'));const imgs=[...root.querySelectorAll('img')].filter(i=>this.eff(i)>0.5).map(i=>i.getBoundingClientRect());const out=[];for(const t of L)for(const r of imgs){const ox=Math.min(t.r.right,r.right)-Math.max(t.r.left,r.left),oy=Math.min(t.r.bottom,r.bottom)-Math.max(t.r.top,r.top);if(ox>2&&oy>2&&t.t!=='or')out.push('image over '+t.t)}return out},
    frames(n){return new Promise(r=>{let k=0;const t=()=>{if(++k>=n)r();else requestAnimationFrame(t)};requestAnimationFrame(t)})},
  }`

// ---- desktop: every stage of every pinned scene
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.goto(URL, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" })
  await page.evaluate(probeSource)
  const result = await page.evaluate(async () => {
    const P = window.__probe
    const out = []
    for (const scene of document.querySelectorAll(".scene-armed")) {
      const top = scene.getBoundingClientRect().top + scrollY
      const span = Math.max(0, scene.offsetHeight - innerHeight)
      // stage thresholds are internal; sample the region every 2% instead
      if (span > 0) {
        for (let p = 0; p <= 1.0001; p += 0.02) {
          window.__lenis.scrollTo(top + span * p, { immediate: true, force: true })
          await P.frames(3)
          const vis = [...scene.querySelectorAll("[data-scene].scene-on")].filter((e) => P.eff(e) > 0.5)
          const maxBottom = Math.max(0, ...vis.map((e) => e.getBoundingClientRect().bottom))
          const col = [...P.collide(scene), ...P.imgOver(scene)]
          if (col.length || maxBottom > innerHeight + 1) out.push({ scene: scene.textContent.trim().slice(0, 20), p: +p.toFixed(2), col, over: Math.round(maxBottom - innerHeight) })
          for (const f of scene.querySelectorAll("[data-eoy-shrink].scene-on")) {
            const wrap = f.closest("[data-place]")
            if (!wrap || +getComputedStyle(wrap).opacity < 0.5) continue
            const thumbs = [...scene.querySelectorAll("[data-scene].scene-on")].filter((e) => e.textContent.includes(" / ") && e.dataset.scene === f.dataset.scene)
            if (!thumbs.length) continue
            const fr = f.getBoundingClientRect(), tr = thumbs[0].querySelectorAll("span.relative")[1].getBoundingClientRect()
            const dx = Math.abs(fr.left + fr.width / 2 - (tr.left + tr.width / 2)), dy = Math.abs(fr.top + fr.height / 2 - (tr.top + tr.height / 2))
            if (dx > 4 || dy > 4) out.push({ scene: "flight", p: +p.toFixed(2), col: [`lands ${Math.round(dx)}/${Math.round(dy)}px off`], over: 0 })
          }
        }
      }
    }
    // rest-state pass: every scene fully on, check the whole page for text collisions / images over text
    document.querySelectorAll("[data-scene]").forEach((e) => e.classList.add("scene-on"))
    const main = document.querySelector("main")
    const mainHits = [...P.collide(main), ...P.imgOver(main)]
    return { out, mainHits }
  })
  for (const r of result.out) failures.push(`desktop ${r.scene} @${r.p}: ${r.col.join("; ")}${r.over > 0 ? ` over-fold ${r.over}px` : ""}`)
  for (const h of result.mainHits) failures.push(`desktop main: ${h}`)
  await page.close()
}

// ---- mobile: nothing overflows sideways, nothing collides with every beat on
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  await page.goto(URL, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" })
  await page.evaluate(probeSource)
  const r = await page.evaluate(() => {
    document.querySelectorAll("[data-scene]").forEach((e) => e.classList.add("scene-on"))
    const P = window.__probe
    const main = document.querySelector("main")
    return { overflow: document.documentElement.scrollWidth > innerWidth, col: [...P.collide(main), ...P.imgOver(main)] }
  })
  if (r.overflow) failures.push("mobile: horizontal overflow")
  for (const c of r.col) failures.push(`mobile collision: ${c}`)
  await page.close()
}

await browser.close()
if (failures.length) { for (const f of failures) console.error(`check-scenes: ${f}`); process.exit(1) }
console.log("check-scenes passed — no text collisions or images over text on the page, nothing past the fold in the scenes, flights land, no mobile overflow.")
