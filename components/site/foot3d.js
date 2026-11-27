/* Footer icons in 3D, ported from the approved prototype's foot3d.js (three.js r128 from a CDN) to an ES
   module on the installed three (0.187), bundled and served from this site. The rebus line's pictograms
   become small real objects: the Makan app icon, the Maître d' crown, the Indonesian and UK flags waving,
   the Apple and Google Play marks and the Instagram glyph. Each sits exactly over its
   <span class="g3" data-g="..."> placeholder, which keeps a flat SVG as the fallback. They pop in when the
   footer arrives, lean toward the cursor, and spin when you hover their line.

   r128 → 0.187 colour and light: r128 ran without colour management, so a hex colour was used as a linear
   value and then sRGB-encoded on output, and its lights used the legacy (non-physical) intensity scale.
   To draw the same picture, every material colour is set as linear (setHex(..., LinearSRGBColorSpace), with
   no global ColorManagement change that would touch other three.js scenes on the page), the light
   intensities are multiplied by π, and canvas textures are marked sRGB as before. */
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const backOut = (t) => { const c = 1.70158 * 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }
const linear = (hex) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace)

/** Mounts the 3D layer over the footer's .g3 placeholders. Returns { destroy() }; a no-op when WebGL or motion is unavailable. */
export function mountFooterIcons(footEl) {
  const none = { destroy() {} }
  if (!footEl || matchMedia('(prefers-reduced-motion: reduce)').matches) return none
  const spots = [...footEl.querySelectorAll('.g3[data-g]')]
  if (!spots.length) return none
  try { const t = document.createElement('canvas'); if (!(t.getContext('webgl2') || t.getContext('webgl'))) return none } catch { return none }

  const canvas = document.createElement('canvas')
  canvas.className = 'foot3d'
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:6;pointer-events:none'
  document.body.appendChild(canvas)
  let R
  try { R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }) } catch { canvas.remove(); return none }
  R.setPixelRatio(Math.min(devicePixelRatio, 2))
  R.outputColorSpace = THREE.SRGBColorSpace
  const S = new THREE.Scene(), C = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000)
  S.add(new THREE.AmbientLight(0xffffff, 0.72 * Math.PI))
  const D = new THREE.DirectionalLight(0xffffff, 0.75 * Math.PI); D.position.set(-0.6, 0.9, 1.4); S.add(D)
  const disposables = []
  const keep = (x) => { disposables.push(x); return x }
  const mat = (c, o) => keep(new THREE.MeshStandardMaterial(Object.assign({ color: linear(c), roughness: 0.55, metalness: 0 }, o || {})))
  const svg = new SVGLoader()
  // extrude SVG paths (y down) into one frame: centred on the first path, scaled so it is 1 tall.
  // y and z flip together, so faces stay outward (one negative scale would turn the mesh inside out)
  function extRaw(d, depth) {
    let shapes = []
    svg.parse('<svg xmlns="http://www.w3.org/2000/svg"><path d="' + d + '"/></svg>').paths.forEach((p) => { shapes = shapes.concat(SVGLoader.createShapes(p)) })
    return keep(new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: depth * 0.18, bevelSize: depth * 0.12, bevelSegments: 2, curveSegments: 14 }))
  }
  function frameOf(g) { g.computeBoundingBox(); const b = g.boundingBox; return { cx: (b.min.x + b.max.x) / 2, cy: (b.min.y + b.max.y) / 2, cz: (b.min.z + b.max.z) / 2, h: b.max.y - b.min.y } }
  function place(g, f, dz) { g.translate(-f.cx, -f.cy, -f.cz + (dz || 0)); g.scale(1 / f.h, -1 / f.h, -1 / f.h); return g }
  function ext(d, depth) { const g = extRaw(d, depth); return place(g, frameOf(g)) }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const tx = keep(new THREE.CanvasTexture(c)); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx }
  function roundRect(x, y, w, h, r) { const s = new THREE.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s }

  const flags = []
  function flag(draw, aspect) {
    const geo = keep(new THREE.PlaneGeometry(aspect, 1, 24, 12)), tx = canvasTex(Math.round(240 * aspect), 240, draw)
    const m = new THREE.Mesh(geo, keep(new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.75 })))
    m.userData.base = geo.attributes.position.array.slice(); m.userData.aspect = aspect; flags.push(m)
    const pole = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 10)), mat(0x11181C)); pole.position.set(-aspect / 2 - 0.035, -0.22, 0)
    const g = new THREE.Group(); g.add(m); g.add(pole); g.userData.flag = m; return g
  }

  const MAKE = {
    // the Makan app icon: an orange rounded tile with the cream M, from /makan-icon.svg
    app() {
      const g = keep(new THREE.ExtrudeGeometry(roundRect(0, 0, 1, 1, 0.23), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 10 }))
      g.translate(-0.5, -0.5, -0.08)
      const face = mat(0xffffff), side = mat(0xFCA445), grp = new THREE.Mesh(g, [face, side])
      const img = new Image()
      // cap UVs are the shape's 0..1 coords, so the icon maps straight on
      img.onload = () => { face.map = canvasTex(512, 512, (x, w, h) => { x.drawImage(img, 0, 0, w, h) }); face.needsUpdate = true }
      img.src = '/makan-icon.svg'
      return grp
    },
    // the Maître d' crown, from /redesign/maitred-crown.svg: gold body, orange band
    crown() {
      const g = new THREE.Group(), body = extRaw('M22 35L50 53L78 15L105 51L138 31L124 94Q81 112 35 96Z', 14), f = frameOf(body)
      g.add(new THREE.Mesh(place(body, f), mat(0xFFC768)))
      g.add(new THREE.Mesh(place(extRaw('M35 80Q79 94 128 77L124 96Q80 113 38 97Z', 14), f, -5), mat(0xEC8B32)))
      g.add(new THREE.Mesh(place(extRaw('M77 48L86 62L78 76L68 63Z', 14), f, -6), mat(0xFFF1C8)))
      return g
    },
    // flags wave: a cloth of 24 x 12 quads
    'flag-id'() { return flag((x, w, h) => { x.fillStyle = '#CE1126'; x.fillRect(0, 0, w, h / 2); x.fillStyle = '#FFFFFF'; x.fillRect(0, h / 2, w, h / 2) }, 1.5) },
    // the canonical Union Jack SVG, drawn into the cloth's texture
    'flag-uk'() {
      const g = flag((x, w, h) => { x.fillStyle = '#012169'; x.fillRect(0, 0, w, h) }, 2), m = g.userData.flag, img = new Image()
      img.onload = () => { const c = m.material.map.image, x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); m.material.map.needsUpdate = true }
      img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="480" height="240"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>')
      return g
    },
    // Apple's mark
    apple() { return new THREE.Mesh(ext('M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-4zM14.1 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z', 2.2), mat(0x11181C)) },
    // Google Play's four-colour triangle
    play() {
      const g = new THREE.Group(), P = { A: [0, 0], B: [0, 1], M: [0.56, 0.5], Q1: [0.74, 0.33], Q2: [0.74, 0.67], C: [0.94, 0.5] }
      const tri = (pts, col) => { const s = new THREE.Shape(); pts.forEach((p, i) => { const q = P[p]; s[i ? 'lineTo' : 'moveTo'](q[0], -q[1]) }); const geo = keep(new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false })); geo.translate(-0.47, 0.5, -0.07); g.add(new THREE.Mesh(geo, mat(col))) }
      tri(['A', 'B', 'M'], 0x00A0FF); tri(['A', 'M', 'Q1'], 0x00F076); tri(['B', 'Q2', 'M'], 0xFF3A44); tri(['Q1', 'C', 'Q2', 'M'], 0xFFD500)
      return g
    },
    // Instagram's glyph: rounded square, lens ring and dot, in the brand gradient
    insta() {
      const outer = roundRect(0, 0, 1, 1, 0.3), hole = roundRect(0.09, 0.09, 0.82, 0.82, 0.22); outer.holes.push(hole)
      const lens = new THREE.Shape(); lens.absarc(0.5, 0.5, 0.235, 0, Math.PI * 2, false); const lh = new THREE.Path(); lh.absarc(0.5, 0.5, 0.15, 0, Math.PI * 2, true); lens.holes.push(lh)
      const dot = new THREE.Shape(); dot.absarc(0.765, 0.765, 0.06, 0, Math.PI * 2, false)
      const g = keep(new THREE.ExtrudeGeometry([outer, lens, dot], { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2, curveSegments: 18 }))
      g.translate(-0.5, -0.5, -0.06)
      const tx = canvasTex(256, 256, (x, w, h) => { const gr = x.createRadialGradient(w * 0.3, h * 1.05, 0, w * 0.3, h * 1.05, w * 1.3); gr.addColorStop(0, '#FEDA75'); gr.addColorStop(0.25, '#FA7E1E'); gr.addColorStop(0.5, '#D62976'); gr.addColorStop(0.75, '#962FBF'); gr.addColorStop(1, '#4F5BD5'); x.fillStyle = gr; x.fillRect(0, 0, w, h) })
      // extruded caps use the shape's own 0..1 coordinates as UVs, so the gradient maps straight on
      return new THREE.Mesh(g, [mat(0xffffff, { map: tx }), mat(0xD62976)])
    },
  }

  // one object per placeholder, sized to the placeholder's box
  const items = spots.map((el, i) => {
    const o = (MAKE[el.dataset.g] || MAKE.app)(); S.add(o)
    return { el, o, i, line: el.closest('a,.sf-l2'), spinT: -1, kind: el.dataset.g || 'app' }
  })
  document.documentElement.classList.add('g3-on')
  let mx = -1e4, my = -1e4, seenAt = 0, w = 0, h = 0, raf = 0, dead = false
  const onMove = (e) => { mx = e.clientX; my = e.clientY; kick() }
  const hovers = []
  items.forEach((it) => {
    if (!it.line) return
    const enter = () => { items.forEach((j) => { if (j.line === it.line && j.spinT < 0) j.spinT = performance.now() + j.i * 60 }) }
    it.line.addEventListener('mouseenter', enter); hovers.push([it.line, enter])
  })

  function wave(m, now) {
    const p = m.geometry.attributes.position, b = m.userData.base, a = m.userData.aspect
    for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], u = (x + a / 2) / a; p.array[i * 3 + 2] = Math.sin(u * 5.5 - now / 260) * 0.09 * u + Math.cos(y * 2 + now / 400) * 0.02 * u }
    p.needsUpdate = true; m.geometry.computeVertexNormals()
  }
  function frame(now) {
    raf = 0
    if (dead) return
    const fr = footEl.getBoundingClientRect()
    if (fr.bottom < -50 || fr.top > innerHeight + 50) { canvas.style.visibility = 'hidden'; return }
    canvas.style.visibility = 'visible'
    if (!seenAt && fr.top < innerHeight * 0.85) seenAt = now
    if (w !== innerWidth || h !== innerHeight) { w = innerWidth; h = innerHeight; R.setSize(w, h, false); C.right = w; C.bottom = -h; C.updateProjectionMatrix() }
    items.forEach((it) => {
      const r = it.el.getBoundingClientRect(), size = r.height * 1.05, cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const age = seenAt ? (now - seenAt - it.i * 90) / 700 : -1, pop = age <= 0 ? 0 : age >= 1 ? 1 : backOut(age)
      it.o.position.set(cx, -cy, 0); it.o.scale.setScalar(Math.max(0.0001, size * pop))
      // lean toward the cursor, bob gently, spin once on hover
      const dx = clamp((mx - cx) / 400, -1, 1), dy = clamp((my - cy) / 400, -1, 1)
      let spin = 0
      if (it.spinT > 0) { const k = (now - it.spinT) / 850; if (k >= 1) it.spinT = -1; else if (k > 0) spin = Math.PI * 2 * backOut(k) }
      const bob = Math.sin(now / 1100 + it.i) * 0.12
      it.o.rotation.set(-dy * 0.45 + (it.kind.indexOf('flag') === 0 ? 0 : bob * 0.4), dx * 0.6 + bob + spin, 0)
      if (it.o.userData.flag) wave(it.o.userData.flag, now)
    })
    R.render(S, C); raf = requestAnimationFrame(frame)
  }
  function kick() { if (!raf && !dead) raf = requestAnimationFrame(frame) }
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); addEventListener('pointermove', onMove, { passive: true })
  kick()
  // keep animating (flags, bobbing) while the footer is on screen
  const tick = setInterval(() => { const fr = footEl.getBoundingClientRect(); if (fr.top < innerHeight && fr.bottom > 0) kick() }, 250)

  return {
    destroy() {
      dead = true
      if (raf) cancelAnimationFrame(raf)
      clearInterval(tick)
      removeEventListener('scroll', kick); removeEventListener('resize', kick); removeEventListener('pointermove', onMove)
      hovers.forEach(([el, fn]) => el.removeEventListener('mouseenter', fn))
      document.documentElement.classList.remove('g3-on')
      disposables.forEach((x) => x.dispose && x.dispose())
      R.dispose()
      canvas.remove()
    },
  }
}
