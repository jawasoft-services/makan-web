// RM20773: Makan "ordering minute", menu-only version (story3d/menu/menu3d.js, signed off by Devon 26 Nov 2026):
// one printed menu on a dark table, lit by a single lamp. Scroll plays the story on it.
// Ported to the bundled three.js 0.187 (it was written for 0.160 from a CDN): the scene, beats, shots and
// shaders are unchanged. destroy() now also removes its listeners and observers and frees the WebGL context.
// Everything is real-time and tiny: three page textures, no models. The lens pass (focus, blur, grain) is shared with the first version.
import { AddEquation, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, Camera, CanvasTexture, CustomBlending, DepthTexture, DoubleSide, DstColorFactor, FrontSide, Group, HalfFloatType, HemisphereLight, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Quaternion, RepeatWrapping, SRGBColorSpace, Scene, ShaderMaterial, SpotLight, TextureLoader, UnsignedByteType, UnsignedIntType, VSMShadowMap, Vector2, Vector3, WebGLRenderTarget, WebGLRenderer, ZeroFactor } from 'three';

const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

const FS_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// ---------------------------------------------------------------- depth of field (half resolution gather)
const DOF_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor, tDepth;
uniform vec2 uPx;                     // one full-res pixel in uv
uniform float uNear, uFar, uFocus, uCocScale, uMaxCoc, uBoost;
#define TAPS __TAPS__
float lin(float z){ return uNear * uFar / (uFar - z * (uFar - uNear)); }
float coc(float d){ return min(uCocScale * abs(1.0 / uFocus - 1.0 / d), uMaxCoc); }
void main(){
  float dc = lin(texture2D(tDepth, vUv).r);
  float cc = coc(dc);
  vec3 c0 = texture2D(tColor, vUv).rgb;
  vec3 acc = c0; float ws = 1.0; float nearCoc = cc;
  float rot = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i) + 0.5;
    float r = sqrt(fi / float(TAPS)) * uMaxCoc;
    float a = fi * 2.39996323 + rot;
    vec2 o = vec2(cos(a), sin(a)) * r * uPx;
    vec3 s = texture2D(tColor, vUv + o).rgb;
    float ds = lin(texture2D(tDepth, vUv + o).r);
    float cs = coc(ds);
    float cover = ds > dc + 0.02 ? min(cs, cc) : cs;        // background can blur behind focus, never over it
    float w = smoothstep(r - 1.0, r + 1.0, cover + 0.75);
    float lum = dot(s, vec3(0.2126, 0.7152, 0.0722));
    s *= 1.0 + uBoost * smoothstep(0.70, 0.98, lum);          // the panorama is display-referred: give lamps back their energy so they open into discs
    if (ds < dc) nearCoc = max(nearCoc, cs * w);
    acc += s * w; ws += w;
  }
  gl_FragColor = vec4(min(acc / ws, vec3(4.0)), clamp(nearCoc / uMaxCoc, 0.0, 1.0));
}`;

// second DOF pass: a small tent filter, scaled by blur size, that closes the gaps between gather taps
const FILL_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tDof;
uniform vec2 uPx;
uniform float uMaxCoc, uSpread;
void main(){
  vec4 c = texture2D(tDof, vUv);
  float r = c.a * uMaxCoc * uSpread;
  vec4 a = c * 4.0;
  for (int i = 0; i < 8; i++) {
    float an = float(i) * 0.7853982;
    float k = mod(float(i), 2.0) < 0.5 ? 1.0 : 0.7071;
    vec4 s = texture2D(tDof, vUv + vec2(cos(an), sin(an)) * r * uPx * (k > 0.9 ? 1.0 : 1.4142));
    a += s * (k > 0.9 ? 2.0 : 1.0);
  }
  gl_FragColor = vec4(a.rgb / 16.0, c.a);
}`;

// ---------------------------------------------------------------- final: the "lens and film" pass
// Everything a real camera adds and a renderer leaves out: barrel distortion, motion blur on fast pans, fringing,
// halation, anamorphic streaks off the lamps, a filmic grade with lifted cool shadows, vignette and grain.
const FINAL_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor, tDof, tDepth;
uniform vec2 uVel;                    // how far the picture slid during the shutter, in uv
uniform float uNear, uFar, uFocus, uCocScale, uMaxCoc, uTime, uMem, uNeon, uDim, uAspect, uGrain, uShade;
float lin(float z){ return uNear * uFar / (uFar - z * (uFar - uNear)); }
float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec3 look(vec2 uv, float m){ return mix(texture2D(tColor, uv).rgb, texture2D(tDof, uv).rgb, m); }
void main(){
  vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r2 = dot(q, q);
  vec2 U = 0.5 + (vUv - 0.5) * (1.0 + 0.045 * r2) / 1.034;      // gentle barrel distortion, as from a real wide lens
  vec4 d = texture2D(tDof, U);
  float cc = min(uCocScale * abs(1.0 / uFocus - 1.0 / lin(texture2D(tDepth, U).r)), uMaxCoc);
  float m = smoothstep(0.6, 2.2, max(cc, d.a * uMaxCoc));
  vec3 c = look(U, m);
  float sp = length(uVel);
  if (sp > 0.0012) {                                           // camera moving: smear along the move, like an open shutter
    float j = hash(gl_FragCoord.xy + uTime) - 0.5;
    vec3 acc = c;
    for (int i = 1; i < 8; i++) acc += look(U + uVel * ((float(i) + j) / 8.0 - 0.5), max(m, smoothstep(0.0012, 0.01, sp)));
    c = acc / 8.0;
  }
  vec2 ca = (U - 0.5) * r2 * 0.0050;                           // lens fringing, only toward the corners
  c.r = mix(c.r, look(U + ca, m).r, 0.85);
  c.b = mix(c.b, look(U - ca, m).b, 0.85);
  c += clamp(d.rgb - 0.6, 0.0, 1.5) * 0.17;                    // halation from the brightest lamps
  vec3 streak = vec3(0.0);                                     // anamorphic streak: lamps bleed sideways
  for (int i = -7; i <= 7; i++) {
    if (i == 0) continue;
    float fi = float(i);
    streak += max(texture2D(tDof, U + vec2(fi * 0.021, 0.0)).rgb - 1.15, 0.0) * exp(-fi * fi * 0.07);
  }
  c += streak * vec3(0.55, 0.72, 1.0) * 0.030;
  // memory: the frame softens, warms and closes in
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c, mix(vec3(l), c, 0.55) * vec3(1.08, 0.99, 0.88) + d.rgb * 0.10, uMem * 0.8);
  // the neon order washes the room orange from above
  c += vec3(1.0, 0.42, 0.08) * uNeon * (0.050 + 0.11 * exp(-dot(q - vec2(0.0, 0.26), q - vec2(0.0, 0.26)) * 3.0));
  // someone has come to stand at the table: his shadow slides in from the right. He is never shown walking.
  float edge = mix(1.55, 0.12, uShade);
  float sh = smoothstep(edge - 0.42, edge + 0.08, vUv.x + (vUv.y - 0.5) * 0.22) * step(0.001, uShade);
  c *= mix(vec3(1.0), vec3(0.34, 0.36, 0.42), sh);
  c *= mix(1.0, 0.36, clamp(r2 * (0.95 + uMem * 2.0), 0.0, 1.0));   // vignette
  c *= 1.0 - uDim;
  // grade: a little contrast, shadows lifted and cooled, highlights kept warm, colour held back a touch
  c = pow(max(c, 0.0), vec3(1.05)) * 1.13;
  l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 0.93);
  c = mix(c * vec3(0.95, 1.0, 1.06), c * vec3(1.04, 1.0, 0.94), smoothstep(0.02, 0.35, l));
  c = c * 0.985 + vec3(0.0030, 0.0038, 0.0048);
  c = mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));   // to sRGB
  float g = hash(gl_FragCoord.xy + fract(uTime * 7.0) * 311.0) - 0.5;
  c += g * uGrain * (0.6 + 0.4 * (1.0 - l));
  gl_FragColor = vec4(c, 1.0);
}`;

function fsQuad(material) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const m = new Mesh(g, material);
  m.frustumCulled = false;
  const s = new Scene();
  s.add(m);
  return s;
}


const W = 0.21, H = 0.297;                                  // one leaf, metres
const bow = (x) => { const t = Math.abs(x) / W; return 0.003 * Math.sin(Math.PI * t) + 0.0015 * t; };   // paper never lies dead flat

//            id      scroll (vh)
const BEATS = [['cue', 140], ['t1', 90], ['t2', 85], ['t3', 95], ['t5', 90], ['t6', 100], ['t7', 100], ['t8', 95], ['t9', 100], ['said', 110], ['after', 110], ['gap', 130]];

export async function mountMenuStory(section, opts = {}) {
  const A = opts.assets || 'assets/';
  const Q = opts.version ? '?v=' + encodeURIComponent(opts.version) : '';
  const stage = section.querySelector('.s3-stage');
  const canvas = section.querySelector('.s3-canvas');
  const lines = [...section.querySelectorAll('.s3-line')];
  const params = new URLSearchParams(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !params.has('motion');
  const goStatic = () => { section.classList.add('is-static'); stage.style.backgroundImage = `url(${A}poster.jpg${Q})`; };
  if (reduce || params.has('static')) { goStatic(); return null; }
  let renderer;
  try {
    const context = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
    if (!context) throw new Error('webgl2');
    renderer = new WebGLRenderer({ canvas, context, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch { if (renderer) renderer.dispose(); goStatic(); return null; }
  renderer.outputColorSpace = LinearSRGBColorSpace;    // the final pass encodes to sRGB itself
  renderer.autoClear = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  const coarse = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
  const quality = { scale: Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75), taps: coarse ? 24 : 48, maxPixels: coarse ? 1.3e6 : 2.6e6, auto: 1, slow: 0 };

  // ---------------------------------------------------------------- load
  const texL = new TextureLoader();
  let done = 0;
  const tick = (v) => { done++; section.style.setProperty('--s3-load', (done / 4).toFixed(3)); return v; };
  const tex = (name) => texL.loadAsync(A + name + Q).then((t) => {
    t.colorSpace = SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.generateMipmaps = true;
    t.minFilter = LinearMipmapLinearFilter; return tick(t);
  });
  let tL, tR, tC, ITEMS;
  try {
    [tL, tR, tC, ITEMS] = await Promise.all([tex('page_left.webp'), tex('page_right.webp'), tex('cover.webp'),
      fetch(A + 'items.json' + Q).then((r) => r.json()).then(tick)]);
  } catch (e) { console.error('menu story: asset load failed', e); renderer.dispose(); renderer.forceContextLoss(); goStatic(); return null; }
  const items = ITEMS.items;

  const beats = BEATS.map(([id, scroll]) => ({ id, scroll: scroll * (opts.lengthScale || 1) }));
  let acc = 0;
  for (const b of beats) { b.s0 = acc; acc += b.scroll; b.s1 = acc; b.el = lines.find((l) => l.dataset.b === b.id); }
  const LEN = acc;
  section.style.setProperty('--s3-len', LEN);
  const B = Object.fromEntries(beats.map((b, i) => [b.id, i]));

  // ---------------------------------------------------------------- scene: a table, a lamp, a menu
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.03, 12);
  // table: dark walnut drawn on a canvas (streaks along the grain), just enough to catch the light
  const wc = document.createElement('canvas'); wc.width = wc.height = 1024;
  const wx = wc.getContext('2d');
  wx.fillStyle = '#3a2415'; wx.fillRect(0, 0, 1024, 1024);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1400; i++) {
    const y = rnd() * 1024, l = 200 + rnd() * 800, x = rnd() * 1024 - 200, a = 0.03 + rnd() * 0.09;
    wx.strokeStyle = rnd() > 0.5 ? `rgba(128,80,42,${a})` : `rgba(8,4,2,${a * 1.4})`;
    wx.lineWidth = 0.6 + rnd() * 2.2; wx.beginPath(); wx.moveTo(x, y); wx.bezierCurveTo(x + l * 0.3, y + rnd() * 5 - 2.5, x + l * 0.7, y + rnd() * 5 - 2.5, x + l, y + rnd() * 3 - 1.5); wx.stroke();
  }
  const wood = new CanvasTexture(wc); wood.colorSpace = SRGBColorSpace; wood.wrapS = wood.wrapT = RepeatWrapping; wood.repeat.set(1.6, 1.6); wood.anisotropy = 8;
  const table = new Mesh(new PlaneGeometry(5, 5), new MeshStandardMaterial({ map: wood, roughness: 0.42, metalness: 0.0 }));
  table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);

  // paper tooth, as a bump map
  const pc = document.createElement('canvas'); pc.width = pc.height = 256;
  const px = pc.getContext('2d'); const pid = px.createImageData(256, 256);
  for (let i = 0; i < pid.data.length; i += 4) { const v = 118 + rnd() * 20; pid.data[i] = pid.data[i + 1] = pid.data[i + 2] = v; pid.data[i + 3] = 255; }
  px.putImageData(pid, 0, 0);
  const tooth = new CanvasTexture(pc); tooth.wrapS = tooth.wrapT = RepeatWrapping; tooth.repeat.set(5, 7);
  const paper = (map, side) => new MeshStandardMaterial({ map, roughness: 0.86, metalness: 0, bumpMap: tooth, bumpScale: 0.35, side });
  const leafGeo = (sgn) => {
    const g = new PlaneGeometry(W, H, 24, 1); g.rotateX(-Math.PI / 2); g.translate(sgn * W / 2, 0, 0);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, bow(p.getX(i)));
    g.computeVertexNormals(); return g;
  };
  const menu = new Group(), leafL = new Group(), leafR = new Group();
  menu.add(leafL, leafR); scene.add(menu);
  const mR = new Mesh(leafGeo(1), paper(tR, DoubleSide)); mR.castShadow = mR.receiveShadow = true; leafR.add(mR);
  const mL = new Mesh(leafGeo(-1), paper(tL, FrontSide)); mL.castShadow = mL.receiveShadow = true; leafL.add(mL);
  const tCov = tC.clone(); tCov.wrapS = RepeatWrapping; tCov.repeat.x = -1; tCov.offset.x = 1; tCov.needsUpdate = true;      // seen from behind, so mirrored back
  const mC = new Mesh(leafGeo(-1), paper(tCov, BackSide)); mC.position.y = -0.0005; mC.castShadow = true; mC.receiveShadow = true; leafL.add(mC);
  leafR.rotation.z = 0.035;
  menu.position.y = 0.0012;

  // where a dish sits on the page, in the leaf's own space
  const at = (it, fx, fy) => { const x = it.page === 'left' ? -W + fx * W : fx * W; return new Vector3(x, bow(x), (fy - 0.5) * H); };
  const worldOf = (it, fx, fy) => (it.page === 'left' ? leafL : leafR).localToWorld(at(it, fx, fy));
  const dish = (n) => items.find((i) => i.name === n);
  // Highlighter: a marker stroke over a dish name (or a price). It multiplies the paper instead of covering it, so print stays black.
  const HL_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const HL_FRAG = `
precision highp float;
uniform float uLevel, uDraw, uSeed, uRatio; uniform vec3 uTint; varying vec2 vUv;
void main() {
  float d = abs(vUv.y - 0.5) * 2.0;
  float wob = 0.05 * sin(vUv.x * 23.0 + uSeed) + 0.03 * sin(vUv.x * 61.0 + uSeed * 2.3);       // a hand-drawn edge, not a ruler
  float a = 1.0 - smoothstep(0.74 + wob, 0.97 + wob, d);
  a *= smoothstep(0.0, 0.32, min(vUv.x, 1.0 - vUv.x) * uRatio + (1.0 - d) * 0.12);                // soft ends
  a *= 1.0 - smoothstep(uDraw * 1.1 - 0.07, uDraw * 1.1, vUv.x);                                   // drawn left to right
  a *= 0.9 + 0.1 * sin(vUv.x * 9.0 + uSeed * 1.7);
  gl_FragColor = vec4(mix(vec3(1.0), uTint, a * uLevel), 1.0);
}`;
  const TINT = new Vector3(1.0, 0.5, 0.16);            // Makan orange as a pigment, in linear light
  const marker = (it, fx0, fx1, seed) => {
    const leaf = it.page === 'left' ? leafL : leafR;
    const x0 = (it.page === 'left' ? -W : 0) + (fx0 - 0.02) * W, len = (fx1 - fx0 + 0.04) * W, hgt = (it.y1 - it.y0 + 0.012) * H;
    const g = new PlaneGeometry(len, hgt, 14, 1); g.rotateX(-Math.PI / 2); g.translate(x0 + len / 2, 0, ((it.y0 + it.y1) / 2 + 0.002 - 0.5) * H);
    const q = g.attributes.position; for (let i = 0; i < q.count; i++) q.setY(i, bow(q.getX(i)) + 0.0003);
    const u = { uLevel: { value: 0 }, uDraw: { value: 0 }, uSeed: { value: seed }, uRatio: { value: len / hgt }, uTint: { value: TINT } };
    const m = new Mesh(g, new ShaderMaterial({ vertexShader: HL_VERT, fragmentShader: HL_FRAG, uniforms: u, transparent: true, depthWrite: false,
      blending: CustomBlending, blendEquation: AddEquation, blendSrc: DstColorFactor, blendDst: ZeroFactor }));
    m.visible = false; leaf.add(m);
    return (v) => { m.visible = v > 0.004; u.uLevel.value = v; u.uDraw.value = clamp(v / 0.3, 0, 1); };
  };
  const mark = items.map((it, i) => marker(it, it.x0, it.x1, i * 3.1 + 1));
  const bream = dish('Whole grilled sea bream'), markPrice = marker(bream, bream.px0, bream.px1, 50);
  const lv = new Float32Array(items.length);
  const IDX = Object.fromEntries(items.map((it, i) => [it.name, i]));
  const COUNT = items.filter((i) => !i.chilli).map((i) => IDX[i.name]);                     // fourteen, in reading order; the one with the chilli is the fifteenth
  const WANDER = ['Steak frites', 'Fish pie', 'Lamb rump', 'Beer-battered haddock', 'Pork belly'];
  const PANIC = ['Roast chicken', 'Whole grilled sea bream', 'Prawn noodles', 'Steak frites', 'Roast chicken', 'Prawn noodles', 'Whole grilled sea bream'];

  // light: one warm lamp over the table, a little cool sky from the window, and the orange of the order
  const lamp = new SpotLight(0xffe0bd, 5.2, 0, 0.74, 1.0, 2);
  lamp.position.set(0.16, 1.18, 0.34); lamp.target.position.set(0, 0, 0.02); lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.radius = 9; lamp.shadow.blurSamples = 16; lamp.shadow.bias = -0.0004; lamp.shadow.normalBias = 0.0015;   // three 0.187 draws VSM from a native depth texture: without a normal bias the bowed leaves self-shadow in bands lamp.shadow.camera.near = 0.3; lamp.shadow.camera.far = 3;
  scene.add(lamp, lamp.target, new HemisphereLight(0x9fb0d0, 0x1a110a, 0.42));
  const neon = new PointLight(0xff8a22, 0, 0, 2); neon.position.set(0.06, 0.22, -0.16); scene.add(neon);
  // whoever comes to stand at the table: only ever a shadow. An unseen board slides between lamp and table.
  const who = new Mesh(new BoxGeometry(0.55, 0.02, 1.3), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  who.castShadow = true; who.position.set(2, 0.62, 0.1); who.rotation.y = 0.22; scene.add(who);

  // ---------------------------------------------------------------- shots: where the eye rests on each line
  const c0 = (n, dx = 0) => { const it = dish(n); return [it, (it.x0 + it.x1) / 2 + dx, (it.y0 + it.y1) / 2 + 0.01]; };
  //        look at            width kept in view  elevation  swing  fov  aperture
  const SHOT = {
    closed: { p: () => new Vector3(W * 0.5, 0, 0.0), pw: 0.27, h: 0.34, w: 0.36, el: 60, az: 0, fov: 34, ap: 0.5 },
    spread: { p: () => new Vector3(0, 0, 0.004), w: 0.50, h: 0.34, el: 64, az: 0, fov: 34, ap: 0.4, pw: 0.25, pp: () => new Vector3(W * 0.5, 0, -0.03) },
    chicken: { p: () => worldOf(...c0('Roast chicken', 0.12)), w: 0.150, el: 66, az: 4, fov: 28, ap: 0.9 },
    mains: { p: () => worldOf(dish('Lamb rump'), 0.5, dish('Lamb rump').y0), pw: 0.20, w: 0.22, el: 63, az: -3, fov: 30, ap: 0.8 },
    fish: { p: () => { const it = dish('Whole grilled sea bream'); return worldOf(it, 0.5, (it.y0 + it.y1) / 2 + 0.01); }, w: 0.20, el: 66, az: -5, fov: 28, ap: 0.9,       // wide enough to hold the name and its price
      pw: 0.155, pp: (pr) => { const it = dish('Whole grilled sea bream'); return worldOf(it, mix(0.4, 0.63, sstep(0.42, 0.7, pr)), (it.y0 + it.y1) / 2 + 0.01); } },   // upright screens slide across to the price
    back: { p: () => new Vector3(W * 0.5, 0, 0.0), w: 0.30, h: 0.315, pw: 0.25, el: 58, az: 3, fov: 32, ap: 0.7 },
    count: { p: () => new Vector3(0, 0, 0.006), w: 0.47, h: 0.335, el: 68, az: 0, fov: 34, ap: 0.35, pw: 0.24, pp: (pr) => new Vector3(mix(-W * 0.5, W * 0.5, sstep(0.42, 0.6, pr)), 0, 0.0) },
    chilli: { p: () => { const it = items.find((i) => i.chilli); return worldOf(it, (it.x0 + it.chilli[0]) / 2 + 0.03, it.chilli[1] + 0.012); }, w: 0.150, el: 68, az: 6, fov: 26, ap: 0.9 },
    noodles: { p: () => { const it = items.find((i) => i.chilli); return worldOf(it, it.x0 + 0.13, (it.y0 + it.y1) / 2 + 0.006); }, w: 0.135, el: 60, az: -8, fov: 26, ap: 1.0 },
    panic: { p: () => new Vector3(0.03, 0, 0.02), w: 0.40, h: 0.31, el: 61, az: 0, fov: 33, ap: 0.7, pw: 0.27, pp: () => new Vector3(W * 0.5, 0, 0.0) },
    order: { p: () => { const it = dish('Roast chicken'); return worldOf(it, 0.5, it.y0 - 0.112); }, w: 0.29, el: 70, az: 2, fov: 28, ap: 0.8,      // wide screens: the spoken line sits on the blank head of the page
      pw: 0.19, pp: () => { const it = dish('Roast chicken'); return worldOf(it, (it.x0 + it.x1) / 2 + 0.14, it.y0 - 0.05); } },
    left: { p: () => new Vector3(0.04, 0, 0.0), h: 0.36, w: 0.62, el: 56, az: 0, fov: 34, ap: 0.6 },
    empty: { p: () => new Vector3(0, 0, -0.03), w: 0.70, el: 52, az: 0, fov: 34, ap: 1.0 },
  };
  const SEQ = ['closed', 'chicken', 'mains', 'fish', 'back', 'count', 'chilli', 'noodles', 'panic', 'order', 'left', 'empty'];   // one per beat

  // ---------------------------------------------------------------- lens pass
  const flat = new Camera();
  const half = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const rtScene = new WebGLRenderTarget(4, 4, { samples: 4, type: half ? HalfFloatType : UnsignedByteType, depthBuffer: true, magFilter: LinearFilter, minFilter: LinearFilter });
  rtScene.depthTexture = new DepthTexture(4, 4, UnsignedIntType);
  const rtDof = new WebGLRenderTarget(4, 4, { type: half ? HalfFloatType : UnsignedByteType, depthBuffer: false, magFilter: LinearFilter, minFilter: LinearFilter });
  const rtFill = rtDof.clone();
  const lens = { uNear: { value: camera.near }, uFar: { value: camera.far }, uFocus: { value: 1 }, uCocScale: { value: 1 }, uMaxCoc: { value: 16 } };
  const dofU = { tColor: { value: rtScene.texture }, tDepth: { value: rtScene.depthTexture }, uPx: { value: new Vector2() }, uBoost: { value: 2.0 }, ...lens };
  const dofScene = fsQuad(new ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: DOF_FRAG.replace('__TAPS__', quality.taps), uniforms: dofU, depthTest: false, depthWrite: false }));
  const fillU = { tDof: { value: rtDof.texture }, uPx: dofU.uPx, uMaxCoc: lens.uMaxCoc, uSpread: { value: 0.9 / Math.sqrt(quality.taps) * 1.6 } };
  const fillScene = fsQuad(new ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: FILL_FRAG, uniforms: fillU, depthTest: false, depthWrite: false }));
  const finU = { tColor: { value: rtScene.texture }, tDof: { value: rtFill.texture }, tDepth: { value: rtScene.depthTexture }, uTime: { value: 0 }, uMem: { value: 0 }, uNeon: { value: 0 },
    uDim: { value: 0 }, uAspect: { value: 1 }, uGrain: { value: 0.05 }, uVel: { value: new Vector2() }, uShade: { value: 0 }, ...lens };
  const finScene = fsQuad(new ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: FINAL_FRAG, uniforms: finU, depthTest: false, depthWrite: false }));

  let Wp = 0, Hp = 0, asp = 1;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    const sc = Math.min(quality.scale, Math.sqrt(quality.maxPixels / (w * h))) * quality.auto;
    Wp = Math.max(2, Math.round(w * sc)); Hp = Math.max(2, Math.round(h * sc));
    renderer.setPixelRatio(1); renderer.setSize(Wp, Hp, false);
    rtScene.setSize(Wp, Hp); rtDof.setSize(Math.ceil(Wp / 2), Math.ceil(Hp / 2)); rtFill.setSize(Math.ceil(Wp / 2), Math.ceil(Hp / 2));
    dofU.uPx.value.set(1 / Wp, 1 / Hp);
    asp = w / h; finU.uAspect.value = asp;
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // ---------------------------------------------------------------- scroll
  let target = 0, pos = 0, vel = 0, forced = null, visible = true;
  const readScroll = () => { const r = section.getBoundingClientRect(); target = clamp(-r.top / innerHeight * 100, 0, LEN); };
  addEventListener('scroll', readScroll, { passive: true }); readScroll(); pos = target;
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: '20% 0px' }); io.observe(section);
  const mouse = new Vector2(), mouseS = new Vector2();
  const onMove = (e) => { mouse.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); };
  if (!coarse) addEventListener('pointermove', onMove, { passive: true });
  const uAt = (p) => { for (let i = 0; i < beats.length; i++) if (p <= beats[i].s1) return i + clamp((p - beats[i].s0) / beats[i].scroll, 0, 1); return beats.length; };
  const stats = { frames: 0, last: 0 };
  const tgt = new Vector3(), a3 = new Vector3(), b3 = new Vector3(), qPrev = new Quaternion(), qInv = new Quaternion(), vF = new Vector3();
  let havePrev = false;
  const shotAt = (i) => SHOT[SEQ[clamp(i, 0, SEQ.length - 1)]];
  // upright screens cannot hold a two-page spread at a readable size: they frame one page, and pan across while counting
  const tall = () => asp < 0.85;
  const wOf = (sh) => (tall() && sh.pw) || sh.w;
  const pOf = (sh, pr) => (tall() && sh.pp ? sh.pp(pr) : sh.p(pr));

  function render(now) {
    const t = now / 1000;
    const dt = Math.min(0.1, (now - (stats.last || now)) / 1000); stats.last = now;
    const steps = Math.max(1, Math.ceil(dt / 0.012));
    for (let i = 0; i < steps; i++) { const h = dt / steps; vel += ((target - pos) * 42 - vel * 9.3) * h; pos += vel * h; }
    pos = clamp(pos, 0, LEN);
    if (Math.abs(target - pos) < 0.002 && Math.abs(vel) < 0.02) { pos = target; vel = 0; }
    const u = forced != null ? forced : uAt(pos);
    const bi = Math.min(beats.length - 1, Math.floor(u)), p = u - bi;         // which line, and how far through it
    const in_ = (id, a = 0, b = 1) => (B[id] === bi ? sstep(a, b, p) : (bi > B[id] ? 1 : 0));   // 0 before a moment, 1 after it

    // the menu itself: opens at the start, is shut and carried off at the end
    const open = in_('cue', 0.34, 0.86), shut = in_('after', 0.10, 0.46), gone = in_('after', 0.42, 0.98);
    leafL.rotation.z = -mix(Math.PI - 0.14, 0.05, open * (1 - shut));
    leafR.rotation.z = 0.035 * open * (1 - shut);
    menu.position.set(gone * gone * 1.25, 0.0012 + Math.sin(gone * Math.PI) * 0.06, -gone * 0.1);
    menu.rotation.y = -gone * 0.5;
    menu.updateMatrixWorld(true);

    // camera: glide from the last resting point to this one, then keep creeping in
    const s0 = shotAt(bi - 1), s1 = shotAt(bi), k = bi === 0 ? in_('cue', 0.36, 0.9) : sstep(0, bi === B.said ? 0.22 : 0.6, p);   // the order is a snap, not a drift
    const sA = bi === 0 ? SHOT.closed : s0, sB = bi === 0 ? SHOT.spread : s1;
    const fov = mix(sA.fov, sB.fov, k), el = mix(sA.el, sB.el, k) * DEG, az = mix(sA.az, sB.az, k) * DEG;
    const th = Math.tan(fov * DEG / 2);
    const need = Math.max(mix(wOf(sA), wOf(sB), k) / (2 * th * Math.min(asp, 1.7)), mix(sA.h || 0, sB.h || 0, k) * Math.sin(el) / (2 * th * 0.8));   // far enough back for the wanted width, and for the wanted depth of page
    const dist = Math.max(0.16, need) * (1 - 0.035 * p);
    tgt.copy(a3.copy(pOf(sA, 1))).lerp(b3.copy(pOf(sB, p)), k);
    const sway = forced != null ? 0 : 1 + Math.min(1.5, Math.abs(vel) * 0.012);
    const panic = (B.t9 === bi ? Math.sin(p * Math.PI) : 0) * (forced != null ? 0.4 : 1);
    mouseS.lerp(mouse, 1 - Math.pow(0.94, dt * 60));
    tgt.x += (Math.sin(t * 0.43) * 0.0016 + Math.sin(t * 7.3) * 0.0022 * panic) * sway + mouseS.x * 0.006 * sway + Math.sin(p * 9.0) * 0.012 * panic;
    tgt.z += (Math.sin(t * 0.37 + 2) * 0.0013 + Math.sin(t * 6.1 + 1) * 0.0018 * panic) * sway + mouseS.y * 0.004 * sway + Math.sin(p * 13.0 + 1) * 0.008 * panic;
    camera.position.set(tgt.x + dist * Math.sin(az) * Math.cos(el), tgt.y + dist * Math.sin(el), tgt.z + dist * Math.cos(az) * Math.cos(el));
    camera.fov = fov; camera.lookAt(tgt);
    // lift the subject above centre, so the lines can sit underneath it
    camera.setViewOffset(asp, 1, 0, 0.085, asp, 1);          // note: this also sets camera.aspect, so it must carry the true aspect
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);

    // marks on the page: which dish is being weighed right now. One level per dish, worked out from the scroll position alone.
    lv.fill(0);
    const up = (n, v) => { const i = typeof n === 'number' ? n : IDX[n]; if (v > lv[i]) lv[i] = v; };
    const tri = (x, c, w) => sstep(0, 1, 1 - Math.abs(x - c) / w);
    up('Roast chicken', in_('t1', 0.28, 0.55) * (1 - in_('t2', 0.02, 0.26)));                                   // "Chicken's safe."
    if (bi === B.t2) WANDER.forEach((n, j) => up(n, 0.6 * tri(p, 0.34 + j * 0.13, 0.15)));                      // "why did I come here": the eye runs down the others
    up('Whole grilled sea bream', in_('t3', 0.22, 0.46) * (1 - in_('t6', 0.0, 0.2)));                                             // "the fish"; it stays lit through "is that what this place is famous for"
    markPrice(in_('t3', 0.54, 0.74) * (1 - in_('t5', 0.0, 0.25)));                                                                  // "Is the fish a lot?" lands on its price
    const counted = in_('t6', 0.12, 0.86) * 14, settled = in_('t6', 0.88, 1.0), tally = 1 - in_('t8', 0.0, 0.3);
    COUNT.forEach((i, n) => up(i, clamp(counted - n, 0, 1) * mix(1, 0.3, Math.max(settled, clamp(counted - n - 1.5, 0, 1))) * tally));   // each flashes as it is counted, then stays faint
    up('Prawn noodles', in_('t7', 0.3, 0.5) * mix(1, 0.5, in_('t8', 0.55, 0.95)) * (1 - in_('t9', 0.0, 0.18)));        // the fifteenth; doubt thins it
    if (bi === B.t9) PANIC.forEach((n, j) => up(n, 0.85 * tri(p, 0.18 + j * 0.11, 0.09)));                      // he is coming: it jumps
    up('Roast chicken', in_('said', 0.3, 0.5) * (1 - shut));                                                    // the order
    for (let i = 0; i < lv.length; i++) mark[i](lv[i]);

    // light and lens
    const wake = in_('cue', 0.0, 0.2);
    const ap = mix(sA.ap, sB.ap, k) + (1 - wake) * 1.4 + in_('gap', 0.2, 1) * 0.6;
    const focus = mix(camera.position.distanceTo(tgt), 0.14, Math.max(1 - wake, in_('gap', 0.3, 1) * 0.8));
    lens.uFocus.value = Math.max(0.08, focus);
    lens.uMaxCoc.value = Hp * 0.021;
    lens.uCocScale.value = (params.has('nodof') ? 0 : ap) * Hp * 0.00042 / (th * th);
    finU.uTime.value = t;
    finU.uDim.value = (1 - wake) * 0.85 + in_('gap', 0.25, 1) * 0.12;
    finU.uMem.value = B.t8 === bi ? Math.sin(p * Math.PI) * 0.55 : 0;
    const said = in_('said', 0.2, 0.36) * (1 - in_('after', 0.0, 0.25));
    finU.uNeon.value = said * 0.7; neon.intensity = said * 0.085;
    who.position.x = mix(2.0, 0.42, in_('t9', 0.08, 0.85)) + in_('after', 0.3, 0.9) * 2.0;      // his shadow arrives; it leaves with the menu
    if (havePrev && forced == null && dt < 0.05) {
      vF.set(0, 0, -1).applyQuaternion(qPrev).applyQuaternion(qInv.copy(camera.quaternion).invert());
      const kk = 1.25 * (1 / 60) / Math.max(dt, 1 / 240);
      finU.uVel.value.set(vF.x / -vF.z / (2 * th * asp) * kk, vF.y / -vF.z / (2 * th) * kk).clampLength(0, 0.06);
    } else finU.uVel.value.set(0, 0);
    qPrev.copy(camera.quaternion); havePrev = true;

    renderer.setRenderTarget(rtScene); renderer.setClearColor(0x050403, 1); renderer.clear(true, true, false);
    renderer.render(scene, camera);
    renderer.setRenderTarget(rtDof); renderer.render(dofScene, flat);
    renderer.setRenderTarget(rtFill); renderer.render(fillScene, flat);
    renderer.setRenderTarget(null); renderer.render(finScene, flat);

    // the lines: one at a time
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i]; if (!b.el) continue;
      const last = i === beats.length - 1, first = i === 0;
      const a0 = first ? 0.10 : i === B.said ? 0.22 : 0.06;       // the spoken line waits for the camera to land
      const o = i === bi ? sstep(a0, a0 + 0.11, p) * (last ? 1 : 1 - sstep(0.86, 0.97, p)) : (last && bi > i ? 1 : 0);
      if (b.o !== o) { b.o = o; b.el.style.opacity = o.toFixed(3); b.el.style.transform = `translate(-50%, ${((1 - o) * 12).toFixed(1)}px)`; }
    }
    const top = beats[B.said].o || 0, bot = Math.max(...beats.map((b, i) => (i === B.said ? 0 : b.o || 0)));
    if (top !== stats.top || bot !== stats.bot) { stats.top = top; stats.bot = bot; stage.style.setProperty('--s3-top', top.toFixed(3)); stage.style.setProperty('--s3-bot', bot.toFixed(3)); }
    stats.frames++;
    if (forced == null && dt > 0) {
      quality.slow = dt > 0.021 ? quality.slow + 1 : Math.max(0, quality.slow - 0.25);
      if (quality.slow > 24 && quality.auto > 0.6) { quality.auto = Math.max(0.6, quality.auto * 0.85); quality.slow = 0; resize(); }
    }
  }
  let raf = 0;
  const loop = (now) => { raf = requestAnimationFrame(loop); if (visible || forced != null) render(now); };
  render(performance.now());
  section.classList.add('is-ready');
  raf = requestAnimationFrame(loop);
  const api = {
    beats, LEN, stats, quality, renderer,
    setU(v) { forced = v; render(performance.now()); },            // test hook: pin the story to beat index + progress, e.g. 3.5
    release() { forced = null; },
    scrollForU(v) { const i = Math.min(beats.length - 1, Math.floor(v)); return beats[i].s0 + beats[i].scroll * (v - i); },
    destroy() {
      cancelAnimationFrame(raf); removeEventListener('scroll', readScroll); removeEventListener('pointermove', onMove); ro.disconnect(); io.disconnect();
      [tL, tR, tC, tCov, wood, tooth, rtScene, rtScene.depthTexture, rtDof, rtFill].forEach((d) => d.dispose());
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      [dofScene, fillScene, finScene].forEach((s) => s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }));
      renderer.dispose(); renderer.forceContextLoss();
      section.classList.remove('is-ready'); section.style.removeProperty('--s3-load');
    },
  };
  return api;
}
