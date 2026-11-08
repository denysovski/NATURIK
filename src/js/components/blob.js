// Green 3D blob for "Who we are". three.js is loaded only when the section gets close, the canvas
// renders only while visible, and the hover "expand" is a damped spring (it overshoots and settles).
import { PHONE, softGL, gate } from './gltier.js';
import { reduceMotion } from '../core/scroll.js';

const VERT = /* glsl */`
uniform float uTime, uAmp, uFreq;
varying vec3 vN, vP;
// simplex noise (Ashima / Stefan Gustavson)
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 displace(vec3 p){
  float n = snoise(p * uFreq + vec3(uTime * .22, uTime * .17, -uTime * .12));
  return p * (1. + uAmp * n);
}
void main(){
  vec3 p = displace(position);
  // normal by finite differences along the sphere tangents
  vec3 t = normalize(cross(normal, abs(normal.y) < .99 ? vec3(0.,1.,0.) : vec3(1.,0.,0.)));
  vec3 bt = cross(normal, t);
  float e = .012;
  vec3 pa = displace(normalize(position + t * e));
  vec3 pb = displace(normalize(position + bt * e));
  vec3 n = normalize(cross(pa - p, pb - p));
  vN = normalize(normalMatrix * n);
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
  float spec = pow(max(dot(n, h1), 0.), 70.) * 1.1 + pow(max(dot(n, h1), 0.), 12.) * .12;
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
  const shadow = host.querySelector('[data-blob-shadow]');
  let dead = false, cleanup = () => {};

  const boot = async () => {
    const THREE = await import('./blob-three.js');
    if (dead) return;
    const small = innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
    const renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: 'high-performance' });
    // the blob is soft and blurry-edged, so it doesn't need retina pixels: this alone cuts fill cost ~2-3×
    // 1× is plenty for a soft shape (≈36% fewer pixels than 1.25×); adaptive quality can still drop it further
    let pr = Math.min(devicePixelRatio, small ? 0.85 : 1);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);
    if (softGL(renderer)) { renderer.dispose(); return; }   // no GPU: skip the blob
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 6.2);
    const uni = { uTime: { value: 0 }, uAmp: { value: 0.13 }, uFreq: { value: 0.95 },
      uBase: { value: new THREE.Color('#b6ff2e') }, uDeep: { value: new THREE.Color('#1d3a00') } };
    // IcosahedronGeometry is non-indexed: every vertex is stored ~6× (once per touching triangle), so the
    // noise-heavy vertex shader ran ~6× more often than needed. Welding the vertices into an indexed mesh
    // lets the GPU reuse each transformed vertex: same shape, a fraction of the vertex work.
    const ico = new THREE.IcosahedronGeometry(1, small ? 16 : 26);
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
    const still = softGL(renderer), g = gate(PHONE ? 30 : 60);

    // springs: scale (hover expand) and tilt (follows the pointer with inertia)
    const sp = { s: 1, v: 0, target: 1 }, tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    let amp = 0.13, ampT = 0.13, visible = false, raf = 0, last = performance.now(), t = 0;
    let slow = 0, seen = 0;                          // adaptive quality: drop resolution if frames run long
    let shS = '', shO = '';
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!g(now)) return;
      const raw = now - last;
      const dt = Math.min(0.05, raw / 1000); last = now; t += dt;
      if (++seen > 20) { slow = raw > (PHONE ? 45 : 22) ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 24 && pr > 0.6) { pr = Math.max(0.6, pr - 0.2); renderer.setPixelRatio(pr); resize(); slow = 0; } }
      const k = 140, c = 11;                       // stiffness / damping → a little overshoot
      sp.v += (-(sp.s - sp.target) * k - sp.v * c) * dt; sp.s += sp.v * dt;
      tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 4); tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 4);
      amp += (ampT - amp) * Math.min(1, dt * 5);
      uni.uTime.value = t; uni.uAmp.value = amp;
      const bob = Math.sin(t * 0.9) * 0.06;
      mesh.position.y = bob;
      mesh.scale.setScalar(sp.s);
      mesh.rotation.set(tilt.x + t * 0.05, tilt.y + t * 0.08, 0);
      renderer.render(scene, camera);
      if (shadow) {                                  // only touch the DOM when the value actually changes
        const ts = `translateX(-50%) scale(${(sp.s * (1 - bob * 1.4)).toFixed(2)})`, os = (0.55 - bob * 1.2).toFixed(2);
        if (ts !== shS) shadow.style.transform = shS = ts;
        if (os !== shO) shadow.style.opacity = shO = os;
      }
    };
    const play = () => { if (still) { renderer.render(scene, camera); return; } if (!raf && !reduceMotion) { last = performance.now(); seen = 0; raf = requestAnimationFrame(frame); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    if (reduceMotion) renderer.render(scene, camera);

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); }, { rootMargin: '45% 0px' }); // start a beat before it's on screen
    io.observe(host);
    const sec = host.parentElement;
    // the blob's box is cached (page coordinates) and refreshed on resize, so pointermove never forces a layout
    let box = null;
    const measure = () => { const r = host.getBoundingClientRect(); box = { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }; };
    const move = (e) => {
      if (!box) measure();
      const r = { left: box.left - scrollX, top: box.top - scrollY, width: box.width, height: box.height };
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width, ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      tilt.ty = nx * 0.8; tilt.tx = ny * 0.6;
      const over = Math.hypot(nx, ny) < 0.32;
      if (over !== host.classList.contains('is-over')) { host.classList.toggle('is-over', over); sp.target = over ? 1.28 : 1; ampT = over ? 0.22 : 0.13; sp.v += over ? 2.2 : -1.2; }
    };
    const leave = () => { tilt.tx = tilt.ty = 0; host.classList.remove('is-over'); sp.target = 1; ampT = 0.13; };
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
