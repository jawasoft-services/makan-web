// The dish wall's Three.js scene, loaded with import() only after the page has painted and only
// when the visitor allows motion and the browser has WebGL. Real meal photos sit on a spiral;
// scrolling turns it, spins each photo in place, flies the camera through it and clears it for
// the five meal previews. The photos never bend.
//
// Cost: one renderer, one shared flat plane, one InstancedMesh (one draw call) and one texture
// built in the browser from the page's own cached /api/thumb tiles. Rendering stops off screen
// and drops to 30 fps after two seconds without scrolling.
import * as THREE from 'three'

const GRID = 8
const CELL = 256
const RADIUS = 4.2
const HEIGHT = 9.5

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
const mix = (a: number, b: number, t: number) => a + (b - a) * t

const vertexShader = /* glsl */`
  attribute vec2 aCell;
  attribute float aSeed;
  uniform float uSpin;
  uniform float uTime;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vDepth;
  void main() {
    vUv = uv;
    vCell = aCell;
    vec3 p = position;
    // Each card stays a flat photo and turns about its own upright centre line. Whole-number
    // multiples of uSpin mean every card faces square again whenever uSpin rests on a half turn.
    float a = uSpin * (1.0 + floor(aSeed * 3.0));
    float c = cos(a), s = sin(a);
    p = vec3(p.x * c, p.y, -p.x * s);
    p.y += sin(uTime * 0.6 + aSeed * 6.28) * 0.04;             // idle drift: moves, never bends
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */`
  uniform sampler2D uAtlas;
  uniform vec3 uInk;
  uniform float uDim;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vDepth;
  void main() {
    vec2 q = abs(vUv - 0.5) - (0.5 - 0.07);
    if (length(max(q, 0.0)) - 0.07 > 0.0) discard;           // rounded corners
    vec2 uv = vUv;
    if (!gl_FrontFacing) uv.x = 1.0 - uv.x;                   // backs show the photo, mirrored
    vec2 a = vec2((vCell.x + uv.x) / ${GRID}.0, 1.0 - (vCell.y + 1.0 - uv.y) / ${GRID}.0);
    vec3 col = texture2D(uAtlas, a).rgb;
    float shade = mix(0.28, 1.0, smoothstep(15.0, 5.0, vDepth)) * (gl_FrontFacing ? 1.0 : 0.72);
    col = mix(uInk, col, shade * uDim);
    col = mix(uInk, col, smoothstep(0.6, 1.6, vDepth));        // cards at the lens fade out
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/** Waits before each retry of a tile that failed (a cold resize can time out once). */
const RETRY_MS = [1500, 4000]

/**
 * Draws the tiles into the GRID x GRID atlas canvas as each one arrives and calls `onTile` after
 * each, so the spiral fills in photo by photo instead of waiting for the slowest. A failed tile is
 * tried again twice; one that still fails stays ink. The thumbnail route answers a failure with a
 * redirect to the original, which Firebase serves without CORS, so only a retry of the thumbnail
 * can put that photo in the canvas.
 */
function fillAtlas(canvas: HTMLCanvasElement, tiles: readonly string[], onTile: () => void, alive: () => boolean) {
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#11181C'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  tiles.slice(0, GRID * GRID).forEach((src, i) => {
    const load = (attempt: number) => {
      if (!alive()) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.onload = () => {
        if (!alive()) return
        // Centre-crop to a square, as the app's meal preview does.
        const s = Math.min(img.naturalWidth, img.naturalHeight)
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, (i % GRID) * CELL, Math.floor(i / GRID) * CELL, CELL, CELL)
        onTile()
      }
      img.onerror = () => { if (attempt < RETRY_MS.length) setTimeout(() => load(attempt + 1), RETRY_MS[attempt]) }
      img.src = src
    }
    load(0)
  })
}

export type WallOptions = {
  section: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  tiles: readonly string[]
  progress: () => number
  coarse: boolean
}

/** Starts the scene; returns a function that stops it and frees the GPU objects. */
export function startDishWall({ section, stage, canvas, tiles, progress, coarse }: WallOptions): () => void {
  const count = Math.min(tiles.length, GRID * GRID)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2))
  renderer.setClearColor(0x11181c, 1)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60)

  // One fixed-size atlas from the start: the texture never changes size after upload.
  const atlas = document.createElement('canvas')
  atlas.width = atlas.height = GRID * CELL
  const texture = new THREE.CanvasTexture(atlas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  let dirty = true
  let disposed = false
  // Re-upload the atlas at most every 200 ms while tiles arrive: a few uploads in all, and the
  // first photos show as soon as they are here (most are the still grid's, already cached).
  let uploadQueued = false
  fillAtlas(atlas, tiles, () => {
    if (uploadQueued) return
    uploadQueued = true
    setTimeout(() => { uploadQueued = false; if (!disposed) { texture.needsUpdate = true; dirty = true } }, 200)
  }, () => !disposed)

  const uniforms = {
    uAtlas: { value: texture },
    uInk: { value: new THREE.Color('#11181C') },
    uSpin: { value: 0 },
    uTime: { value: 0 },
    uDim: { value: 1 },
  }
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: THREE.DoubleSide })
  const geometry = new THREE.PlaneGeometry(1, 1)
  const cells = new Float32Array(count * 2)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    cells[i * 2] = i % GRID
    cells[i * 2 + 1] = Math.floor(i / GRID)
    seeds[i] = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
  }
  geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2))
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  const mesh = new THREE.InstancedMesh(geometry, material, count)
  mesh.frustumCulled = false
  const group = new THREE.Group()
  group.add(mesh)
  scene.add(group)

  const dummy = new THREE.Object3D()
  const layout = (scatter: number) => {
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963 // golden angle: an even spread with no rows
      const r = RADIUS * (1 + scatter * (1.4 + seeds[i]))
      const y = (i / Math.max(1, count - 1) - 0.5) * HEIGHT * (1 + scatter * 0.6)
      dummy.position.set(Math.sin(angle) * r, y, Math.cos(angle) * r)
      dummy.rotation.set(0, angle, (seeds[i] - 0.5) * 0.12)
      dummy.scale.setScalar(1.25 * (1 - scatter * 0.55))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  let wide = true
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.8 ? 52 : 38
    wide = w / h > 1.2
    camera.updateProjectionMatrix()
    dirty = true
  }
  resize()

  let visible = true
  let lastP = progress()
  let lastScrollAt = 0
  let lastFrame = 0
  let lastScatter = -1
  let vel = 0
  let spin = 0
  let px = 0, py = 0, tx = 0, ty = 0
  let raf = 0
  const started = performance.now()
  let lastTick = started

  const onScroll = () => { lastScrollAt = performance.now(); dirty = true }
  const onPointer = (e: PointerEvent) => { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2 }
  window.addEventListener('resize', resize)
  window.addEventListener('scroll', onScroll, { passive: true })
  if (!coarse) window.addEventListener('pointermove', onPointer, { passive: true })
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible && !raf) raf = requestAnimationFrame(frame)
  })
  io.observe(section)

  function frame(now: number) {
    raf = 0
    if (!visible || disposed) return
    raf = requestAnimationFrame(frame)
    if (now - lastScrollAt > 2000 && now - lastFrame < 33 && !dirty) return
    lastFrame = now
    dirty = false

    const dt = Math.min((now - lastTick) / 1000, 0.05)
    lastTick = now
    const time = (now - started) / 1000
    const p = progress()
    const raw = dt > 0 ? (p - lastP) / dt : 0
    lastP = p
    vel += (clamp(raw * 4, -1.6, 1.6) - vel) * 0.12
    // Scrolling spins the photos in place; when the scroll stops they ease back to square,
    // to the nearest half turn (the back of a card shows the same photo).
    spin += vel * dt * 5
    if (Math.abs(vel) < 0.08) spin += (Math.round(spin / Math.PI) * Math.PI - spin) * Math.min(1, dt * 4)

    const fly = smooth(0.12, 0.78, p)
    const scatter = smooth(0.72, 0.92, p)
    if (Math.abs(scatter - lastScatter) > 0.0005) { layout(scatter); lastScatter = scatter }

    group.rotation.y = time * 0.05 + p * Math.PI * 2.4
    // Wide screens start the spiral right of the headline; phones start it above.
    group.position.x = mix(wide ? 5.4 : 0, 0, smooth(0.04, 0.3, p))
    group.position.y = mix(wide ? -0.4 : 2.6, 1.2, fly)
    px += (tx - px) * 0.05
    py += (ty - py) * 0.05
    camera.position.set(px * 0.6, -py * 0.4, mix(12.5, 1.4, fly) + scatter * 2.5)
    camera.lookAt(0, 0, mix(0, -6, fly))

    uniforms.uSpin.value = spin
    uniforms.uTime.value = time
    uniforms.uDim.value = 1 - scatter * 0.75
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    io.disconnect()
    window.removeEventListener('resize', resize)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('pointermove', onPointer)
    geometry.dispose()
    material.dispose()
    texture.dispose()
    renderer.dispose()
  }
}
