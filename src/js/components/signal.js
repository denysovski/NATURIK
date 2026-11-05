// Signal: a full-screen "tracker" — big phrases flash and scramble into each other (each one is a link
// to a key part of the site), while tracked boxes jump around the field, labelled with coordinates,
// related words and promo codes, all stitched together by dashed curves. Runs only while on screen.
import { gsap, reduceMotion } from '../core/scroll.js';

const PHRASES = [
  { t: 'Shop the M1.', href: './shop.html?p=m1-obsidian', c: 'acid' },
  { t: '21 left. Then never.', href: '#drop', c: 'blue' },
  { t: 'Get closer.', href: '#details', c: 'acid' },
  { t: 'Who is out at 2 am?', href: '#who-title', c: 'blue' },
  { t: 'Code DROP01 · −10%', href: './shop.html', c: 'acid' },
  { t: 'Portable summer.', href: '#spec', c: 'blue' },
  { t: 'After dark, in frames.', href: '#look-title', c: 'acid' },
  { t: '800 fill. −25 °C.', href: '#spec', c: 'blue' },
  { t: 'Write to the studio.', href: './contact.html', c: 'acid' },
  { t: 'What keeps you warm?', href: '#manifesto', c: 'blue' },
  { t: 'Two pieces. One drop.', href: '#row-title', c: 'acid' },
  { t: 'Repaired for life.', href: './contact.html', c: 'blue' },
];
const WORDS = ['DROP01', 'CELL78', '800 FP', '−25 °C', 'funnel collar', 'satin ripstop', '420 g', 'Prague', 'M1 / 78C', 'no restock', 'cell 41', 'why cold?', 'after dark', '2 am', 'offset zip', 'RDS down'];
const IMAGES = ['m1-acid-rain-sm.webp', 'm1-hand-sm.webp', 'm1-goggles-sm.webp', 'm1-zip-sm.webp', 'arctic-front-sm.webp', 'arctic-back-sm.webp', 'm1-chest-sm.webp', 'm1-d-collar-sm.webp'];
const GLYPHS = 'ABCDEFGHKLMNPRSTUVXYZ0123456789#%/+−';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const pad3 = (n) => String(Math.round(n)).padStart(3, '0');

export function mountSignal(root) {
  const sec = root.querySelector('.signal');
  if (!sec) return () => {};
  const field = sec.querySelector('[data-signal-field]'), svg = sec.querySelector('[data-signal-lines]');
  const link = sec.querySelector('[data-signal-link]'), text = sec.querySelector('[data-signal-text]'), idxEl = sec.querySelector('[data-signal-idx]');
  const mobile = innerWidth < 820;
  const N = mobile ? 9 : 16;
  const base = new URL('./images/', location.href).href;

  // build tracker boxes once; they are moved, never re-created
  const boxes = [];
  for (let i = 0; i < N; i++) {
    const el = document.createElement('div');
    el.className = 'trk' + (i % 5 === 0 ? ' trk--blue' : '');
    el.innerHTML = '<i class="trk__img"></i><b class="trk__x">+</b><span class="trk__lab"></span>';
    field.appendChild(el);
    boxes.push({ el, img: el.firstChild, lab: el.lastChild, x: 0, y: 0, w: 0, h: 0 });
  }
  const paths = boxes.map(() => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); svg.appendChild(p); return p; });
  const hub = document.createElementNS('http://www.w3.org/2000/svg', 'path'); hub.classList.add('is-hub'); svg.appendChild(hub);

  let W = 0, H = 0;
  const size = () => { W = sec.clientWidth; H = sec.clientHeight; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); };

  const place = (b, instant) => {
    // keep the centre band (the phrase) mostly clear
    const big = Math.random() < 0.22;
    const w = big ? rnd(0.16, 0.3) * W : rnd(0.04, 0.13) * W, h = big ? w * rnd(0.6, 1.1) : w * rnd(0.5, 1.4);
    let x = rnd(0.02, 0.98) * W - w / 2, y = rnd(0.05, 0.95) * H - h / 2;
    if (Math.abs(y + h / 2 - H / 2) < H * 0.14 && Math.abs(x + w / 2 - W / 2) < W * 0.3) y += (y < H / 2 ? -1 : 1) * H * 0.22;
    x = Math.max(4, Math.min(W - w - 4, x)); y = Math.max(4, Math.min(H - h - 4, y));
    const showImg = Math.random() < 0.55;
    b.img.style.backgroundImage = showImg ? `url(${base}${pick(IMAGES)})` : 'none';
    b.img.style.backgroundPosition = `${rnd(0, 100)}% ${rnd(0, 100)}%`;
    b.el.classList.toggle('has-img', showImg);
    b.lab.textContent = Math.random() < 0.6 ? `X${pad3((x / W) * 160)}Y${pad3((y / H) * 160)}` : pick(WORDS);
    // size snaps (one layout per move), position glides on the compositor (transform only)
    b.w = w; b.h = h; b.el.style.width = `${w | 0}px`; b.el.style.height = `${h | 0}px`;
    if (instant) { b.x = x; b.y = y; b.el.style.transform = `translate3d(${x | 0}px, ${y | 0}px, 0)`; return; }
    b.fx = b.x; b.fy = b.y; b.tx = x; b.ty = y; moving.add(b);
  };
  const moving = new Set();
  const glide = () => {
    if (!moving.size) return;
    const list = [...moving]; moving.clear();
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: 0.32, ease: 'expo.out', onUpdate: () => {
      list.forEach((b) => { b.x = b.fx + (b.tx - b.fx) * o.t; b.y = b.fy + (b.ty - b.fy) * o.t; b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`; });
      draw();                                   // lines are redrawn only while something moves
    } });
  };

  // dashed curves: each box to the next, plus the hub to the phrase
  const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
  const curve = ([x1, y1], [x2, y2], k = 0.35) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(mx - dy * k).toFixed(1)} ${(my + dx * k).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  let order = boxes.map((_, i) => i);
  const draw = () => {
    paths.forEach((p, i) => p.setAttribute('d', curve(center(boxes[order[i]]), center(boxes[order[(i + 1) % N]]), i % 2 ? 0.3 : -0.4)));
    const c = [W / 2, H / 2];
    hub.setAttribute('d', [0, 1, 2].map((k) => curve(center(boxes[order[k * 3 % N]]), c, 0.25)).join(' '));
  };

  // phrase flip: scramble then settle, with a flash
  let pi = 0, hold = false, flip = false;
  const setPhrase = (i) => {
    const p = PHRASES[i];
    link.href = p.href;
    link.dataset.c = p.c;
    idxEl.textContent = String(i + 1).padStart(2, '0');
    const final = p.t;
    if (reduceMotion) { text.textContent = final; return; }
    // restart the flash without forcing a layout: alternate between two identical animations
    flip = !flip; sec.classList.toggle('is-flash', flip); sec.classList.toggle('is-flash-b', !flip);
    const o = { k: 0 };
    gsap.to(o, { k: 1, duration: 0.28, ease: 'none', onUpdate: () => {
      const n = Math.floor(o.k * final.length);
      text.textContent = final.slice(0, n) + [...final.slice(n)].map((ch) => (ch === ' ' ? ' ' : pick(GLYPHS))).join('');
    }, onComplete: () => (text.textContent = final) });
  };

  let timer = 0, running = false, beat = 0;
  const step = () => {
    if (!hold) { pi = (pi + 1) % PHRASES.length; setPhrase(pi); }
    // move a handful of boxes each beat, reshuffle the links now and then
    for (let k = 0; k < (mobile ? 2 : 4); k++) place(pick(boxes));
    if (++beat % 3 === 0) order = order.sort(() => Math.random() - 0.5);
    glide();
  };
  const start = () => { if (running || reduceMotion) return; running = true; timer = setInterval(step, 820); };
  const stop = () => { running = false; clearInterval(timer); };

  size(); boxes.forEach((b) => place(b, true)); draw(); setPhrase(0);
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '100px' });
  io.observe(sec);
  const onEnter = () => { hold = true; sec.classList.add('is-hold'); };
  const onLeave = () => { hold = false; sec.classList.remove('is-hold'); };
  link.addEventListener('pointerenter', onEnter); link.addEventListener('pointerleave', onLeave);
  link.addEventListener('focus', onEnter); link.addEventListener('blur', onLeave);
  const onResize = () => { size(); boxes.forEach((b) => place(b, true)); draw(); };
  addEventListener('resize', onResize);

  return () => { stop(); io.disconnect(); removeEventListener('resize', onResize); };
}
