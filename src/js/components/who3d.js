// "Who it's for" cards: one small glossy 3D object per card instead of a photo.
// crystal → the −15 °C commute, ring light → studios and sets, star → the numbered collector piece.
// Performance: ONE shared WebGL renderer/canvas over the grid draws all three objects with scissor
// viewports; the environment map is built once, ahead of time, while the browser is idle; the canvas
// renders only while the section is on screen.
import { reduceMotion } from '../core/scroll.js';

function starShape(T, points = 5, outer = 1, inner = 0.46) {
  const sh = new T.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 ? inner : outer, a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? sh.lineTo(x, y) : sh.moveTo(x, y);
  }
  return sh;
}

function build(T, kind) {
  const g = new T.Group();
  const green = new T.MeshPhysicalMaterial({ color: '#b6ff2e', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 });
  const blue = new T.MeshPhysicalMaterial({ color: '#3a5bff', metalness: 0.85, roughness: 0.16, clearcoat: 1 });
  if (kind === 'crystal') {
    const m = new T.Mesh(new T.IcosahedronGeometry(1.05, 0), new T.MeshPhysicalMaterial({ color: '#2f52ff', metalness: 0.2, roughness: 0.08, clearcoat: 1, flatShading: true }));
    m.scale.set(0.8, 1.25, 0.8); g.add(m);
    green.flatShading = true;
    const s = new T.Mesh(new T.IcosahedronGeometry(0.24, 0), green); s.position.set(1.1, 0.75, 0.2); g.add(s);
    const s2 = new T.Mesh(new T.IcosahedronGeometry(0.15, 0), green); s2.position.set(-1.05, -0.8, 0.3); g.add(s2);
    g.userData.spin = [0.15, 0.35];
  } else if (kind === 'ring') {
    g.add(new T.Mesh(new T.TorusGeometry(1, 0.2, 28, 96), blue));
    green.emissive = new T.Color('#6fbf00'); green.emissiveIntensity = 0.9;
    const orb = new T.Mesh(new T.SphereGeometry(0.42, 32, 24), green);
    g.add(orb); g.userData.orb = orb; g.userData.spin = [0.25, 0.5];
  } else {
    const geo = new T.ExtrudeGeometry(starShape(T), { depth: 0.32, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 4, curveSegments: 2 });
    geo.center();
    g.add(new T.Mesh(geo, green));
    const moon = new T.Mesh(new T.SphereGeometry(0.2, 24, 16), blue); moon.position.set(1.15, 0.85, 0.2); g.add(moon);
    g.userData.spin = [0.1, 0.6];
  }
  return g;
}

export function mountWho3d(root) {
  const hosts = [...root.querySelectorAll('[data-who3d]')];
  const grid = hosts[0]?.closest('.who__grid');
  if (!hosts.length || !grid) return () => {};
  let dead = false, cleanup = () => {};
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 200));

  const boot = async () => {
    const T = await import('./blob-three.js');
    if (dead) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'who3d-canvas'; canvas.setAttribute('aria-hidden', 'true');
    grid.appendChild(canvas);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.autoClear = false; renderer.setScissorTest(true);
    // environment map: built once, in an idle slot, shared by all three scenes
    await new Promise((r) => idle(r));
    if (dead) { renderer.dispose(); canvas.remove(); return; }
    const pm = new T.PMREMGenerator(renderer);
    const env = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; pm.dispose();

    const items = hosts.map((host) => {
      const scene = new T.Scene(); scene.environment = env;
      const key = new T.DirectionalLight('#ffffff', 1.4); key.position.set(-2, 3, 4); scene.add(key);
      const rim = new T.PointLight('#3a5bff', 18, 12); rim.position.set(2.5, -1, 2); scene.add(rim);
      const cam = new T.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0, 6.4);
      const obj = build(T, host.dataset.who3d); scene.add(obj);
      return { host, scene, cam, obj, rect: null, tilt: { x: 0, y: 0, tx: 0, ty: 0 }, t: Math.random() * 10 };
    });

    // compile shaders now (idle), not on the first visible frame
    await new Promise((r) => idle(r));
    if (dead) return;
    items.forEach((it) => renderer.compile(it.scene, it.cam));
    // layout is cached; only recomputed when the grid resizes
    const layout = () => {
      const g = grid.getBoundingClientRect();
      renderer.setSize(g.width, g.height, false);
      canvas.style.width = `${g.width}px`; canvas.style.height = `${g.height}px`;
      items.forEach((it) => {
        const r = it.host.getBoundingClientRect();
        it.rect = { x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height, gh: g.height };
        it.cam.aspect = r.width / r.height; it.cam.updateProjectionMatrix();
      });
    };
    layout();
    const ro = new ResizeObserver(layout); ro.observe(grid);

    let raf = 0, last = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      items.forEach((it) => {
        const { rect: r, obj, tilt } = it; if (!r) return;
        it.t += dt;
        tilt.x += (tilt.tx - tilt.x) * 0.06; tilt.y += (tilt.ty - tilt.y) * 0.06;
        const [sx, sy] = obj.userData.spin;
        obj.rotation.set(Math.sin(it.t * sx) * 0.4 + tilt.x, it.t * sy + tilt.y, Math.sin(it.t * 0.3) * 0.08);
        obj.position.y = Math.sin(it.t * 0.9) * 0.1;
        if (obj.userData.orb) obj.userData.orb.scale.setScalar(1 + Math.sin(it.t * 2.2) * 0.06);
        const y = r.gh - r.y - r.h;                       // WebGL origin is bottom-left
        renderer.setViewport(r.x, y, r.w, r.h); renderer.setScissor(r.x, y, r.w, r.h);
        renderer.render(it.scene, it.cam);
      });
    };
    const play = () => { if (!raf && !reduceMotion) { last = 0; raf = requestAnimationFrame(frame); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    if (reduceMotion) frame(performance.now()), pause();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { rootMargin: '100px 0px' });
    io.observe(grid);
    const offs = items.map((it) => {
      const move = (e) => { const r = it.host.getBoundingClientRect(); it.tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.9; it.tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.6; };
      const leave = () => { it.tilt.tx = it.tilt.ty = 0; };
      it.host.addEventListener('pointermove', move); it.host.addEventListener('pointerleave', leave);
      return () => { it.host.removeEventListener('pointermove', move); it.host.removeEventListener('pointerleave', leave); };
    });
    cleanup = () => { pause(); io.disconnect(); ro.disconnect(); offs.forEach((f) => f());
      items.forEach((it) => it.scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }));
      env.dispose(); renderer.dispose(); canvas.remove(); };
  };
  // start early (well before the section) so nothing is compiled while you scroll into it
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); boot(); } }, { rootMargin: '2200px 0px' });
  near.observe(grid);
  return () => { dead = true; near.disconnect(); cleanup(); };
}
