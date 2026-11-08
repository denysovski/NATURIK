// Green 3D blob for "Who we are". three.js is loaded only when the section gets close, the canvas
// renders only while visible. Kept deliberately light: sine-wave wobble (no noise), a low-poly mesh, 30 fps,
// and simple eased hover/tilt instead of spring physics.
import { PHONE, softGL, gate } from './gltier.js';
import { reduceMotion } from '../core/scroll.js';

const VERT = /* glsl */`
uniform float uTime, uAmp;
varying vec3 vN, vP;
// cheap wobble: a few overlapping sine waves instead of 3D noise (a handful of sin() per vertex, no noise lookups)
float wave(vec3 p){
  return sin(p.x * 2.6 + p.y * .8 + uTime) * .42 + sin(p.y * 3.1 - p.z * .9 + uTime * .8 + 1.3) * .34
       + sin(p.z * 2.8 + p.x * 1.1 + uTime * .9 + 2.1) * .3 + sin((p.x + p.y - p.z) * 1.6 + uTime * .6) * .3;
}
vec3 displace(vec3 p){ return p * (1. + uAmp * wave(p)); }
void main(){
  vec3 p = displace(position);
  vec3 t = normalize(cross(normal, abs(normal.y) < .99 ? vec3(0.,1.,0.) : vec3(1.,0.,0.)));
  vec3 bt = cross(normal, t);
  vec3 pa = displace(normalize(position + t * .02));
  vec3 pb = displace(normalize(position + bt * .02));
  vN = normalize(normalMatrix * normalize(cross(pa - p, pb - p)));
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vP = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform vec3 uBase, uDeep;
varying vec3 vN, vP;
void main(){
  vec3 n = normalize(vN), v = normalize(-vP);
  vec3 L1 = normalize(vec3(-.55, .8, .6));   // key, top-left
  vec3 L2 = normalize(vec3(.9, -.2, .35));   // cool fill, right
  float d1 = max(dot(n, L1), 0.), d2 = max(dot(n, L2), 0.);
  float wrap = max((dot(n, L1) + .45) / 1.45, 0.);           // soft subsurface-ish wrap
  vec3 h1 = normalize(L1 + v);
  float spec = pow(max(dot(n, h1), 0.), 60.) * 1.1;
  float fres = pow(1. - max(dot(n, v), 0.), 3.);
  float ao = smoothstep(-.9, .4, n.y);                        // darker underside = grounded
  vec3 col = mix(uDeep, uBase, wrap) * (.35 + .65 * ao);
  col += uBase * d2 * .18 * vec3(.7, .85, 1.);
  col += spec * vec3(1.);
  col += fres * vec3(.85, 1., .6) * .35;
  gl_FragColor = vec4(col, 1.);
}`;

export function mountBlob(root) {
  const host = root.querySelector('[data-blob]');
  if (!host) return () => {};
  let dead = false, cleanup = () => {};

  const boot = async () => {
    const THREE = await import('./blob-three.js');
    if (dead) return;
    const small = innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
    const renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: 'high-performance' });
    // the blob is soft and blurry-edged, so it doesn't need retina pixels: this alone cuts fill cost ~2-3×
    const pr = Math.min(devicePixelRatio, small ? 0.85 : 1);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);
    if (softGL(renderer)) { renderer.dispose(); return; }   // no GPU: skip the blob
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 6.2);
    const uni = { uTime: { value: 0 }, uAmp: { value: 0.15 },
      uBase: { value: new THREE.Color('#b6ff2e') }, uDeep: { value: new THREE.Color('#1d3a00') } };
    // IcosahedronGeometry is non-indexed: every vertex is stored ~6× (once per touching triangle), so the
    // noise-heavy vertex shader ran ~6× more often than needed. Welding the vertices into an indexed mesh
    // lets the GPU reuse each transformed vertex: same shape, a fraction of the vertex work.
    const ico = new THREE.IcosahedronGeometry(1, small ? 10 : 16);
    ico.deleteAttribute('uv');
    const geo = THREE.mergeVertices(ico, 1e-4); ico.dispose();
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni }));
    scene.add(mesh);

    const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    resize();
    // compile off the main thread where the browser supports it (KHR_parallel_shader_compile), then draw one
    // frame, so neither the compile nor the first visible frame lands while someone is scrolling
    try { await renderer.compileAsync(scene, camera); } catch { renderer.compile(scene, camera); }
    if (dead) { geo.dispose(); mesh.material.dispose(); renderer.dispose(); renderer.domElement.remove(); return; }
    renderer.render(scene, camera);
    const still = softGL(renderer), g = gate(30);   // the motion is slow, 30 fps looks the same and halves the work

    // simple eased values (no spring physics): scale for the hover swell, tilt towards the pointer
    const ease = { s: 1, ts: 1, x: 0, y: 0, tx: 0, ty: 0, a: 0.15, ta: 0.15 };
    let raf = 0, last = performance.now(), t = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!g(now)) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      const k = Math.min(1, dt * 3);
      ease.s += (ease.ts - ease.s) * k; ease.x += (ease.tx - ease.x) * k; ease.y += (ease.ty - ease.y) * k; ease.a += (ease.ta - ease.a) * k;
      uni.uTime.value = t * 0.5; uni.uAmp.value = ease.a;
      mesh.position.y = Math.sin(t * 0.6) * 0.05;
      mesh.scale.setScalar(ease.s);
      mesh.rotation.set(ease.x + t * 0.03, ease.y + t * 0.05, 0);
      renderer.render(scene, camera);
    };
    const play = () => { if (still) { renderer.render(scene, camera); return; } if (!raf && !reduceMotion) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    if (reduceMotion) renderer.render(scene, camera);

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { rootMargin: '10% 0px' });
    io.observe(host);
    const sec = host.parentElement;
    // the blob's box is cached (page coordinates) and refreshed on resize, so pointermove never forces a layout
    let box = null;
    const measure = () => { const r = host.getBoundingClientRect(); box = { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }; };
    const move = (e) => {
      if (!box) measure();
      const r = { left: box.left - scrollX, top: box.top - scrollY, width: box.width, height: box.height };
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width, ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      ease.ty = nx * 0.6; ease.tx = ny * 0.45;
      const over = Math.hypot(nx, ny) < 0.32;
      if (over !== host.classList.contains('is-over')) { host.classList.toggle('is-over', over); ease.ts = over ? 1.16 : 1; ease.ta = over ? 0.21 : 0.15; }
    };
    const leave = () => { ease.tx = ease.ty = 0; host.classList.remove('is-over'); ease.ts = 1; ease.ta = 0.15; };
    const enter = () => { box = null; };            // re-measure once per visit (layout above may have shifted)
    sec.addEventListener('pointerenter', enter); sec.addEventListener('pointermove', move); sec.addEventListener('pointerleave', leave);
    const onResize = () => { resize(); box = null; }; addEventListener('resize', onResize);
    cleanup = () => { pause(); io.disconnect(); sec.removeEventListener('pointermove', move); sec.removeEventListener('pointerleave', leave); sec.removeEventListener('pointerenter', enter); removeEventListener('resize', onResize);
      geo.dispose(); mesh.material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  };

  // heavy setup (module load, environment, shader compile) runs in idle time soon after the page loads,
  // not while the visitor is scrolling past nearby sections; drawing still happens only on screen.
  const sec0 = host.closest('.manifesto');
  const live = sec0 && new IntersectionObserver(([e]) => sec0.classList.toggle('is-live', e.isIntersecting), { rootMargin: '45% 0px' });
  live?.observe(sec0);
  let started = false;
  const go = () => { if (started || dead) return; started = true; boot(); };
  const idleStart = () => (window.requestIdleCallback ? requestIdleCallback(go, { timeout: 5000 }) : setTimeout(go, 1500));
  const kick = setTimeout(idleStart, PHONE ? 4000 : 2600);  // phones a little later; the near-observer below is the fallback
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); go(); } }, { rootMargin: '1400px 0px' });
  near.observe(host);
  return () => { dead = true; clearTimeout(kick); near.disconnect(); live?.disconnect(); cleanup(); };
}
