// Lookbook background: soft light orbs that drift on their own, lean toward the pointer,
// and burn brighter while the pointer is over the lookbook. Transforms only, paused off-screen.
import { gsap, reduceMotion } from '../core/scroll.js';

export function mountLookOrbs(root) {
  const host = root.querySelector('[data-look-orbs]');
  if (!host || reduceMotion) return () => {};
  const sec = host.closest('.lookbook');
  const orbs = [...host.children].map((el, i) => ({ el, x: 0, y: 0, ph: i * 2.1, sp: 0.18 + i * 0.07, r: 0.22 + (i % 2) * 0.1 }));
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let W = 1, H = 1, t = 0, on = false;
  const size = () => { W = host.clientWidth; H = host.clientHeight; orbs.forEach((o) => { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; }); };
  size();
  const tick = (_, dt) => {
    t += dt / 1000;
    ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
    orbs.forEach((o, i) => {
      const ax = 0.5 + Math.sin(t * o.sp + o.ph) * 0.34, ay = 0.5 + Math.cos(t * o.sp * 1.3 + o.ph) * 0.3;
      const pull = i === 0 ? 0.65 : 0.22;                       // the first orb follows the pointer closely
      const x = (ax + (ptr.x - ax) * pull) * W, y = (ay + (ptr.y - ay) * pull) * H;
      o.el.style.transform = `translate3d(${(x - o.w / 2).toFixed(1)}px, ${(y - o.h / 2).toFixed(1)}px, 0)`;
    });
  };
  const start = () => { if (!on) { on = true; gsap.ticker.add(tick); } };
  const stop = () => { on = false; gsap.ticker.remove(tick); };
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
  io.observe(sec);
  const move = (e) => { const r = host.getBoundingClientRect(); ptr.tx = (e.clientX - r.left) / r.width; ptr.ty = (e.clientY - r.top) / r.height; };
  const enter = () => host.classList.add('is-hot'), leave = () => { host.classList.remove('is-hot'); ptr.tx = 0.5; ptr.ty = 0.5; };
  sec.addEventListener('pointermove', move); sec.addEventListener('pointerenter', enter); sec.addEventListener('pointerleave', leave);
  addEventListener('resize', size);
  return () => { stop(); io.disconnect(); sec.removeEventListener('pointermove', move); sec.removeEventListener('pointerenter', enter); sec.removeEventListener('pointerleave', leave); removeEventListener('resize', size); };
}
