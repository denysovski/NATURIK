// Contact page 3D bits, same glossy look as the "Who it's for" objects:
// a tilted question mark next to "Before you ask." and a green/blue megaphone top-right of "Talk to us."
// Each host gets a small renderer that only draws while it is on screen; setup waits for an idle slot.
import { reduceMotion } from '../core/scroll.js';
import { PHONE, softGL, gate } from './gltier.js';

function build(T, kind) {
  const g = new T.Group();
  const green = new T.MeshPhysicalMaterial({ color: '#b6ff2e', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 });
  const blue = new T.MeshPhysicalMaterial({ color: '#3a5bff', metalness: 0.85, roughness: 0.16, clearcoat: 1 });
  if (kind === 'question') {
    // the hook is a thick tube along a curve, the dot a sphere; leaning so the top sits right, the foot left
    const pts = [[-0.62, 0.62], [-0.45, 1.02], [0, 1.2], [0.48, 1.04], [0.64, 0.62], [0.46, 0.2], [0.08, -0.06], [0, -0.42]]
      .map(([x, y]) => new T.Vector3(x, y, 0));
    const curve = new T.CatmullRomCurve3(pts, false, 'centripetal');
    g.add(new T.Mesh(new T.TubeGeometry(curve, 96, 0.2, 24, false), green));
    const capA = new T.Mesh(new T.SphereGeometry(0.2, 24, 16), green); capA.position.copy(pts[0]); g.add(capA);
    const capB = new T.Mesh(new T.SphereGeometry(0.2, 24, 16), green); capB.position.copy(pts[pts.length - 1]); g.add(capB);
    const dot = new T.Mesh(new T.SphereGeometry(0.25, 32, 24), blue); dot.position.set(0, -0.98, 0); g.add(dot);
    g.position.y = -0.05;
    g.rotation.z = -0.67;                     // lean (~38°): top to the right, bottom to the left
    g.userData = { base: { x: 0.1, y: -0.45, z: -0.67 }, sway: 0.35 };
  } else {
    // megaphone: green horn, blue body, mouth ring, handle and trigger
    const horn = new T.Mesh(new T.CylinderGeometry(0.95, 0.28, 1.5, 48, 1, true), green); horn.rotation.z = -Math.PI / 2; horn.position.x = 0.45; g.add(horn);
    const inner = new T.Mesh(new T.CylinderGeometry(0.93, 0.27, 1.48, 48, 1, true), new T.MeshPhysicalMaterial({ color: '#1638ff', roughness: 0.3, metalness: 0.4, side: 2 }));
    inner.rotation.z = -Math.PI / 2; inner.position.x = 0.45; g.add(inner);
    const rim = new T.Mesh(new T.TorusGeometry(0.95, 0.07, 16, 72), blue); rim.rotation.y = Math.PI / 2; rim.position.x = 1.2; g.add(rim);
    const body = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.75, 40), blue); body.rotation.z = Math.PI / 2; body.position.x = -0.62; g.add(body);
    const back = new T.Mesh(new T.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), blue); back.rotation.z = Math.PI / 2; back.position.x = -1; g.add(back);
    const handle = new T.Mesh(new T.CapsuleGeometry(0.11, 0.42, 6, 16), green); handle.position.set(-0.5, -0.55, 0); handle.rotation.z = 0.18; g.add(handle);
    const trig = new T.Mesh(new T.CapsuleGeometry(0.05, 0.14, 4, 8), blue); trig.position.set(-0.36, -0.42, 0); g.add(trig);
    g.scale.setScalar(0.92);
    g.userData = { base: { x: 0.18, y: -0.55, z: 0.22 }, sway: 0.3 };
  }
  return g;
}

export function mountContact3d(root) {
  const hosts = [...root.querySelectorAll('[data-c3d]')];
  if (!hosts.length) return () => {};
  let dead = false; const offs = [];
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 120));
  idle(async () => {
    const T = await import('./blob-three.js');
    if (dead) return;
    hosts.forEach((host) => {
      const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
      const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 820 ? 1.5 : 1.75));
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.outputColorSpace = T.SRGBColorSpace;
      // no GPU (software WebGL): skip the object entirely, building it would freeze the page for seconds
      if (softGL(renderer)) { renderer.dispose(); canvas.remove(); return; }
      const pm = new T.PMREMGenerator(renderer);
      const env = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; pm.dispose();
      const scene = new T.Scene(); scene.environment = env;
      const key = new T.DirectionalLight('#ffffff', 1.4); key.position.set(-2, 3, 4); scene.add(key);
      const rim = new T.PointLight('#3a5bff', 18, 12); rim.position.set(2.5, -1, 2); scene.add(rim);
      const cam = new T.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0, 6.2);
      const obj = build(T, host.dataset.c3d); scene.add(obj);
      const st = { t: Math.random() * 6, hov: 0, hv: 0, tx: 0, ty: 0, x: 0, y: 0 };
      const size = () => { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height || 1; cam.updateProjectionMatrix(); };
      size(); const ro = new ResizeObserver(size); ro.observe(host);
      renderer.compile(scene, cam);
      let raf = 0, last = 0;
      const still = softGL(renderer), g = gate(PHONE ? 30 : 60);
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (!g(now)) return;
        const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; st.t += dt;
        st.hv += (st.hov - st.hv) * 0.12; st.x += (st.tx - st.x) * 0.08; st.y += (st.ty - st.y) * 0.08;
        const b = obj.userData.base, k = obj.userData.sway;
        obj.rotation.set(b.x + Math.sin(st.t * 0.6) * 0.08 + st.y, b.y + Math.sin(st.t * 0.5) * k + st.x, b.z);
        obj.position.y = Math.sin(st.t * 0.9) * 0.08;
        obj.scale.setScalar((host.dataset.c3d === 'megaphone' ? 0.92 : 1) * (1 + st.hv * 0.12));   // grows on hover
        if (host.dataset.c3d === 'megaphone') obj.rotation.z = b.z + st.hv * Math.sin(st.t * 18) * 0.04;  // a little "shout" buzz
        renderer.render(scene, cam);
      };
      const play = () => { if (still) { frame(performance.now()); cancelAnimationFrame(raf); raf = 0; return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
      const pause = () => { cancelAnimationFrame(raf); raf = 0; };
      if (reduceMotion) { frame(performance.now()); pause(); }
      const io = new IntersectionObserver(([e]) => (e.isIntersecting && !reduceMotion ? play() : pause()), { rootMargin: '80px 0px' });
      io.observe(host);
      const enter = () => (st.hov = 1), leave = () => { st.hov = 0; st.tx = st.ty = 0; };
      const move = (e) => { const r = host.getBoundingClientRect(); st.tx = ((e.clientX - r.left) / r.width - 0.5) * 0.7; st.ty = ((e.clientY - r.top) / r.height - 0.5) * 0.4; };
      const interactive = host.dataset.c3d !== 'megaphone';      // the megaphone is decoration only: no hover
      if (interactive) { host.addEventListener('pointerenter', enter); host.addEventListener('pointerleave', leave); host.addEventListener('pointermove', move); }
      requestAnimationFrame(() => host.classList.add('is-ready'));
      offs.push(() => { pause(); io.disconnect(); ro.disconnect(); host.removeEventListener('pointerenter', enter); host.removeEventListener('pointerleave', leave); host.removeEventListener('pointermove', move);
        scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); env.dispose(); renderer.dispose(); canvas.remove(); });
    });
  });
  return () => { dead = true; offs.forEach((f) => f()); };
}
