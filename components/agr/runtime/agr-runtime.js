// RM20773: the home page's scroll scenes and 3D plates, ported from the approved 26 Nov 2026 prototype
// (strategy/website-direction-2026-11-25/prototype-src/agr.js). The scene logic, timings and numbers are
// the prototype's; what changed is the plumbing:
// - three.js is the bundled 0.187 (the prototype loaded r128 from a CDN). r128 shaded without colour
//   management and with "legacy" light units, so its hex colours are read here as linear values and
//   every light is multiplied by PI: the plates look the same.
// - the globe is our own three.js layer (./globe.js) instead of globe.gl, and the menu story
//   (./menu-story.js) and globe load only when they come within about a screen of the viewport.
// - the page's words are already server-rendered; this only moves and reveals them. Every string it
//   writes comes from `data.t` (messages Agr.runtime).
// - mountAgr returns destroy(), which removes every listener, observer, timer, animation loop and
//   WebGL context (React strict mode mounts twice in development).
import { ACESFilmicToneMapping, AmbientLight, BufferAttribute, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, DoubleSide, EquirectangularReflectionMapping, Group, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, NoColorSpace, PMREMGenerator, PerspectiveCamera, Raycaster, SRGBColorSpace, Scene, TextureLoader, TorusGeometry, Vector2, Vector3, WebGLRenderer } from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

const PI = Math.PI
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t) }
// r128 had no colour management: a hex colour was used as a linear value. Keep that look.
const lin = (hex) => new Color().setHex(hex, LinearSRGBColorSpace)
// r128 also decoded sRGB textures after sampling, so their mipmaps were averaged in sRGB: thin dark type
// on the plate backs stayed dark at a distance. Keep that for the two lettered canvases.
const decodeInShader = (m) => {
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n  diffuseColor *= sRGBTransferEOTF( texture2D( map, vMapUv ) );\n#endif') }
  m.customProgramCacheKey = () => 'agr-srgb-in-shader'
  return m
}

/**
 * @param {HTMLElement} root the `main.agr` element rendered by AgrHome
 * @param {import('../AgrRuntime').AgrClientData} data
 * @returns {{ destroy(): void }}
 */
export function mountAgr(root, data) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = (s) => root.querySelector(s)
  const $$ = (s) => [...root.querySelectorAll(s)]
  const T = data.t || {}
  const fmt = (key, vars) => (T[key] || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? String(vars[k]) : ''))
  const DISHES = data.dishes
  const N = DISHES.length

  // ---- lifetime: everything registered here is undone by destroy() ----
  let dead = false
  const undo = []
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); undo.push(() => target.removeEventListener(type, fn, opts)) }
  const timers = new Set()
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn() }, ms); timers.add(id); return id }
  const unlater = (id) => { clearTimeout(id); timers.delete(id) }
  const frames = new Set()
  const nextFrame = (fn) => { const id = requestAnimationFrame((t) => { frames.delete(id); if (!dead) fn(t) }); frames.add(id); return id }
  const intervals = []

  function prog(el) { const r = el.getBoundingClientRect(), run = r.height - innerHeight; return run > 0 ? clamp(-r.top / run, 0, 1) : clamp(-r.top / Math.max(1, r.height), 0, 1) }

  // elements the scenes read
  const hero = $('.hero'), pill = $('#pilltext'), ringEl = $('#ring'), ring2 = $('#ring2'), endEl = $('.end')
  const c1el = $('.c1'), c2 = $('.c2'), c2in = $('.c2 .in'), c3 = $('.c3'), c3in = $('.c3 .in'), c3cap = $('#c3cap')
  const c3bEl = $('.c3b'), c4el = $('.c4'), c4head = $('.c4 .head'), feed = $('#feed')
  const c5 = $('.c5'), eat = $('#eat'), yeet = $('#yeet'), csEl = $('.cs'), board = $('#board')
  const cmEl = $('.cm'), gEl = $('#globe'), chEl = $('.ch'), c7el = $('.c7'), hsEl = $('#story'), travel = $('#travel')
  const siteFoot = document.querySelector('.sitefoot')

  // ---- WebGL: the plates ----
  // Set up in its own task after mounting (setupGL, below), so starting the page never runs as one long task.
  const canvas = $('#gl')
  let renderer = null, ok = false, noGL = false
  const holders = [], tops = [], texs = [], REC_ROT = PI / 2
  const OPEN = 0, USUAL = 0   // chapter 3: the dish on the table is the regular's usual; its back names it, then it comes to sit beside the card
  let scene, camera, twin = null, narrow = innerWidth < 820
  let cur = null, raf = 0, last = 0, introStart = 0, introDone = reduce
  const disposables = []
  // the plates draw only once their shaders are compiled (in the background where the browser can), so the
  // first frame never blocks the page
  let glReady = false
  const kick = () => { if (ok && glReady && !raf && !dead) { last = performance.now(); raf = requestAnimationFrame(frame) } }

  function setupGL() {
    try {
      // ask for WebGL2 first: without it there is nothing to draw, and three.js would log an error
      const context = canvas.getContext('webgl2', { antialias: true, alpha: true })
      if (context) renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true })
      if (!renderer.capabilities.isWebGL2) throw new Error('webgl2')
    } catch {
      if (renderer) { renderer.dispose(); renderer = null }
    }
    ok = !!renderer
    if (!ok) { noGL = true; root.classList.add('no-gl'); measure(); return }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    scene = new Scene()
    camera = new PerspectiveCamera(30, 1, 0.1, 60)
    camera.position.set(0, 0, 8)
    // lighting after A24's disc stage: soft ambient, warm key, a fill, a coloured rim from behind, a bright strip overhead
    // (r128 intensities times PI: three.js dropped its legacy light units)
    scene.add(new AmbientLight(lin(0xffffff), 0.25 * PI))
    const key = new DirectionalLight(lin(0xfff9e8), 0.6 * PI); key.position.set(3.5, -4, 6); scene.add(key)
    const fill = new DirectionalLight(lin(0xffffff), 0.3 * PI); fill.position.set(-5, -2, 4); scene.add(fill)
    const rimL = new DirectionalLight(lin(0xff9932), 0.7 * PI); rimL.position.set(0, 3, -6); scene.add(rimL)
    const strip = new DirectionalLight(lin(0xffffff), 0.45 * PI); strip.position.set(0, 3.2, 3); scene.add(strip)
    // a painted reflection map so the glaze catches a highlight band, as their environment canvas does
    const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256; const ex = ec.getContext('2d')
    const gr = ex.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.42, '#fff7ee'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.56, '#f3e2cc'); gr.addColorStop(1, '#6e5b4b')
    ex.fillStyle = gr; ex.fillRect(0, 0, 512, 256); ex.fillStyle = 'rgba(255,255,255,.9)'; ex.fillRect(0, 70, 512, 14)
    const et = new CanvasTexture(ec); et.mapping = EquirectangularReflectionMapping
    // Each material carries the map itself: three.js now ignores envMapIntensity for scene.environment
    // (scene.environmentIntensity wins), which washed the glaze out. r128 honoured the per-material values.
    // (built in its own task, below, so mounting never runs as one long task)
    const envMap = null, physMats = []
    const phys = (m) => { physMats.push(m); return m }
    const loader = new TextureLoader()
    // phones draw the plates at about a third of the width: the 384 px copies are enough there
    const texSrc = (src) => (narrow ? src.replace(/\.webp$/, '-384.webp') : src)
    DISHES.forEach((d) => {
      const t = loader.load(texSrc(d.src), () => kick())
      t.colorSpace = SRGBColorSpace; t.anisotropy = 8; t.center.set(0.5, 0.5); t.rotation = PI / 2   // the cylinder cap maps images a quarter-turn off; turn them back upright
      texs.push(t); disposables.push(t)
    })
    // back face: cream glaze with the orange Makan logo
    const bc = document.createElement('canvas'); bc.width = bc.height = 1024; const bx = bc.getContext('2d'); bx.fillStyle = '#fff7ee'; bx.fillRect(0, 0, 1024, 1024)
    const backTex = new CanvasTexture(bc); backTex.colorSpace = NoColorSpace; backTex.center.set(0.5, 0.5); backTex.rotation = PI / 2; disposables.push(backTex)
    const lg = new Image(); lg.onload = () => { if (dead) return; const w = 560, h = w * lg.height / lg.width; bx.drawImage(lg, 512 - w / 2, 512 - h / 2, w, h); backTex.needsUpdate = true; kick() }; lg.src = '/redesign/logo-orange.svg'
    const edgeMat = phys(new MeshPhysicalMaterial({ color: lin(0xf4eee6), roughness: 0.12, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.7, envMap }))
    const backMat = decodeInShader(phys(new MeshPhysicalMaterial({ map: backTex, roughness: 0.35, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 0.5, envMap })))
    disposables.push(edgeMat, backMat)
    const bodyGeo = new CylinderGeometry(1, 1, 0.05, 96, 1), rimGeo = new TorusGeometry(0.992, 0.022, 12, 120)
    disposables.push(bodyGeo, rimGeo)
    for (let i = 0; i < N; i++) {
      const top = phys(new MeshPhysicalMaterial({ map: texs[i], roughness: 0.45, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 0.55, envMap })); tops.push(top); disposables.push(top)
      const body = new Mesh(bodyGeo, [edgeMat, top, backMat])
      const rim = new Mesh(rimGeo, edgeMat); rim.rotation.x = PI / 2; rim.position.y = 0.025
      const inner = new Group(); inner.rotation.order = 'ZXY'; inner.add(body); inner.add(rim)
      const holder = new Group(); holder.add(inner); holder.userData.inner = inner; holder.userData.body = body; scene.add(holder); holders.push(holder)
    }
    // back of the prawns plate: the Maitre d' and their usual
    const rc = document.createElement('canvas'); rc.width = rc.height = 1024; const rx = rc.getContext('2d')
    const recTex = new CanvasTexture(rc); recTex.colorSpace = NoColorSpace; recTex.center.set(0.5, 0.5); recTex.rotation = REC_ROT; recTex.anisotropy = 8; disposables.push(recTex)
    const drawRec = () => {
      if (dead) return
      const serif = getComputedStyle($('h1')).fontFamily, sans = getComputedStyle(root).fontFamily, d = DISHES[USUAL]
      rx.fillStyle = '#fff7ee'; rx.fillRect(0, 0, 1024, 1024)
      rx.strokeStyle = '#ff9932'; rx.lineWidth = 12; rx.beginPath(); rx.arc(512, 512, 452, 0, PI * 2); rx.stroke()
      rx.textAlign = 'center'; rx.textBaseline = 'alphabetic'
      const cap = (s, y, col) => { rx.fillStyle = col; rx.font = '800 34px ' + sans; if ('letterSpacing' in rx) rx.letterSpacing = '4px'; rx.fillText(s, 512, y); if ('letterSpacing' in rx) rx.letterSpacing = '0px' }
      const fit = (s, y, px, max) => { rx.fillStyle = '#11181c'; let f = px; do { rx.font = '400 ' + f + 'px ' + serif; f -= 4 } while (rx.measureText(s).width > max && f > 30); rx.fillText(s, 512, y) }
      cap(fmt('recCap'), 318, '#a84b00'); fit(d.venue, 400, 74, 700)
      rx.fillStyle = 'rgba(17,24,28,.25)'; rx.fillRect(452, 462, 120, 3)
      cap(fmt('recUsual'), 560, '#6e5b4b'); fit(d.name, 690, 124, 720)
      recTex.needsUpdate = true; kick()
    }
    drawRec(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawRec)
    const recMat = decodeInShader(phys(new MeshPhysicalMaterial({ map: recTex, roughness: 0.35, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 0.5, envMap }))); disposables.push(recMat)
    holders[OPEN].userData.body.material = [edgeMat, tops[OPEN], recMat]
    const tTop = phys(new MeshPhysicalMaterial({ map: texs[USUAL], roughness: 0.45, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 0.55, envMap })); disposables.push(tTop)
    const tBody = new Mesh(bodyGeo, [edgeMat, tTop, backMat])
    const tRim = new Mesh(rimGeo, edgeMat); tRim.rotation.x = PI / 2; tRim.position.y = 0.025
    const tInner = new Group(); tInner.rotation.order = 'ZXY'; tInner.add(tBody); tInner.add(tRim)
    twin = new Group(); twin.add(tInner); twin.userData.inner = tInner; twin.visible = false; scene.add(twin)
    setupScribble()
    resize()
    later(() => {
      const pm = new PMREMGenerator(renderer), env = pm.fromEquirectangular(et).texture; et.dispose(); pm.dispose()
      disposables.push(env)
      physMats.forEach((m) => { m.envMap = env; m.needsUpdate = true })
      later(() => {
        const go = () => { if (dead) return; glReady = true; kick() }
        renderer.compileAsync(scene, camera).then(go, go)
      }, 0)
    }, 0)
  }

  // ---- poses per chapter: arrays of N plate poses {p,r,s}, plus plinth scale ----
  const HID = (i) => ({ p: [(i - 2) * 1.2, 3.8, 0], r: [1.2, i, 0], s: 0.001 })
  // conveyor: plate i sits u = i - k places from the front; positive u is to the right, so as k grows plates travel right to left
  function conveyor(k, cy, gap, scale, wrap) {
    const out = []
    for (let i = 0; i < N; i++) {
      const u = wrap ? ((((i - k) % N) + N + N / 2) % N) - N / 2 : i - k, au = Math.min(1, Math.abs(u)), ang = clamp(u, -6, 6) * 0.35, far = Math.abs(u) > 6
      out.push({ p: [Math.sin(ang) * gap * 2.5, cy, 1.5 - (1 - Math.cos(ang)) * gap * 2.6], r: [1.5708 - 0.1 * au, 0, 0], yaw: -ang * 0.85, s: far ? 0.001 : scale * (1 - 0.2 * au) })
    }
    out.front = wrap ? ((Math.round(k) % N) + N) % N : clamp(Math.round(k), 0, N - 1); return out
  }
  const LAYOUT = { c3pair: { cy: 0, s: 0.5, gap: 1.5 }, c5: { cy: 0, s: 0.6, gap: 1.5 }, c3: { cy: 0, s: 0.6, gap: 1.5 }, c2: { cy: 0, s: 0.6, gap: 1.5 }, hero: { cy: -0.6, s: 0.62, gap: 1.85 }, end: { cy: -0.35, s: 0.56, gap: 1.75 }, c1: { cy: -0.5, s: 0.55, gap: 1.75 } }
  function fitGap(topPx, bottomPx, zFront) {
    const H = innerHeight, ppu = H / (2 * Math.tan(15 * PI / 180 * (narrow ? 44 / 30 : 1)) * (8 - zFront))
    const mid = (topPx + bottomPx) / 2, radPx = Math.min((bottomPx - topPx) * 0.42, innerWidth * (narrow ? 0.3 : 0.17))
    const s = radPx / ppu; return { cy: (H / 2 - mid) / ppu, s, gap: s * 2.55 }
  }
  const PAIRX = () => (narrow ? 1.14 : 1.2)
  const ppuNow = () => innerHeight / (2 * Math.tan(15 * PI / 180 * (narrow ? 44 / 30 : 1)) * 6.5)
  function twinTarget() {
    const r = c3.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return null
    const sp = prog(c3), a = reduce ? (sp > 0.5 ? 1 : 0) : sm((sp - 0.5) / 0.18); if (a <= 0) return null
    const P = LAYOUT.c3pair, ppu = ppuNow(), lift = -Math.min(0, c3in.getBoundingClientRect().top) / ppu, off = innerWidth / 2 / ppu + P.s * 1.4
    const c4t = c4el.getBoundingClientRect().top, keep = clamp((c4t - innerHeight * 0.75) / (innerHeight * 0.25), 0, 1); if (keep <= 0.01) return null
    return { p: [P.s * PAIRX() + (1 - a) * off, P.cy + lift, 1.5], r: [1.5708, 0, -0.5 * (1 - a)], s: P.s * keep }
  }
  let twinCur = null
  let C1RUN = 1, C2BLOB = 0.3
  function measure() {
    const h1 = $('.hero h1'), arch = $('.hero .arch')
    LAYOUT.hero = fitGap(h1.offsetTop + h1.offsetHeight + 8, arch.offsetTop - 48, 1.5)   // leave a line for the caption above the arch
    const sub1 = $('.c1 .sub')
    const in1 = $('.c1 .in').getBoundingClientRect().top; LAYOUT.c1 = fitGap(sub1.getBoundingClientRect().bottom - in1 + 10, travel.getBoundingClientRect().top - in1 - 28, 1.5)
    const in2 = c2in.getBoundingClientRect().top, head2 = $('.c2 .head').getBoundingClientRect(), rule2 = $('.c2 .rule').getBoundingClientRect()
    LAYOUT.c2 = fitGap(head2.bottom - in2 + 18, rule2.top - in2 - 22, 1.5)
    $('.c2 .stars').style.top = Math.round((head2.bottom + rule2.top) / 2 - in2 + 4) + 'px'
    // chapter 1 keeps its own pace; its extra length is the stretch chapter 2 opens over
    const vh = innerHeight
    C1RUN = (c1el.offsetHeight - vh) / Math.max(1, c1el.offsetHeight - vh - (-parseFloat(getComputedStyle(c2).marginTop) - vh) - vh)
    C2BLOB = vh / Math.max(1, c2.offsetHeight - vh)
    const in3 = c3in.getBoundingClientRect().top, body3 = $('.c3 .body').getBoundingClientRect(), title3 = $('.c3 .title').getBoundingClientRect()
    // desktop: the plate starts at the top and shrinks only as far as it must to clear the paragraph; phone: it sits under the paragraph
    const bot3 = title3.top - in3 - 64, side3 = innerWidth / 2 - body3.right - 28, top3 = narrow ? body3.bottom - in3 + 20 : 152
    LAYOUT.c3 = fitGap(top3, bot3, 1.5)
    if (!narrow) { const low3 = fitGap(body3.bottom - in3 + 20, bot3, 1.5); LAYOUT.c3.s = Math.min(LAYOUT.c3.s, side3 / ppuNow()); if (low3.s > LAYOUT.c3.s) LAYOUT.c3 = low3 }
    c3cap.style.top = Math.round(bot3 + 14) + 'px'
    LAYOUT.c3pair = fitGap(body3.bottom - in3 + 24, bot3, 1.5); LAYOUT.c3pair.s = Math.min(LAYOUT.c3pair.s, innerWidth * (narrow ? 0.205 : 0.19) / ppuNow())
    const in5 = $('.c5 .in').getBoundingClientRect().top, big5 = $('.c5 .big').getBoundingClientRect(), body5 = $('.c5 .body').getBoundingClientRect(), lab5 = eat.getBoundingClientRect()
    const t5 = (narrow ? big5.bottom : Math.max(big5.bottom, body5.bottom)) - in5 + 18, b5 = (narrow ? body5.top : lab5.top) - in5 - 18
    LAYOUT.c5 = fitGap(t5, b5, 1.5)
    LAYOUT.c5.s = Math.min(LAYOUT.c5.s, innerWidth * (narrow ? 0.17 : 0.2) / ppuNow())   // the pair must fit side by side
    const ask = $('.end .ask'), arch2 = $('.end .arch')
    LAYOUT.end = fitGap(ask.offsetTop + ask.offsetHeight, arch2.offsetTop, 1.5)
    // the plates' still (no WebGL): the regular's usual, where the front plate would sit
    if (noGL) {
      const still = $('.hero .still'), L = LAYOUT.hero, ppu = innerHeight / (2 * Math.tan(15 * PI / 180 * (narrow ? 44 / 30 : 1)) * 6.5), d = Math.round(L.s * ppu * 2)
      still.style.width = still.style.height = d + 'px'; still.style.top = Math.round(innerHeight / 2 - L.cy * ppu - d / 2) + 'px'
    }
  }
  const stepK = (sp) => { const k = sp * (N - 1), st = Math.floor(k), f = k - st; return Math.min(N - 1, st + sm(f * 1.6)) }
  const hidAll = () => { const o = []; for (let i = 0; i < N; i++) o.push(HID(i)); return o }
  const lerpPose = (a, b, t) => { const o = { p: [], r: [], s: a.s + (b.s - a.s) * t }; for (let k = 0; k < 3; k++) { o.p[k] = a.p[k] + (b.p[k] - a.p[k]) * t; o.r[k] = a.r[k] + (b.r[k] - a.r[k]) * t } return o }
  const SCENES = {
    hero: (sp) => { const L = LAYOUT.hero, o = conveyor(stepK(sp), L.cy, L.gap, L.s); o.plinth = 0; return o },
    c1: (sp) => { const L = LAYOUT.c1, o = conveyor(N - 1 + Math.min(1, sp * C1RUN) * (N + 1 + OPEN), L.cy, L.gap, L.s, true); o.plinth = 0; return o },
    // Grail's chapter 02: the ink blob opens, the front plate of the row glides to the middle and the rest fall away
    c2: (sp) => {
      const from = SCENES.c1(1), L = LAYOUT.c2, F = from.front, t = sm((sp - C2BLOB * 0.15) / (C2BLOB * 0.8)), o = []
      for (let i = 0; i < N; i++) {
        const a = from[i], b = i === F ? { p: [0, L.cy, 1.5], r: [1.5708, 0, 0], s: L.s, yaw: 0 } : { p: a.p, r: a.r, s: 0.001, yaw: a.yaw }
        const lp = lerpPose(a, b, t); lp.yaw = (a.yaw || 0) * (1 - t); o.push(lp)
      }
      o.front = F; o.plinth = 0; return o
    },
    // chapter 3: the plate from chapters 1 and 2 stays, now circled
    c3: (sp) => {
      const L = LAYOUT.c3, P = LAYOUT.c3pair, flip = sm((sp - 0.32) / 0.14), pair = sm((sp - 0.5) / 0.18), o = hidAll()
      o[OPEN] = { p: [-P.s * PAIRX() * pair, L.cy + (P.cy - L.cy) * pair, 1.5], r: [1.5708, 0, 0], s: L.s + (P.s - L.s) * pair, yaw: PI * flip }
      o.front = OPEN; return o
    },
    // chapter 4: the card covers chapter 3, so its plates shrink where they stand
    c4: () => SCENES.c3(1).map((p) => ({ p: p.p.slice(), r: p.r.slice(), s: 0.001, yaw: p.yaw })),
    // chapter 5: two plates face off in the space between the question and the Eat / Yeet labels; one flips away
    c5: (sp) => {
      const L = LAYOUT.c5, f = sm((sp - 0.45) / 0.2), x = L.s * (narrow ? 1.35 : 1.95), o = [], top5 = $('.c5 .in').getBoundingClientRect().top, ride = -top5 / ppuNow(), grow = Math.max(0.001, sm(1 - top5 / (innerHeight * 0.35)))   // plates grow in as the chapter settles
      for (let i = 0; i < N; i++) o.push(i === 6 ? { p: [-x, L.cy + ride + 0.28 * L.s * Math.sin(PI * f), 1.5], r: [1.35, 0.3, 0.1], s: L.s * grow * (1 + 0.16 * Math.sin(PI * f)) } : i === 7 ? { p: [x, L.cy + ride - 0.35 * L.s * f, 1.5 - 0.6 * f], r: [1.35 + 0.2 * f, -0.3 * (1 - f), -0.1 * (1 - f)], s: L.s * (1 - 0.25 * f) * grow, yaw: PI * f } : HID(i))
      return o
    },
    cr: hidAll, c6: hidAll, ch: hidAll, cm: hidAll, c7: hidAll,
    c3b: () => SCENES.c4(),
    end: (sp) => { const L = LAYOUT.end, o = conveyor(N * 0.5 + sp * 3, L.cy, L.gap, L.s); o.plinth = 0; return o },
  }
  // after the last chapter: the site footer (or, without one, the screen below the ask) hides the plates
  const footProxy = siteFoot || { classList: { contains: () => false }, getBoundingClientRect: () => { const r = endEl.getBoundingClientRect(); return { top: r.bottom, bottom: r.bottom + innerHeight, height: innerHeight } } }
  const SECTIONS = [[hero, 'hero'], [hsEl, 'cr'], [c1el, 'c1'], [c2, 'c2'], [c3, 'c3'], [c3bEl, 'c3b'], [c4el, 'c4'], [c5, 'c5'], [$('.cr'), 'cr'], [csEl, 'cr'], [$('.c6'), 'c6'], [cmEl, 'cm'], [chEl, 'ch'], [c7el, 'c7'], [endEl, 'end'], [footProxy, 'cr']].map(([el, k]) => ({ el, fn: SCENES[k], key: k }))
  function targetNow() {
    const mid = innerHeight * 0.5
    let cur = 0
    for (let i = 0; i < SECTIONS.length; i++) { const r = SECTIONS[i].el.getBoundingClientRect(); if (r.top <= (SECTIONS[i].key === 'c1' ? 0 : mid)) cur = i }   // chapter 1 takes over only once it is pinned
    const A = SECTIONS[cur], pa = A.fn(prog(A.el)), B = SECTIONS[cur + 1]
    if (B) {
      const top = B.el.getBoundingClientRect().top
      const f = B.key === 'c3' ? sm(1 - top / (innerHeight * 0.45))
        : B.key === 'c1' && A.el.classList.contains('hs') ? sm(1 - top / (innerHeight * 0.14))   /* after the story, the plates return only once chapter 1 has arrived, never across its headline */
          : B.key === 'c4' ? sm((innerHeight - top) / (innerHeight * 0.25)) : sm(1 - (top - mid) / (innerHeight * 0.5))
      if (f > 0) {
        const pb = B.fn(0), out = []
        for (let j = 0; j < N; j++) { const lp = lerpPose(pa[j], pb[j], f); lp.yaw = (pa[j].yaw || 0) + ((pb[j].yaw || 0) - (pa[j].yaw || 0)) * f; out.push(lp) }
        out.plinth = pa.plinth + (pb.plinth - pa.plinth) * f; out.front = pa.front; out.key = A.key; return out
      }
    }
    pa.key = A.key; return pa
  }

  // ---- A24-style interaction: hand-drawn loops round the front plate, a tilt toward the cursor, click to flip ----
  let autoLoop = -1
  const ray = new Raycaster(), ndc = new Vector2(9, 9)
  let hovered = -1, frontIdx = 0, interactive = false
  const flipT = new Array(N).fill(0), flipC = new Array(N).fill(0), yawC = new Array(N).fill(0)
  const SCR = { loops: 2, points: 24, jitter: 0.028, gap: 0.045, pad: 0.06, width: 0.016, sweep: 0.68, sweepJitter: 0.4, fps: 10, in: [0.3, 0.5, 0.72], out: [0.72, 0.5, 0.3] }
  const segs = SCR.points * 3, loops = []
  let scribble = null, scrState = 'hidden', scrStep = 0, scrOwner = -1, scrTimer = 0
  function setupScribble() {
    scribble = new Group()
    const inkMat = new MeshBasicMaterial({ color: lin(0x11181c), side: DoubleSide, depthWrite: false, toneMapped: false }); disposables.push(inkMat)
    for (let l = 0; l < SCR.loops; l++) {
      const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array((segs + 1) * 2 * 3), 3))
      const idx = []; for (let q = 0; q < segs; q++) { const t2 = q * 2; idx.push(t2, t2 + 1, t2 + 2, t2 + 1, t2 + 3, t2 + 2) } g.setIndex(idx)
      const mesh = new Mesh(g, inkMat); mesh.renderOrder = 900; loops.push(g); scribble.add(mesh); disposables.push(g)
    }
    scribble.visible = false
  }
  // one loop: a wobbly ring just outside the rim, drawn as a ribbon that tapers at both ends, in the plate's face plane
  function drawLoop(n, progress) {
    const g = loops[n], pos = g.getAttribute('position'), R = 1 + SCR.pad + n * SCR.gap, hw = SCR.width / 2
    const sweep = clamp(SCR.sweep * (1 + (Math.random() - 0.5) * SCR.sweepJitter), 0.12, 1) * progress, span = PI * 2 * sweep, start = Math.random() * PI * 2
    const wob = []; for (let q = 0; q <= SCR.points; q++) wob.push(1 + (Math.random() - 0.5) * 2 * SCR.jitter)
    for (let e = 0; e <= segs; e++) {
      const t = e / segs, a = start + t * span, f = t * SCR.points * sweep, i0 = Math.floor(f), i1 = Math.min(SCR.points, i0 + 1), m = f - i0, mm = m * m * (3 - 2 * m)
      const w = wob[i0] * (1 - mm) + wob[i1] * mm, taper = Math.min(1, Math.min(t, 1 - t) * 14 + 0.15), r0 = R * w - hw * taper, r1 = R * w + hw * taper
      pos.setXYZ(e * 2, Math.cos(a) * r0, 0.03, Math.sin(a) * r0); pos.setXYZ(e * 2 + 1, Math.cos(a) * r1, 0.03, Math.sin(a) * r1)
    }
    pos.needsUpdate = true; g.computeBoundingSphere()
  }
  const scribbleTo = (p) => { for (let n = 0; n < loops.length; n++) drawLoop(n, p) }
  // ten times a second: draw on in three steps, then keep re-drawing (a hand-animated line), draw off in three steps
  function scribbleTick() {
    scrTimer = 0; if (!scribble) return
    const want = hovered === frontIdx ? hovered : autoLoop
    if (want >= 0) {
      if (scrOwner !== want) { if (scrOwner >= 0) holders[scrOwner].userData.inner.remove(scribble); holders[want].userData.inner.add(scribble); scrOwner = want; scrState = 'in'; scrStep = 0 }
      scribble.visible = true
      if (reduce) { scribbleTo(1); scrState = 'on' }
      else if (scrState === 'in' && scrStep < SCR.in.length) scribbleTo(SCR.in[scrStep++])
      else { scrState = 'on'; scribbleTo(1) }
    } else if (scrState !== 'hidden') {
      if (scrState !== 'out') { scrState = 'out'; scrStep = 0 }
      if (scrStep < SCR.out.length && !reduce) scribbleTo(SCR.out[scrStep++])
      else { scrState = 'hidden'; scribble.visible = false }
    }
    kick()
    if (scrState !== 'hidden' && !(reduce && scrState === 'on')) scrTimer = later(scribbleTick, 1000 / SCR.fps)
  }
  // ---- cursor physics after A24's disc gallery (main.js: wipe push, hover tilt, press, drag-spin) ----
  const CUR = { faceTilt: 0.6, faceDrift: 0.08, faceLift: 0.035, hoverTilt: 0.21, wipePush: 0.012, wipePushMax: 0.5, wipeSpin: 0.009, wipeSpinMax: 0.4, wipeMinSpeed: 9, pushDamping: 4.5, pushReturn: 3.4, pressDepth: 0.55, pressTilt: 1.5, drag: 0.95 * 0.0045, maxSpin: PI }
  const V0 = new Vector3(), V1 = new Vector3()
  const phys = []; for (let i = 0; i < N; i++) phys.push({ lx: 0, ly: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, vrx: 0, vry: 0, sx: 0, sy: 0, sxT: 0, syT: 0, hov: 0 })
  const hitUV = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, lastMove = { t: 0, x: 0, y: 0 }
  let drag = null, suppressClick = false
  const setCursor = (c) => { document.body.style.cursor = c }
  function pick(x, y) {
    if (!ok || !interactive) return -1
    ray.setFromCamera(new Vector2(x, y), camera)
    const list = []; for (let i = 0; i < N; i++) if (holders[i].visible && holders[i].scale.x > 0.05) list.push(holders[i].userData.body)
    const hit = ray.intersectObjects(list, false)[0]
    if (!hit) return -1
    if (hit.uv) { hitUV.x = hit.uv.x * 2 - 1; hitUV.y = hit.uv.y * 2 - 1 } else { hitUV.x = 0; hitUV.y = 0 }
    return holders.findIndex((h) => h.userData.body === hit.object)
  }
  // a fast sweep over a plate shoves it the way the cursor moved and gives it a little spin; it springs back
  function wipe(i) {
    if (reduce || i < 0 || Math.hypot(vel.x, vel.y) < CUR.wipeMinSpeed) return
    const p = phys[i], s = holders[i].scale.x
    p.vx += clamp(vel.x * CUR.wipePush, -CUR.wipePushMax, CUR.wipePushMax) * s; p.vy -= clamp(vel.y * CUR.wipePush, -CUR.wipePushMax, CUR.wipePushMax) * s
    p.vry += clamp(vel.x * CUR.wipeSpin, -CUR.wipeSpinMax, CUR.wipeSpinMax); p.vrx += clamp(vel.y * CUR.wipeSpin, -CUR.wipeSpinMax, CUR.wipeSpinMax)
  }
  // pressing pushes the plate into the table and tips it toward the point you pressed
  function press(i) {
    if (reduce || i < 0) return
    const p = phys[i]; p.vz -= CUR.pressDepth * holders[i].scale.x; p.vry += hitUV.x * CUR.pressTilt; p.vrx -= hitUV.y * CUR.pressTilt
  }
  // past about 80% of the limit, dragging further meets resistance
  const softSpin = (v, d) => { const r = Math.max(0, Math.abs(v) - CUR.maxSpin * 0.8) / CUR.maxSpin, f = 1 / (1 + r * r * 14); return v + d * (Math.sign(d) === Math.sign(v) || v === 0 ? f : 1) }
  const toNdc = (e) => { ndc.x = e.clientX / innerWidth * 2 - 1; ndc.y = -(e.clientY / innerHeight) * 2 + 1 }
  let lastKey = 'hero'
  {
    on(window, 'pointermove', (e) => {
      toNdc(e)
      const now = performance.now(), gap = now - lastMove.t
      if (gap < 120 && lastMove.t) { const k2 = 16.7 / Math.max(8, gap); vel.x = (e.clientX - lastMove.x) * k2; vel.y = (e.clientY - lastMove.y) * k2 } else { vel.x = 0; vel.y = 0 }
      lastMove.t = now; lastMove.x = e.clientX; lastMove.y = e.clientY
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) { drag.moved = true; setCursor('grabbing') }
        if (drag.moved) { const p = phys[drag.i]; p.syT = p.sy = softSpin(p.sy, dx * CUR.drag); p.sxT = p.sx = softSpin(p.sx, dy * CUR.drag) }
      }
      kick()
    }, { passive: true })
    on(document, 'pointerleave', () => { ndc.x = 9; ndc.y = 9; kick() })
    on(window, 'pointerdown', (e) => {
      if (e.button !== 0 || (e.target.closest && e.target.closest('a,button'))) return
      toNdc(e); const h = pick(ndc.x, ndc.y)
      if (h >= 0 && e.pointerType === 'mouse') drag = { i: h, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false }
    })
    on(window, 'pointerup', () => {
      if (!drag) return
      const p = phys[drag.i]
      if (drag.moved) {
        suppressClick = true
        // let go: settle back face-up, or face-down if it was turned past halfway
        const turned = Math.abs(p.sy) > PI / 2; p.syT = turned ? Math.sign(p.sy) * PI : 0; p.sxT = 0
        if (turned) { flipT[drag.i] += p.syT; flipC[drag.i] += p.sy; p.sy = 0; p.syT = 0 }
      }
      drag = null; setCursor(hovered >= 0 ? 'pointer' : ''); kick()
    })
    on(window, 'click', (e) => {
      if (suppressClick) { suppressClick = false; return }
      if (e.target.closest && e.target.closest('a,button')) return
      toNdc(e); const hit = pick(ndc.x, ndc.y); if (hit < 0) return
      press(hit)
      if (hit === frontIdx) flipT[hit] += PI                     // the front plate flips over
      else if (lastKey === 'hero') {                              // another plate comes to the front
        const run = hero.offsetHeight - innerHeight, top = hero.getBoundingClientRect().top + scrollY
        scrollTo({ top: top + run * hit / Math.max(1, N - 1), behavior: reduce ? 'auto' : 'smooth' })
      }
      kick()
    })
  }
  const turn = 0
  function frame(now) {
    raf = 0; if (dead) return
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    let tg = targetNow(), moving = false
    const k = reduce ? 1 : 1 - Math.exp(-dt * 6.5)
    if (!introDone) {
      if (!introStart) introStart = now + 650                     // after the arch has started to rise
      const ip = clamp((now - introStart) / 1700, 0, 1), e = 1 - Math.pow(1 - ip, 3)
      const base = tg
      tg = base.map((p, i) => { const d = clamp(ip * 1.25 - i * 0.06, 0, 1), ed = 1 - Math.pow(1 - d, 3); return { p: [p.p[0] * (0.4 + 0.6 * ed), p.p[1] - 0.6 * (1 - ed), p.p[2] - 14 * (1 - ed)], r: [p.r[0] - 0.9 * (1 - ed), p.r[1] - 1.2 * (1 - ed), p.r[2]], s: p.s } })
      tg.plinth = 0; tg.front = base.front; tg.key = base.key; cur = null
      const fade = (x) => { if (!x) return; x.transparent = true; x.opacity = e }   // a plate still loading has no material yet
      tops.forEach(fade); holders.forEach((h) => h.userData.inner.children.forEach((c) => (Array.isArray(c.material) ? c.material : [c.material]).forEach(fade)))
      if (ip >= 1) { introDone = true; holders.forEach((h) => h.userData.inner.children.forEach((c) => (Array.isArray(c.material) ? c.material : [c.material]).forEach((x) => { if (x) { x.transparent = false; x.opacity = 1 } }))) }
      moving = true
    }
    if (!cur) cur = tg.map((p) => ({ p: p.p.slice(), r: p.r.slice(), s: p.s }))
    for (let i = 0; i < N; i++) {
      for (let a = 0; a < 3; a++) { const dp = tg[i].p[a] - cur[i].p[a], dr = tg[i].r[a] - cur[i].r[a]; cur[i].p[a] += dp * k; cur[i].r[a] += dr * k; if (Math.abs(dp) > 1e-4 || Math.abs(dr) > 1e-4) moving = true }
      const ds = tg[i].s - cur[i].s; cur[i].s += ds * k; if (Math.abs(ds) > 1e-4) moving = true
      const h = holders[i]; h.position.set(cur[i].p[0], cur[i].p[1], cur[i].p[2]); h.scale.setScalar(Math.max(0.001, cur[i].s))
      h.userData.inner.rotation.set(cur[i].r[0], cur[i].r[1], cur[i].r[2]); h.visible = cur[i].s > 0.01
      const dy = (tg[i].yaw || 0) - yawC[i]; yawC[i] += dy * k; if (Math.abs(dy) > 1e-4) moving = true
      const df = flipT[i] - flipC[i]; flipC[i] += df * (reduce ? 1 : 1 - Math.exp(-dt * 7)); if (Math.abs(df) > 1e-3) moving = true
    }
    // cursor: hovered plate tilts toward the pointer; wipes and presses spring back; drags ease home
    frontIdx = tg.front == null ? 0 : tg.front; lastKey = tg.key || lastKey
    interactive = introDone && (tg.key === 'hero' || tg.key === 'end' || tg.key === 'c1' || tg.key === 'c2' || tg.key === 'c3')
    const was = hovered; hovered = drag ? drag.i : pick(ndc.x, ndc.y)
    if (hovered !== was && !drag) { if (hovered >= 0) wipe(hovered); setCursor(hovered >= 0 ? 'pointer' : ''); if (!scrTimer) scribbleTick() }
    const damp = Math.exp(-CUR.pushDamping * dt), ret = Math.min(1, dt * CUR.pushReturn), home = Math.min(1, dt * 3.2)
    for (let i2 = 0; i2 < N; i2++) {
      const p = phys[i2], hv = (i2 === hovered && !reduce) ? 1 : 0, dh = hv - p.hov; p.hov += dh * Math.min(1, dt * 10)
      p.x += p.vx * dt; p.vx *= damp; p.y += p.vy * dt; p.vy *= damp; p.z += p.vz * dt; p.vz *= damp
      p.rx += p.vrx * dt; p.vrx *= damp; p.ry += p.vry * dt; p.vry *= damp
      p.x -= p.x * ret; p.y -= p.y * ret; p.z -= p.z * ret; p.rx -= p.rx * ret; p.ry -= p.ry * ret
      if (!drag || drag.i !== i2) { p.sx += (p.sxT - p.sx) * home; p.sy += (p.syT - p.sy) * home }
      const energy = Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.z) + Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vz) + Math.abs(p.rx) + Math.abs(p.ry) + Math.abs(p.vrx) + Math.abs(p.vry) + Math.abs(dh) + Math.abs(p.sx - p.sxT) + Math.abs(p.sy - p.syT)
      if (energy > 1e-4) moving = true
      const h2 = holders[i2]
      h2.position.x += p.x; h2.position.y += p.y; h2.position.z += p.z
      // where the cursor is on this plate, -1..1 from its centre (projected to the screen)
      let tlx = 0, tly = 0
      if (hv && h2.visible) { V0.copy(h2.position).project(camera); V1.set(h2.position.x + h2.scale.x, h2.position.y, h2.position.z).project(camera); const rad = Math.max(1e-4, Math.abs(V1.x - V0.x)), asp = innerWidth / innerHeight; tlx = clamp((ndc.x - V0.x) / rad, -1, 1); tly = clamp((ndc.y - V0.y) / (rad * asp), -1, 1) }
      const dl = Math.min(1, dt * 9); p.lx += (tlx - p.lx) * dl; p.ly += (tly - p.ly) * dl; if (Math.abs(tlx - p.lx) + Math.abs(tly - p.ly) > 1e-3) moving = true
      // drift a touch toward the cursor and lift slightly, so the tilt reads at this narrow camera angle
      h2.position.x += p.hov * CUR.faceDrift * h2.scale.x * p.lx; h2.position.y += p.hov * CUR.faceDrift * h2.scale.y * p.ly; h2.scale.multiplyScalar(1 + p.hov * CUR.faceLift)
      h2.rotation.x = p.rx + p.sx - p.hov * CUR.faceTilt * p.ly
      h2.rotation.y = yawC[i2] + flipC[i2] + p.ry + p.sy + p.hov * CUR.faceTilt * p.lx + (i2 === 0 ? turn : 0)
    }
    const p3 = prog(c3), al = tg.key === 'c3' && p3 > 0.03 && p3 < 0.31 ? OPEN : -1; if (al !== autoLoop) { autoLoop = al; if (!scrTimer) scribbleTick() }
    if (twin) {
      const tt = twinTarget()
      if (tt) {
        if (!twinCur) twinCur = { p: tt.p.slice(), r: tt.r.slice(), s: tt.s }
        for (let ta = 0; ta < 3; ta++) { const tdp = tt.p[ta] - twinCur.p[ta], tdr = tt.r[ta] - twinCur.r[ta]; twinCur.p[ta] += tdp * k; twinCur.r[ta] += tdr * k; if (Math.abs(tdp) > 1e-4 || Math.abs(tdr) > 1e-4) moving = true }
        twinCur.s += (tt.s - twinCur.s) * k
        twin.position.set(twinCur.p[0], twinCur.p[1], twinCur.p[2]); twin.scale.setScalar(Math.max(0.001, twinCur.s)); twin.userData.inner.rotation.set(twinCur.r[0], twinCur.r[1], twinCur.r[2]); twin.visible = true
      } else { twin.visible = false; twinCur = null }
    }
    renderer.render(scene, camera)
    if (moving) kick()
  }
  function resize() {
    narrow = innerWidth < 820
    if (ok) { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.fov = narrow ? 44 : 30; camera.updateProjectionMatrix() }
    measure(); kick()
  }

  // ---- words that follow the scroll ----
  // chapter 6 reads like an eye moving down the page: each part comes up to full as it reaches the reading line,
  // waits faint and lowered below it, and settles back once read; numbers count up with the scroll as they rise
  const crParts = $$('.cr .big, .cr .step, .focus'), countEls = $$('.cr b[data-n]')
  function countTally() {
    const H = innerHeight, line = H * 0.46
    crParts.forEach((el) => {
      const r = el.getBoundingClientRect(); if (r.bottom < -H || r.top > 2 * H) return
      const d = (r.top + Math.min(r.height, H * 0.3) / 2 - line) / H
      let a, y
      if (reduce) { a = 1; y = 0 }
      else if (d > 0) { const k = clamp(d / 0.34, 0, 1); a = 1 - k * 0.92; y = 46 * k }
      else { const k2 = clamp((-d - 0.12) / 0.3, 0, 1); a = 1 - k2 * 0.6; y = 0 }
      el.style.opacity = a.toFixed(3); el.style.transform = y > 0.2 ? 'translateY(' + y.toFixed(1) + 'px)' : ''
    })
    countEls.forEach((b) => {
      const r = b.getBoundingClientRect(), p = reduce ? 1 : clamp((H * 0.92 - r.top) / (H * 0.44), 0, 1), e = 1 - Math.pow(1 - p, 2)
      const n = Math.round(+b.dataset.n * e), v = b.dataset.s ? fmt('pct', { n }) : String(n); if (b.textContent !== v) b.textContent = v
    })
  }
  // the feed: the server rendered every row (lazy images); here it only runs with the scroll
  const crestImgs = $$('.c4 .crest img'), feedImgs = [...feed.querySelectorAll('img')]
  let crestK = 0
  if (!reduce) { const id = setInterval(() => { if (!c4el.classList.contains('hin')) return; crestImgs[crestK].classList.remove('on'); crestK = (crestK + 1) % crestImgs.length; crestImgs[crestK].classList.add('on') }, 1800); intervals.push(id) }
  let warmTo = -1
  function grailCard() {
    const H = innerHeight, r = c4el.getBoundingClientRect()
    let rot = 0, off = 0
    // a ramp: slower than the scroll at first, then faster and faster until the rows blur; the list never reaches its end
    const box = feed.parentNode.clientHeight, room = feed.scrollHeight - box, q = clamp(Math.max(0, -r.top) / ((c4el.offsetHeight - H) * 1.25), 0, 1)
    const run = room * 0.96 * (reduce ? q : 0.05 * q + 0.95 * Math.pow(q, 3.4)), blur = reduce ? 0 : Math.pow(clamp((q - 0.42) / 0.5, 0, 1), 1.6) * 9
    feed.style.transform = 'translateY(' + (-run).toFixed(1) + 'px)'; feed.style.filter = blur > 0.25 ? 'blur(' + blur.toFixed(2) + 'px)' : ''
    // load the next rows' photos a little before they slide in (lazy images inside a clipped list load late)
    if (r.top < H * 2 && r.bottom > -H) {
      const reach = run + box * 2.5
      for (let i = warmTo + 1; i < feedImgs.length; i++) { const li = feedImgs[i].parentNode; if (li.offsetTop > reach) break; feedImgs[i].loading = 'eager'; warmTo = i }
    }
    if (!reduce) { if (r.top > 0) { off = clamp(r.top / H, 0, 1); rot = 7 * off } else if (r.bottom < H) { off = clamp(1 - r.bottom / H, 0, 1); rot = -7 * off } }
    if (narrow) {
      // phones: no tilt (it clips a narrow screen); the sheet rises straight and the chapter behind sinks back as it is covered
      const cover = r.top > 0 && r.top < H ? 1 - r.top / H : r.top <= 0 ? 1 : 0
      c3bEl.style.setProperty('--k', reduce ? 0 : (cover * cover * (3 - 2 * cover)).toFixed(3))
      c4el.style.transform = !reduce && r.bottom < H && r.bottom > 0 ? 'scale(' + (1 - 0.05 * off).toFixed(4) + ')' : ''
    } else { c3bEl.style.removeProperty('--k'); c4el.style.transform = off > 0.0005 ? 'rotate(' + rot.toFixed(3) + 'deg) scale(' + (1 - 0.16 * off).toFixed(4) + ')' : '' }
    c3in.style.opacity = r.top < H ? clamp(r.top / (H * 0.75), 0, 1).toFixed(3) : ''
    const hr = c4head.getBoundingClientRect(); c4el.classList.toggle('hin', hr.top < H * 0.92 && hr.bottom > 0)
  }
  const dayCells = $$('.days li[data-i]')
  let lastDomY = scrollY
  function slotDays() {
    const down = scrollY >= lastDomY; lastDomY = scrollY
    dayCells.forEach((li) => {
      if (li.classList.contains('slot')) return
      const r = li.getBoundingClientRect(); if (r.top > innerHeight * 0.88 || r.bottom < 0) return
      if (!down || reduce || r.bottom < innerHeight * 0.3) li.classList.add('slotnow')   // coming back up (or already past): just be there
      li.classList.add('slot')
    })
  }
  // badges and labels land in as you scroll down; scrolling back up they are just there
  const landers = $$('.c5 .lab')
  let lastLandY = scrollY
  function landAll() {
    const down = scrollY >= lastLandY; lastLandY = scrollY
    landers.forEach((el) => {
      if (el.classList.contains('landed')) return
      const r = el.getBoundingClientRect(); if (r.top > innerHeight * 0.9 || r.bottom < 0) return
      if (!down || reduce) el.classList.add('landnow')
      el.classList.add('landed')
    })
  }

  // ---- chapter 8: the globe (./globe.js), loaded as it comes near ----
  let globe = null, globeLoading = false, pinsWarm = false
  // Devon, 27 Nov 2026: pins should show already loaded. About four screens before the globe, fetch
  // every pin photo (12 at a time, CDN-cached) so globe.js finds them in the browser cache.
  function warmPins() {
    pinsWarm = true
    const urls = data.pins.map((p) => p[2]).filter(Boolean)
    let i = 0, active = 0
    const next = () => { while (active < 12 && i < urls.length && !dead) { const im = new Image(); active++; im.onload = im.onerror = () => { active--; next() }; im.src = urls[i++] } }
    next()
  }
  function mapFrame() {
    if (globe) { globe.frame(); return }
    if (globeLoading) return
    const r = cmEl.getBoundingClientRect()
    if (!pinsWarm && !reduce && r.top < innerHeight * 4) warmPins()
    const near = r.bottom > -innerHeight * 0.5 && r.top < innerHeight * 1.6
    if (!near) return
    globeLoading = true
    import('./globe.js').then((m) => {
      if (dead) return
      globe = m.mountGlobe(cmEl, gEl, { pins: data.pins, assets: data.assets, reduce, narrow: () => narrow })
      globe.frame()
    }).catch((err) => console.error('globe failed to load', err))
  }

  // chapter 9: each Maitre d' badge stamps in at its own point in the scroll, and lifts off again on the way back up
  const stickers = $$('.c7 .sticker'), STAMP = [0.1, 0.28, 0.46, 0.64]
  function stampBadges() { const sp = prog(c7el); stickers.forEach((s, i) => { const v = reduce || sp >= STAMP[i]; if (v !== s.classList.contains('landed')) s.classList.toggle('landed', v) }) }

  // ---- the post flow: one phone on a three.js CSS3D stage (real DOM, so text stays sharp) ----
  let ch3 = null
  const chCaps = $$('.ch3cap')
  let chCap = 0
  function ch3Init() {
    const stage = $('#ch3stage'), R = new CSS3DRenderer(), S = new Scene(), C = new PerspectiveCamera(38, 1, 1, 6000)
    stage.appendChild(R.domElement)
    const el = $('#flowphone'), home = el.parentNode, o = new CSS3DObject(el); S.add(o)
    ch3 = { R, S, C, stage, objs: [o], w: 0, h: 0, el, home }
    ch3Frame()
  }
  function ch3Frame() {
    const g = ch3; if (!g) return
    const r = chEl.getBoundingClientRect(), H = innerHeight; if (r.bottom < -H || r.top > H * 1.5) return
    const w = g.stage.clientWidth, h = g.stage.clientHeight
    if (w !== g.w || h !== g.h) { g.w = w; g.h = h; g.R.setSize(w, h); g.C.aspect = w / h; g.C.updateProjectionMatrix() }
    // camera distance so a phone fills about 58% of the height (half that across on phones)
    const fit = Math.min(h * 0.52 / 844, w * (narrow ? 0.56 : 0.3) / 390), drop = h * (narrow ? 0.035 : 0.03), dist = (h / 2) / Math.tan(19 * PI / 180)
    g.C.position.set(0, 0, dist); g.C.lookAt(0, 0, 0)
    const p = clamp(-r.top / (chEl.offsetHeight - H), 0, 1)
    const rise = reduce ? 1 : sm(p / 0.16)
    // one phone in 3D: it rises from flat, then sways gently while the post plays out on its screen
    const o = g.objs[0], yaw = reduce ? 0 : Math.sin(p * PI * 1.6) * 0.16 * rise, tilt = (1 - rise) * 1.25
    o.position.set(0, -(1 - rise) * 260 * fit * 2 - drop, -(1 - rise) * 600); o.rotation.set(-tilt + 0.04 * rise, yaw, 0); o.scale.setScalar(fit)
    o.element.style.opacity = (0.25 + 0.75 * rise).toFixed(3)
    const q = reduce ? 1 : clamp((p - 0.1) / 0.8, 0, 1)
    flowPlay(q)
    let c = -1
    if (q < 0.16) c = 0; else if (q < 0.44) c = 1; else if (q < 0.74) c = 2
    if (c !== chCap) { chCap = c; chCaps.forEach((el, k) => el.classList.toggle('on', k === c)) }
    g.R.render(g.S, g.C)
  }
  // the post, start to finish: [time, state classes, tap target]
  const FLOW = { phone: null, touch: null, lastQ: 1, hold: null, capDone: false }
  const STEPS = [
    { t: 0.00, s: '', at: 'tile' }, { t: 0.05, s: '', at: 'tile', tap: true }, { t: 0.07, s: 's-tile', at: 'cont' },
    { t: 0.12, s: 's-tile', at: 'cont', tap: true }, { t: 0.14, s: 's-comp', at: 'place' }, { t: 0.20, s: 's-comp', at: 'place', tap: true },
    { t: 0.22, s: 's-comp s-sheet', at: null }, { t: 0.25, s: 's-comp s-sheet s-search', at: null, type: 'q' }, { t: 0.33, s: 's-comp s-sheet s-search', at: 'ksk' },
    { t: 0.37, s: 's-comp s-sheet s-search', at: 'ksk', tap: true }, { t: 0.40, s: 's-comp s-placed', at: 'chip' }, { t: 0.47, s: 's-comp s-placed', at: 'chip', tap: true },
    { t: 0.49, s: 's-comp s-placed s-typing', at: 'cap' }, { t: 0.66, s: 's-comp s-placed s-typing', at: 'save' }, { t: 0.72, s: 's-comp s-placed s-typing', at: 'save', tap: true },
    { t: 0.74, s: 's-comp s-placed s-typing s-saving', at: null }, { t: 0.79, s: 's-comp s-placed s-typing s-saving s-saved', at: 'eoy' }, { t: 1.01, s: 's-comp s-placed s-typing s-saving s-saved', at: 'eoy' },
  ]
  const QUERY = fmt('query'), CAPMARK = fmt('capMark'), CAPREST = fmt('capRest')
  function posIn(el, rootEl) { let x = el.offsetWidth / 2, y = el.offsetHeight / 2; while (el && el !== rootEl) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent } return [x, y] }
  // the hold: tap 260 ms, the dish pops in, the rest types at 55 ms a letter, a short beat, then the page scrolls again
  const HOLD = { tap: 260, type: 560, per: 55 }; HOLD.end = HOLD.type + CAPREST.length * HOLD.per + 420
  let PAGEHOLD = null   // {y, until}: the usual-shows swipe holds the page too
  function heldY() { if (FLOW.hold) return FLOW.hold.y; if (PAGEHOLD && performance.now() < PAGEHOLD.until) return PAGEHOLD.y; PAGEHOLD = null; return null }
  const stopEv = (e) => { if (heldY() !== null) e.preventDefault() }
  const stopKey = (e) => { if (heldY() !== null && /^(ArrowDown|ArrowUp|PageDown|PageUp|Space| |End|Home)$/.test(e.key)) e.preventDefault() }
  const pinScroll = () => { if (SNAP.active) return; const y = heldY(); if (y !== null && Math.abs(scrollY - y) > 1) scrollTo(0, y) }
  // ---- magnetic stops: when the scroll comes to rest near an aha moment, it eases onto it and pauses there.
  // Same idea as GSAP ScrollTrigger snap { snapTo: 'labelsDirectional', delay }: only after scrolling stops,
  // only toward the next moment in the direction you were going, and never fighting a hand that is still scrolling.
  const SNAP = { active: false, target: 0, dir: 1, lastY: scrollY, idle: 0, touching: false }
  const secY = (el, p) => { if (!el) return null; const top = el.getBoundingClientRect().top + scrollY, run = el.offsetHeight - innerHeight; return top + p * Math.max(0, run) }
  // layout position, ignoring the reveal transforms that slide text in (a moving target would make the snap miss)
  const docTop = (e) => { let y = 0; while (e) { y += e.offsetTop; e = e.offsetParent } return y }
  const elY = (e, at) => (e ? docTop(e) + e.offsetHeight / 2 - innerHeight * at : null)
  const storyStatic = () => reduce || hsEl.classList.contains('is-static')
  const STOPS = [
    () => (storyStatic() ? null : secY(hsEl, 0.76)),                    // the story: "Chicken, please."
    () => (storyStatic() ? null : secY(hsEl, 0.95)),                    // the story: that's the gap
    () => secY(c3, 0.74),                                               // the regular's card with their dish beside it
    () => elY(c3bEl.querySelectorAll('.earnsteps .step')[2], 0.5),      // crowned on a clear lead
    () => { const d = $('.c3b .dwell'), s = $('.c3b .usualstep'); if (!d || !s) return null; return d.getBoundingClientRect().top + scrollY - s.offsetHeight - innerHeight * 0.45 },   // your usual shows
    () => secY(c5, 0.1),                                                // Eat or Yeet: both meals, your call
    () => secY(c5, 0.8),                                                // Eat picked
    () => elY($('.cr .pct'), 0.5),                                      // 80%
    () => secY(csEl, 0.84),                                             // #1 lands
    () => secY(cmEl, 0.8),                                              // the globe, every pin out
    () => secY(chEl, 0.78),                                             // saved to your diary
    () => secY(c7el, 0.72),                                             // every Maitre d' badge stamped
    () => secY(endEl, 0),
  ]
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const snapCancel = () => { SNAP.active = false }
  function snapCheck() {
    if (reduce || SNAP.active || SNAP.touching || heldY() !== null) return
    const H = innerHeight, y = scrollY
    let ahead = null, ad = 1e9, back = null, bk = 1e9
    STOPS.forEach((f) => {
      const t = f(); if (t === null || !isFinite(t)) return; const d = (t - y) * SNAP.dir
      // labelsDirectional: the next moment in the direction of travel, up to 35% of a screen away;
      // a moment you only just passed (8%) pulls you back instead
      if (d >= 0 && d < H * 0.35 && d < ad) { ad = d; ahead = t }
      if (d < 0 && -d < H * 0.08 && -d < bk) { bk = -d; back = t }
    })
    let best = ahead !== null ? ahead : back, bd = best === null ? 0 : Math.abs(best - y), slow = false
    // Eat or Yeet is two steps: resting anywhere between them carries you on to the next one (or back), slowly enough to watch the pick
    const e1 = secY(c5, 0.1), e2 = secY(c5, 0.8)
    if (y > e1 + 2 && y < e2 - 2) { best = SNAP.dir > 0 ? e2 : e1; bd = Math.abs(best - y); slow = true }
    if (best === null || bd < 3) return
    const y0 = y, dist = best - y0, dur = slow ? 1100 : clamp(Math.abs(dist) * 1.1, 380, 820), t0 = performance.now()
    SNAP.active = true; SNAP.target = best
    const step = () => {
      if (!SNAP.active) return
      const k = clamp((performance.now() - t0) / dur, 0, 1); scrollTo(0, y0 + dist * ease(k))
      if (k < 1) { nextFrame(step); return }
      SNAP.active = false
      // land and pause: swallow the tail of a trackpad flick for a beat so the moment registers
      if (!PAGEHOLD || performance.now() > PAGEHOLD.until) PAGEHOLD = { y: best, until: performance.now() + 650 }; else PAGEHOLD.y = best
    }
    step()
  }
  on(window, 'scroll', () => {
    const y = scrollY; if (Math.abs(y - SNAP.lastY) > 0.5 && !SNAP.active) SNAP.dir = y > SNAP.lastY ? 1 : -1; SNAP.lastY = y
    unlater(SNAP.idle); SNAP.idle = later(snapCheck, 170)
  }, { passive: true })
  // a hand on the wheel, keys or screen always wins over a snap in progress
  ;['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => on(window, ev, () => { if (ev === 'touchstart') SNAP.touching = true; if (SNAP.active && heldY() === null) snapCancel() }, { passive: true }))
  on(window, 'touchend', () => { SNAP.touching = false; unlater(SNAP.idle); SNAP.idle = later(snapCheck, 220) }, { passive: true })
  on(window, 'wheel', stopEv, { passive: false }); on(window, 'touchmove', stopEv, { passive: false })
  on(window, 'keydown', stopKey); on(window, 'scroll', pinScroll, { passive: true })
  function holdStart() {
    snapCancel(); FLOW.hold = { t0: performance.now(), y: scrollY }
    const tick = () => {
      if (!FLOW.hold) return
      if (performance.now() - FLOW.hold.t0 >= HOLD.end) { FLOW.hold = null; FLOW.capDone = true; FLOW.lastQ = 0.47; flowPlay(0.47); later(snapCheck, 60); return }
      flowPlay(FLOW.lastQ); nextFrame(tick)
    }
    tick()
  }
  const flowEls = {}
  function flowPlay(q) {
    const ph = FLOW.phone || (FLOW.phone = $('#flowphone') || (ch3 && ch3.el)); if (!ph) return
    const touch = FLOW.touch || (FLOW.touch = ph.querySelector('.ftouch'))
    if (!flowEls.qt) { flowEls.qt = ph.querySelector('.qt'); flowEls.mk = ph.querySelector('.pcap mark'); flowEls.rest = ph.querySelector('.pcap .rest'); flowEls.save = ph.querySelector('.fcomp .pprimary .sl') }
    let i = 0; while (i < STEPS.length - 1 && STEPS[i + 1].t <= q) i++
    let s = STEPS[i], n = STEPS[i + 1] || s
    // reaching the chip tap on the way down holds the scroll until the order has animated in
    if (!reduce && !FLOW.hold && !FLOW.capDone && q >= 0.47 && q < 0.6 && FLOW.lastQ < 0.47) holdStart()
    if (q < 0.44 && !FLOW.hold) FLOW.capDone = false; if (q >= 0.6 && !FLOW.hold) FLOW.capDone = true
    if (reduce) FLOW.capDone = true
    if (!FLOW.hold) FLOW.lastQ = q
    if (FLOW.hold) {
      const he = performance.now() - FLOW.hold.t0, tapping = he < HOLD.tap
      s = { s: 's-comp s-placed' + (tapping ? '' : ' s-typing'), at: tapping ? 'chip' : 'cap', tap: tapping }; n = s
    } else if (FLOW.capDone && q >= 0.47 && q < 0.49) { s = { s: 's-comp s-placed s-typing', at: 'cap' } }
    const cls = 'phone flow ' + s.s; if (ph.className !== cls) ph.className = cls
    // typing, character by character across the step's span
    const span = clamp((q - s.t) / Math.max(0.001, n.t - s.t), 0, 1)
    const { qt, mk, rest, save } = flowEls
    const qn = q < 0.25 ? 0 : q >= 0.33 ? QUERY.length : Math.round(QUERY.length * (q - 0.25) / 0.06); if (qt.textContent !== QUERY.slice(0, qn)) qt.textContent = QUERY.slice(0, qn)
    const hold = FLOW.hold, el = hold ? performance.now() - hold.t0 : 0
    let markOn, rn
    if (hold) {   // held: the order plays in on its own clock while the page waits
      markOn = el > HOLD.tap; rn = clamp(Math.floor((el - HOLD.type) / HOLD.per), 0, CAPREST.length)
    } else { const done = FLOW.capDone && q >= 0.47; markOn = done; rn = done ? CAPREST.length : 0 }
    if (mk.textContent !== (markOn ? CAPMARK : '')) { mk.textContent = markOn ? CAPMARK : ''; mk.classList.toggle('pop', !!(markOn && hold)) }
    if (rest.textContent !== CAPREST.slice(0, rn)) rest.textContent = CAPREST.slice(0, rn)
    const saving = /s-saving/.test(s.s) ? fmt('saving') : fmt('save'); if (save.textContent !== saving) save.textContent = saving
    // the fingertip glides to the next target and presses on taps
    const from = s.at && ph.querySelector('[data-f="' + s.at + '"]'), to = n.at && ph.querySelector('[data-f="' + n.at + '"]')
    ph.querySelectorAll('.press').forEach((x) => x.classList.remove('press'))
    if (from) {
      const a = posIn(from, ph), b = to ? posIn(to, ph) : a, k = s.tap ? 0 : sm(span)
      const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k
      touch.style.left = x.toFixed(1) + 'px'; touch.style.top = y.toFixed(1) + 'px'; touch.classList.add('on')
      touch.classList.toggle('down', !!s.tap); if (s.tap) from.classList.add('press')
    } else { touch.classList.remove('on', 'down') }
  }
  function chFrame() {
    const r = chEl.getBoundingClientRect(); if (r.bottom < -innerHeight || r.top > innerHeight * 2) return
    if (!ch3) { ch3Init(); return } ch3Frame()
  }

  // ---- chapter 3 continued: you climb the regulars as you read, and the last step crowns you ----
  const rlist = $('#rlist'), RIVALS = [{ k: 'J', d: 14 }, { k: 'S', d: 11 }, { k: 'M', d: 9 }, { k: 'h4', d: 8 }, { k: 'h5', d: 6 }, { k: 'h6', d: 4 }]
  const earnSteps = [...c3bEl.querySelectorAll('.earnsteps .step')]
  let lastLead = '', lastYouRank = 0
  function climbFrame() {
    if (!rlist) return
    const r = c3bEl.getBoundingClientRect(), H = innerHeight; if (r.bottom < 0 || r.top > H) return
    // your days rise from 3 to 15 while you read the steps; 15 beats the holder's 14 (a tie keeps the holder)
    // progress follows the reading: 0 when the first step enters at 85% of the screen, 1 when "Take a clear lead" reaches 60%
    const a0 = earnSteps[0].getBoundingClientRect().top, aL = earnSteps[2].getBoundingClientRect().top, aN = earnSteps[3].getBoundingClientRect().top
    const q = reduce ? 1 : clamp((H * 0.85 - a0) / Math.max(1, (aL - a0) + H * 0.25), 0, 1), you = Math.round(3 + 12 * sm(q))
    setUsual(reduce || aN < H * 0.6)
    const all = RIVALS.concat([{ k: 'Y', d: you }]).sort((a, b) => b.d - a.d || (a.k === 'Y' ? 1 : b.k === 'Y' ? -1 : 0))
    const rank = {}; all.forEach((p, i) => { rank[p.k] = i + 1 })
    const shown = rank.Y <= 4 ? all.slice(0, 4) : all.slice(0, 3).concat([{ k: 'Y', d: you }])
    ;[...rlist.children].forEach((row) => {
      const k = row.dataset.k
      let slot = -1; shown.forEach((p, i) => { if (p.k === k) slot = i })
      row.classList.toggle('out', slot < 0); if (slot < 0) return
      row.style.transform = 'translateY(' + (slot * 52) + 'px)'
      const d = k === 'Y' ? you : RIVALS.filter((p) => p.k === k)[0].d
      const rk = String(rank[k]), dl = fmt(d === 1 ? 'day' : 'days', { n: d })
      if (row.children[0].textContent !== rk) row.children[0].textContent = rk
      if (row.children[3].textContent !== dl) row.children[3].textContent = dl
    })
    const lead = all[0].k
    if (lead !== lastLead) {
      if (lastLead && lead === 'Y') kick1(rlist.querySelector('[data-k="' + lastLead + '"]'), 'bump')
      lastLead = lead; [...rlist.children].forEach((row) => row.classList.toggle('lead', row.dataset.k === lead))
    }
    if (lastYouRank && rank.Y < lastYouRank) kick1(rlist.querySelector('[data-k="Y"]'), 'leap')
    lastYouRank = rank.Y
  }
  // restart a one-shot animation class
  function kick1(el, c) { if (!el || reduce) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); later(() => el.classList.remove(c), 900) }
  const regcard = $('#regcard'), rview = regcard && regcard.querySelector('.rview')
  let isUsual = null
  function fitView() { if (!rview) return; const pg = regcard.querySelector(isUsual ? '.rec' : '.regs'); rview.style.height = pg.offsetHeight + 'px' }
  function setUsual(v) {
    if (!regcard || v === isUsual) return
    const first = isUsual === null; isUsual = v
    regcard.classList.toggle('usual', v); const dots = regcard.querySelectorAll('.rdots i'); dots[0].classList.toggle('on', v); dots[1].classList.toggle('on', !v)
    fitView(); if (!first) kick1(rview, 'jig')
    // on the way down, hold the page until the crown has slammed onto your usual (1.8 s of motion)
    if (v && !first && !reduce) { PAGEHOLD = { y: SNAP.active ? SNAP.target : scrollY, until: performance.now() + 1900 }; later(snapCheck, 1950) }   // then finish onto the moment
  }
  on(window, 'resize', fitView)

  // ---- chapter 7: live standings, counted down from 10th to 1st ----
  let shownK = -1
  board.querySelectorAll('.pc').forEach((el) => { el.textContent = fmt('pct', { n: 0 }) })
  function countPct(el, v) {
    const n = +el.dataset.n
    if (!v || reduce) { el.textContent = fmt('pct', { n: v ? n : 0 }); return }
    const t0 = performance.now()
    const f = () => { const k = clamp((performance.now() - t0) / 750, 0, 1), x = Math.round(n * (1 - Math.pow(1 - k, 3))); el.textContent = fmt('pct', { n: x }); if (k < 1 && el.parentNode.parentNode.classList.contains('on')) nextFrame(f) }
    f()
  }
  function boardFrame() {
    const r = csEl.getBoundingClientRect(), H = innerHeight; if (r.bottom < 0 || r.top > H) return
    // ten reveals over the first 75% of the pinned scroll, then #1 holds the screen
    const p = clamp(-r.top / Math.max(1, r.height - H), 0, 1), k = reduce ? 10 : Math.min(10, Math.floor(clamp((p - 0.04) / 0.72, 0, 1) * 10 + (p > 0.04 ? 1 : 0)))
    if (k === shownK) return; shownK = k
    ;[...board.children].forEach((li) => {
      const v = +li.dataset.r >= 11 - k, was = li.classList.contains('on'); if (v === was) return
      li.classList.toggle('on', v); countPct(li.querySelector('.pc'), v)
      if (v && li.classList.contains('first') && !reduce) { board.classList.remove('jolt'); void board.offsetWidth; board.classList.add('jolt') }
    })
  }

  // ---- the story: the real-time menu scene (./menu-story.js), mounted as it comes within a screen ----
  let story = null, storyLoading = false
  const storyIO = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting) || storyLoading) return
    storyLoading = true; storyIO.disconnect()
    const stage = hsEl.querySelector('.s3-stage'), poster = data.assets.storyMenu + 'poster.jpg'
    if (!reduce) stage.style.backgroundImage = 'url(' + poster + ')'   // the still, until the scene has drawn
    import('./menu-story.js').then((m) => m.mountMenuStory(hsEl, { assets: data.assets.storyMenu, version: data.assets.version }))
      .then((api) => { if (dead) { if (api) api.destroy(); return } story = api; if (api) stage.style.backgroundImage = ''; kick() })
      .catch((err) => console.error('menu story failed to load', err))
  }, { rootMargin: '100% 0px' })
  storyIO.observe(hsEl)

  // the shared header reads which part of the home is in the middle of the screen (its nav dot)
  const NAVKEY = { hero: '', c1: 'app', c2: 'app', c3: 'md', c3b: 'md', c4: 'app', c5: 'app', cr: 'app', cs: 'app', c6: 'app', cm: 'app', ch: 'app', c7: 'rest', s3: '', end: 'get' }
  const navSections = $$(':scope > section, :scope > footer')
  let navKey = null
  function navTrack() {
    const H2 = innerHeight * 0.45
    let k = ''
    navSections.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= H2 && r.bottom > H2) k = NAVKEY[s.classList[0]] || '' })
    if (k !== navKey) { navKey = k; document.documentElement.dataset.homeSection = k }
  }

  function dom() {
    if (dead) return
    boardFrame()
    climbFrame()
    chFrame()
    stampBadges()
    mapFrame()
    landAll()
    slotDays()
    countTally(); grailCard()
    navTrack()
    const hp = prog(hero)
    ringEl.style.transform = 'rotate(' + (-hp * 110) + 'deg)'
    ring2.style.transform = 'rotate(' + (-prog(endEl) * 80) + 'deg)'
    // the line wraps by one phrase, so another copy is always coming in from the right and it never runs out
    const ph = travel.firstElementChild.offsetWidth, c1s = scrollY - (c1el.getBoundingClientRect().top + scrollY) + innerHeight, mv = c1s * 0.7
    if (ph) travel.style.transform = 'translateX(' + (-(((mv % ph) + ph) % ph)).toFixed(1) + 'px)'
    const f0 = clamp(Math.round(stepK(hp)), 0, N - 1), cap = fmt('caption', { name: DISHES[f0].name, venue: DISHES[f0].venue }); if (pill.textContent !== cap) pill.textContent = cap
    const c3c = fmt('caption', { name: DISHES[prog(c3) > 0.5 ? USUAL : OPEN].name, venue: DISHES[prog(c3) > 0.5 ? USUAL : OPEN].venue }); if (c3cap.textContent !== c3c) c3cap.textContent = c3c
    // chapter 2 opens as an ink blob over chapter 1, then chapter 3 is dealt over it on a tilt
    const r2 = c2.getBoundingClientRect(), bl = reduce ? (r2.top <= 0 ? 1 : 0) : clamp(-r2.top / (innerHeight * 0.85), 0, 1)
    c2in.style.setProperty('--b', (bl * bl * (3 - 2 * bl)).toFixed(4)); c2in.classList.toggle('full', bl >= 1)
    c2.classList.toggle('on', bl > 0.55)
    const e3 = clamp(1 - c3.getBoundingClientRect().top / innerHeight, 0, 1), k3 = 1 - (reduce ? 1 : e3 * e3 * (3 - 2 * e3))
    c3in.style.transform = k3 > 0.001 ? 'rotate(' + (3.2 * k3).toFixed(3) + 'deg)' : ''
    c3in.style.borderRadius = k3 > 0.001 ? (28 * k3).toFixed(1) + 'px ' + (28 * k3).toFixed(1) + 'px 0 0' : ''
    c2in.style.opacity = (1 - 0.45 * e3).toFixed(3)
    const won = prog(c5) > 0.55   /* the flip runs 0.45-0.65; Eat wins at its midpoint */
    eat.classList.toggle('win', won); yeet.classList.toggle('lose', won)
  }
  let ticking = false
  on(window, 'scroll', () => { if (!ticking) { ticking = true; nextFrame(() => { ticking = false; dom(); kick() }) } }, { passive: true })
  on(window, 'resize', () => { resize(); dom() })
  // first layout pass, then the plates, each in its own task
  later(() => { resize(); dom() }, 0)
  later(setupGL, 0)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!dead) { resize(); dom() } })

  return {
    destroy() {
      if (dead) return
      dead = true
      undo.forEach((f) => f()); undo.length = 0
      timers.forEach((id) => clearTimeout(id)); timers.clear()
      frames.forEach((id) => cancelAnimationFrame(id)); frames.clear()
      intervals.forEach((id) => clearInterval(id))
      if (raf) cancelAnimationFrame(raf)
      storyIO.disconnect()
      if (story) story.destroy()
      if (globe) globe.destroy()
      if (ch3) { ch3.home.appendChild(ch3.el); ch3.el.removeAttribute('style'); ch3.R.domElement.remove() }
      if (ok) { disposables.forEach((d) => d.dispose && d.dispose()); renderer.dispose(); renderer.forceContextLoss() }
      setCursor('')
      delete document.documentElement.dataset.homeSection
      root.classList.remove('no-gl')
    },
  }
}
