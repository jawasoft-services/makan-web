// RM20773: chapter 8's globe, our own three.js layer in place of the prototype's globe.gl (MIT, loaded
// from a CDN, which the site's CSP does not allow). It rebuilds what the prototype showed: the day-map
// earth with its bump map, the pale blue atmosphere, a photo pin per public venue with a meal, faint
// dashed pins over big cities with no meal yet, the camera that starts close over London and turns east
// as it pulls back, and a free spin (drag, slow auto-rotate) at the end of the chapter.
// The scroll logic (glUpdate, mapFrame) is the prototype's, line for line.
import { AdditiveBlending, AmbientLight, BackSide, Color, DirectionalLight, Mesh, MeshPhongMaterial, PerspectiveCamera, SRGBColorSpace, Scene, ShaderMaterial, SphereGeometry, TextureLoader, Vector3, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const R = 100   // globe.gl's globe radius
const DEG = Math.PI / 180
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t) }
// big cities shown as open seats when no meal is pinned near them (the prototype's list)
const GHOSTS = [[35.68, 139.69], [37.57, 126.98], [13.76, 100.5], [25.03, 121.57], [31.23, 121.47], [39.9, 116.41], [10.82, 106.63], [3.14, 101.69], [14.6, 120.98], [19.08, 72.88], [28.61, 77.21], [25.2, 55.27], [41.01, 28.98], [32.09, 34.78], [30.04, 31.24], [31.63, -8.01], [6.52, 3.38], [-33.92, 18.42], [38.72, -9.14], [41.39, 2.17], [41.9, 12.5], [52.52, 13.4], [48.21, 16.37], [37.98, 23.73], [34.05, -118.24], [37.77, -122.42], [41.88, -87.63], [19.43, -99.13], [-23.55, -46.63], [-34.6, -58.38], [4.71, -74.07], [43.65, -79.38], [-33.87, 151.21], [-36.85, 174.76]]
const LONDON = { lat: 51.51, lng: -0.13 }, ENDV = { lat: 32, lng: 58 }
// pin photos load as pins come into view, a few at a time (they are /api/thumb resizes)
const MAX_LOADING = 6

function angDist(a, b) { const s = Math.sin(a.lat * DEG) * Math.sin(b.lat * DEG) + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.cos((a.lng - b.lng) * DEG); return Math.acos(clamp(s, -1, 1)) }
// three-globe's polar2Cartesian
function toXYZ(lat, lng, alt, out) {
  const phi = (90 - lat) * DEG, theta = (90 - lng) * DEG, r = R * (1 + alt)
  return out.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
}

// globe.gl's atmosphere: a back-faced shell a little larger than the earth, brightest at the rim
const ATM_VERT = `varying vec3 vNormal; varying vec3 vPos;
void main(){ vNormal = normalize(normalMatrix * normal); vPos = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const ATM_FRAG = `uniform vec3 color; uniform float coefficient; uniform float power; varying vec3 vNormal; varying vec3 vPos;
void main(){ vec3 v = normalize((viewMatrix * vec4(vPos - cameraPosition, 0.0)).xyz); float k = pow(max(coefficient + dot(vNormal, v), 0.0), power); gl_FragColor = vec4(color, k); }`

/**
 * @param {HTMLElement} cmEl the .cm section
 * @param {HTMLElement} gEl the #globe box
 * @param {{ pins: [number, number, string][], assets: { earth: string, bump: string }, reduce: boolean, narrow: () => boolean }} opts
 */
export function mountGlobe(cmEl, gEl, opts) {
  const { reduce } = opts
  let renderer
  try {
    const canvas = document.createElement('canvas'), context = canvas.getContext('webgl2', { antialias: true, alpha: true })
    if (!context) return { frame() {}, destroy() {} }
    renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true })
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2')
  } catch {
    if (renderer) renderer.dispose()
    return { frame() {}, destroy() {} }
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  gEl.appendChild(renderer.domElement)
  const pinsBox = document.createElement('div'); pinsBox.className = 'gpins'; gEl.appendChild(pinsBox)

  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, R * 100)
  scene.add(new AmbientLight(0xcccccc, Math.PI))
  const sun = new DirectionalLight(0xffffff, 0.6 * Math.PI); sun.position.set(0, 1, 0); scene.add(sun)

  const loader = new TextureLoader()
  const narrow0 = opts.narrow()
  const earthUrl = narrow0 ? opts.assets.earth.replace(/-2048\.jpg$/, '-1024.jpg') : opts.assets.earth
  let ready = 0
  const markReady = () => { if (++ready === 2) { gEl.classList.add('live'); dirty = true } }
  const earth = loader.load(earthUrl, markReady); earth.colorSpace = SRGBColorSpace; earth.anisotropy = 4
  const bump = loader.load(opts.assets.bump, markReady)
  const globeGeo = new SphereGeometry(R, 75, 75)
  const globeMat = new MeshPhongMaterial({ map: earth, bumpMap: bump, bumpScale: 6, shininess: 8 })
  const globeObj = new Mesh(globeGeo, globeMat); globeObj.rotation.y = -Math.PI / 2   // prime meridian faces +z
  scene.add(globeObj)
  const atmGeo = new SphereGeometry(R * 1.15, 75, 75)
  const atmMat = new ShaderMaterial({ vertexShader: ATM_VERT, fragmentShader: ATM_FRAG, uniforms: { color: { value: new Color('#9cc7ff') }, coefficient: { value: 0.1 }, power: { value: 3.5 } }, side: BackSide, blending: AdditiveBlending, transparent: true, depthWrite: false })
  scene.add(new Mesh(atmGeo, atmMat))

  // pins: real venues nearest London first (they appear in that order), then the open seats
  const V = new Vector3()
  const PINS = opts.pins.map(([lat, lng, s]) => ({ lat, lng, s, dd: angDist({ lat, lng }, LONDON) })).sort((a, b) => a.dd - b.dd)
  const GH = GHOSTS.map(([lat, lng]) => ({ lat, lng, ghost: true })).filter((g) => !PINS.some((p) => angDist(p, g) < 0.012))
  const all = GH.concat(PINS)
  for (const p of all) {
    const el = document.createElement('div')
    if (p.ghost) { el.className = 'gpin ghost'; el.innerHTML = '<span class="gp"><u></u><i></i><b></b></span>' }
    else if (p.s) { el.className = 'gpin'; el.innerHTML = '<span class="gp"><img alt="" decoding="async"><i></i><b></b></span>'; p.img = el.querySelector('img') }
    else { el.className = 'gpin dot'; el.innerHTML = '<span class="gp"><b></b></span>' }
    el.style.display = 'none'
    p.el = el; p.pos = toXYZ(p.lat, p.lng, 0, new Vector3()); p.shown = false; p.x = NaN; p.y = NaN
    pinsBox.appendChild(el)
  }
  let loading = 0
  const queue = []
  const pump = () => {
    while (loading < MAX_LOADING && queue.length) {
      const p = queue.shift(); loading++
      const done = () => { loading--; pump() }
      p.img.onload = done; p.img.onerror = done; p.img.src = p.s
    }
  }
  const wantPhoto = (p) => { if (p.img && !p.queued) { p.queued = true; queue.push(p); pump() } }

  // controls: off while the scroll drives the camera; at the end the globe spins freely
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enabled = false; controls.autoRotate = false; controls.enableZoom = false; controls.enablePan = false; controls.rotateSpeed = 0.6
  controls.enableDamping = true; controls.dampingFactor = 0.1
  controls.addEventListener('start', () => { controls.autoRotate = false; gEl.style.cursor = 'grabbing' })
  controls.addEventListener('end', () => { if (glFree) gEl.style.cursor = 'grab' })
  controls.addEventListener('change', () => { dirty = true })

  let w = 0, h = 0, dirty = true, glFree = false, glVisible = false, raf = 0, last = 0, tween = null, dead = false
  function size() {
    const W = gEl.clientWidth, H = gEl.clientHeight
    if (W !== w || H !== h) { w = W; h = H; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); dirty = true }
  }
  const povOf = (pov) => toXYZ(pov.lat, pov.lng, pov.altitude, new Vector3())
  function pointOfView(pov, ms) {
    const to = povOf(pov)
    if (!ms) { tween = null; camera.position.copy(to); camera.lookAt(0, 0, 0); dirty = true; return }
    tween = { from: camera.position.clone(), to, t0: performance.now(), ms }
  }
  function glTarget(e) { const narrow = opts.narrow(), a0 = narrow ? 0.9 : 0.75; return { lat: LONDON.lat + (ENDV.lat - LONDON.lat) * e, lng: LONDON.lng + (ENDV.lng - LONDON.lng) * e, altitude: a0 + ((narrow ? 2.6 : 2.3) - a0) * e } }
  function glUpdate() {
    const r = cmEl.getBoundingClientRect(), H = innerHeight
    const p = clamp(-r.top / (cmEl.offsetHeight - H), 0, 1), e = reduce ? 1 : sm((p - 0.04) / 0.7)
    const free = p >= 0.76
    if (free !== glFree) {
      glFree = free; controls.enabled = free
      controls.autoRotate = free && !reduce; controls.autoRotateSpeed = 0.35
      gEl.style.cursor = free ? 'grab' : ''
      if (!free) pointOfView(glTarget(e), 600)   // glide back onto the scroll path
    }
    // close over London, then turn east and pull back
    if (!glFree && !tween) pointOfView(glTarget(e), 0)
    const n = Math.min(PINS.length, Math.ceil(PINS.length * clamp(e * 1.15, 0.02, 1) / 6) * 6)
    const far = n ? PINS[n - 1].dd : -1
    for (const q of PINS) q.on = q.dd <= far
    for (const q of GH) q.on = e > 0.62
    dirty = true
  }
  // place every pin over its spot on the globe; hide the ones on the far side (globe.gl's HTML layer)
  const camDir = new Vector3()
  function placePins() {
    const c = camera.position, R2 = R * R
    camDir.copy(c)
    for (const p of all) {
      const facing = p.pos.dot(c) > R2 * 1.004
      if (!facing) { if (p.el.style.display !== 'none') p.el.style.display = 'none'; continue }
      V.copy(p.pos).project(camera)
      if (V.z > 1 || V.x < -1.2 || V.x > 1.2 || V.y < -1.2 || V.y > 1.2) { if (p.el.style.display !== 'none') p.el.style.display = 'none'; continue }
      if (p.el.style.display === 'none') p.el.style.display = ''
      const x = (V.x * 0.5 + 0.5) * w, y = (-V.y * 0.5 + 0.5) * h
      if (!(Math.abs(x - p.x) <= 0.05 && Math.abs(y - p.y) <= 0.05)) {
        p.x = x; p.y = y
        p.el.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'
        p.el.style.zIndex = String(Math.round(100000 - p.pos.distanceTo(c) * 10))
      }
      if (p.on !== p.shown) { p.shown = p.on; p.el.classList.toggle('on', p.on); if (p.on) wantPhoto(p) }
    }
  }
  function render(now) {
    raf = 0; if (dead || !glVisible) return
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60; last = now
    if (tween) {
      const k = clamp((now - tween.t0) / tween.ms, 0, 1), e = 1 - Math.pow(1 - k, 3)
      camera.position.lerpVectors(tween.from, tween.to, e).setLength(tween.from.length() + (tween.to.length() - tween.from.length()) * e)
      camera.lookAt(0, 0, 0); dirty = true
      if (k >= 1) tween = null
    }
    if (controls.enabled) controls.update(dt)
    if (dirty) { dirty = false; renderer.render(scene, camera); placePins() }
    if (tween || controls.enabled) raf = requestAnimationFrame(render)
  }
  const kick = () => { if (!raf && !dead && glVisible) { last = 0; raf = requestAnimationFrame(render) } }

  // the prototype's mapFrame: only animate while on screen
  function frame() {
    if (dead) return
    const r = cmEl.getBoundingClientRect(), vis = r.bottom > 0 && r.top < innerHeight
    if (vis !== glVisible) { glVisible = vis; if (!vis && raf) { cancelAnimationFrame(raf); raf = 0 } }
    if (vis) { size(); glUpdate(); kick() }
  }
  size(); glUpdate()

  return {
    frame,
    destroy() {
      dead = true
      if (raf) cancelAnimationFrame(raf)
      controls.dispose()
      for (const p of all) if (p.img) { p.img.onload = p.img.onerror = null }
      ;[earth, bump, globeGeo, globeMat, atmGeo, atmMat].forEach((d) => d.dispose())
      renderer.dispose(); renderer.forceContextLoss()
      renderer.domElement.remove(); pinsBox.remove(); gEl.classList.remove('live'); gEl.style.cursor = ''
    },
  }
}
