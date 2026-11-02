// "Who it's for" cards: one small glossy 3D object per card instead of a photo.
// crystal → the −15 °C commute, ring light → studios and sets, star → the numbered collector piece.
// Loaded lazily, each canvas renders only while it is on screen, gentle pointer tilt.
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
  if (kind === 'crystal') {
    const m = new T.Mesh(new T.IcosahedronGeometry(1.05, 0), new T.MeshPhysicalMaterial({ color: '#2f52ff', metalness: 0.2, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, flatShading: true, iridescence: 0.5, iridescenceIOR: 1.3 }));
    m.scale.set(0.8, 1.25, 0.8); g.add(m);
    const green = new T.MeshPhysicalMaterial({ color: '#b6ff2e', roughness: 0.15, clearcoat: 1, flatShading: true });
    const s = new T.Mesh(new T.IcosahedronGeometry(0.24, 0), green); s.position.set(1.1, 0.75, 0.2); g.add(s);
    const s2 = new T.Mesh(new T.IcosahedronGeometry(0.15, 0), green); s2.position.set(-1.05, -0.8, 0.3); g.add(s2);
    g.userData.spin = [0.15, 0.35];
  } else if (kind === 'ring') {
    g.add(new T.Mesh(new T.TorusGeometry(1, 0.2, 48, 160), new T.MeshPhysicalMaterial({ color: '#3a5bff', metalness: 0.9, roughness: 0.16, clearcoat: 1 })));
    const orb = new T.Mesh(new T.SphereGeometry(0.42, 48, 48), new T.MeshPhysicalMaterial({ color: '#b6ff2e', emissive: '#6fbf00', emissiveIntensity: 0.9, roughness: 0.25, clearcoat: 1 }));
    g.add(orb); g.userData.orb = orb; g.userData.spin = [0.25, 0.5];
  } else {
    const geo = new T.ExtrudeGeometry(starShape(T), { depth: 0.32, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 8, curveSegments: 4 });
    geo.center();
    g.add(new T.Mesh(geo, new T.MeshPhysicalMaterial({ color: '#b6ff2e', metalness: 0.15, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 })));
    const moon = new T.Mesh(new T.SphereGeometry(0.2, 32, 32), new T.MeshPhysicalMaterial({ color: '#3a5bff', metalness: 0.6, roughness: 0.15, clearcoat: 1 }));
    moon.position.set(1.15, 0.85, 0.2); g.add(moon);
    g.userData.spin = [0.1, 0.6];
  }
  return g;
}

export function mountWho3d(root) {
  const hosts = [...root.querySelectorAll('[data-who3d]')];
  if (!hosts.length) return () => {};
  const cleanups = [];
  let dead = false;
  const boot = async () => {
    const T = await import('./blob-three.js');
    if (dead) return;
    hosts.forEach((host) => {
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.outputColorSpace = T.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; pm.dispose();
      const key = new T.DirectionalLight('#ffffff', 1.4); key.position.set(-2, 3, 4); scene.add(key);
      const rim = new T.PointLight('#3a5bff', 18, 12); rim.position.set(2.5, -1, 2); scene.add(rim);
      const cam = new T.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0, 6.4);
      const obj = build(T, host.dataset.who3d); scene.add(obj);
      const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      resize();
      const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
      let raf = 0, t = Math.random() * 10, last = 0;
      const [sx, sy] = obj.userData.spin;
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; t += dt;
        tilt.x += (tilt.tx - tilt.x) * 0.06; tilt.y += (tilt.ty - tilt.y) * 0.06;
        obj.rotation.set(Math.sin(t * sx) * 0.4 + tilt.x, t * sy + tilt.y, Math.sin(t * 0.3) * 0.08);
        obj.position.y = Math.sin(t * 0.9) * 0.1;
        if (obj.userData.orb) { const k = 1 + Math.sin(t * 2.2) * 0.06; obj.userData.orb.scale.setScalar(k); }
        renderer.render(scene, cam);
      };
      const play = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
      const pause = () => { cancelAnimationFrame(raf); raf = 0; };
      if (reduceMotion) renderer.render(scene, cam);
      const io = new IntersectionObserver(([e]) => (e.isIntersecting && !reduceMotion ? play() : pause()));
      io.observe(host);
      const move = (e) => { const r = host.getBoundingClientRect(); tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.9; tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.6; };
      const leave = () => { tilt.tx = tilt.ty = 0; };
      host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
      addEventListener('resize', resize);
      cleanups.push(() => { pause(); io.disconnect(); host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); removeEventListener('resize', resize);
        scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); scene.environment?.dispose(); renderer.dispose(); renderer.domElement.remove(); });
    });
  };
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); boot(); } }, { rootMargin: '700px 0px' });
  near.observe(hosts[0]);
  return () => { dead = true; near.disconnect(); cleanups.forEach((f) => f()); };
}
