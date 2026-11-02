// Tiny SPA router: same-origin page links are fetched, the <main> is swapped behind a curtain,
// head meta / title / structured data are synced, and the page module re-mounts. No reloads.
import { gsap, ScrollTrigger, lenis, reduceMotion } from './scroll.js';

const cache = new Map();
let busy = false, current = null, mounts = {};

const pageOf = (doc) => doc.body.dataset.page;
const sameDoc = (u) => u.pathname === location.pathname;
const isPageUrl = (u) => u.origin === location.origin && /(\/|\.html)$/.test(u.pathname);

function fetchPage(url) {
  const key = url.split('#')[0].split('?')[0];
  if (!cache.has(key)) cache.set(key, fetch(key, { credentials: 'same-origin' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }).catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
}

function syncHead(doc) {
  document.title = doc.title;
  const sel = ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]', 'meta[property="og:image"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]'];
  sel.forEach((s) => {
    const next = doc.head.querySelector(s), cur = document.head.querySelector(s);
    if (next && cur) cur.replaceWith(next.cloneNode(true)); else if (next) document.head.appendChild(next.cloneNode(true)); else cur?.remove();
  });
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  doc.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { const n = document.createElement('script'); n.type = s.type; if (s.id) n.id = s.id; n.textContent = s.textContent; document.head.appendChild(n); });
}

function syncNav(page) {
  document.querySelectorAll('.nav a, .mobile-menu a.mm-link').forEach((a) => {
    const p = a.getAttribute('href').includes('shop') ? 'shop' : a.getAttribute('href').includes('contact') ? 'contact' : 'home';
    const on = p === page;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

// Transition: a black panel with the wordmark and a loading ring rises over the page,
// the next page is swapped behind it, then the panel lifts away.
const $c = (sel) => document.querySelector(sel);
const LABEL = { home: 'Home', shop: 'Shop', contact: 'Contact' };
let wordSplit = false;
function chars() {
  const w = $c('[data-curtain-word]');
  if (w && !wordSplit) {
    const sup = w.querySelector('sup')?.outerHTML || '';
    const txt = w.firstChild.textContent;
    w.innerHTML = `<span class="curtain__mask">${[...txt].map((ch) => `<span class="curtain__ch">${ch}</span>`).join('')}${sup}</span>`;
    wordSplit = true;
  }
  return [...document.querySelectorAll('.curtain__ch')];
}
// Transition FX: tracked boxes with photo crops and coordinates jump around behind the wordmark,
// stitched by dashed lines, while a terminal log streams in the corner.
const FX_IMG = ['m1-acid-rain-sm', 'm1-hand-sm', 'm1-goggles-sm', 'm1-zip-sm', 'arctic-front-sm', 'arctic-splash-close-sm', 'm1-chest-sm', 'arctic-back-sm'];
const FX_WORD = ['DROP01', 'CELL78', '800 FP', '−25 °C', 'M1 / 78C', 'cell 41', 'no restock', 'after dark', 'funnel collar', '21 left'];
const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[(Math.random() * a.length) | 0];
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[(Math.random() * 16) | 0]).join('');
let fxTimer = 0;
function fxStart(dest) {
  const fx = $c('[data-curtain-fx]'), svg = $c('[data-curtain-lines]'), term = $c('[data-curtain-term]');
  if (!fx || reduceMotion) return;
  const W = innerWidth, H = innerHeight, n = W < 820 ? 6 : 10, base = new URL('./images/', location.href).href;
  fx.querySelectorAll('.cfx').forEach((b) => b.remove());
  const boxes = Array.from({ length: n }, (_, i) => {
    const el = document.createElement('div'); el.className = 'cfx' + (i % 4 === 0 ? ' cfx--blue' : '');
    el.innerHTML = '<i></i><b>+</b><span></span>'; fx.appendChild(el); return el;
  });
  const place = (el) => {
    const w = rnd(0.05, 0.2) * W, h = w * rnd(0.6, 1.3), x = rnd(0, W - w), y = rnd(0, H - h);
    Object.assign(el.style, { transform: `translate3d(${x | 0}px, ${y | 0}px, 0)`, width: `${w | 0}px`, height: `${h | 0}px` });
    el.dataset.cx = x + w / 2; el.dataset.cy = y + h / 2;
    const img = el.firstChild, useImg = Math.random() < 0.6;
    img.style.backgroundImage = useImg ? `url(${base}${pick(FX_IMG)}.webp)` : 'none';
    img.style.backgroundPosition = `${rnd(0, 100) | 0}% ${rnd(0, 100) | 0}%`;
    el.lastChild.textContent = Math.random() < 0.55 ? `X${String(x / W * 160 | 0).padStart(3, '0')}Y${String(y / H * 160 | 0).padStart(3, '0')}` : pick(FX_WORD);
  };
  const lines = () => {
    const c = boxes.map((b) => [+b.dataset.cx, +b.dataset.cy]);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = c.map((p, i) => { const q = c[(i + 1) % c.length], k = i % 2 ? 0.3 : -0.3;
      return `<path d="M${p[0] | 0} ${p[1] | 0} Q${((p[0] + q[0]) / 2 - (q[1] - p[1]) * k) | 0} ${((p[1] + q[1]) / 2 + (q[0] - p[0]) * k) | 0} ${q[0] | 0} ${q[1] | 0}"/>`; }).join('')
      + `<path class="is-hub" d="M${c[0][0] | 0} ${c[0][1] | 0} L${W / 2} ${H / 2} L${c[2][0] | 0} ${c[2][1] | 0}"/>`;
  };
  boxes.forEach(place); lines();
  const page = dest === 'home' ? 'index' : dest;
  const log = [`> naturik route --to ./${page}.html`, `  GET ./${page}.html … 200 OK`, `  session ${hex(8)}-${hex(4)}`, '  decrypting cells  78/78', '  WARN cold_spot_not_found', `  stock.sync m1-obsidian  ${hex(6)}`, `  ERR 0x${hex(4)} restock_disabled (expected)`, '  mounting page …', `  frame ${hex(12)}`];
  term.textContent = ''; let li = 0, tick = 0;
  clearInterval(fxTimer);
  fxTimer = setInterval(() => {
    tick++;
    for (let k = 0; k < 2; k++) place(pick(boxes));
    lines();
    if (li < log.length) term.textContent += (li ? '\n' : '') + log[li++];
    else if (tick % 2) term.textContent += `\n  ${hex(4)} ${hex(8)} ${hex(6)}`;
    const rows = term.textContent.split('\n'); if (rows.length > 11) term.textContent = rows.slice(-11).join('\n');
  }, 70);
}
const fxStop = () => clearInterval(fxTimer);

function cover(dest) {
  const panel = $c('[data-curtain-panel]');
  if (!panel || reduceMotion || document.hidden) return Promise.resolve();
  const label = $c('[data-curtain-label]'); if (label) label.textContent = LABEL[dest] || 'Loading';
  const ch = chars();
  fxStart(dest);
  // never let a paused animation (background tab) block navigation
  return new Promise((r) => { setTimeout(r, 1400); gsap.timeline({ onComplete: r })
    .set(panel, { visibility: 'visible', yPercent: 100 })
    .set(ch, { yPercent: 110 })
    .set('.curtain__meta', { opacity: 0, y: 12 })
    .to(panel, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
    .to('main', { opacity: 0.5, duration: 0.6, ease: 'expo.inOut' }, 0)
    .to(ch, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.035 }, 0.3)
    .to('.curtain__meta', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.4); });
}
function reveal() {
  const panel = $c('[data-curtain-panel]');
  if (reduceMotion || !panel) { gsap.set('main', { clearProps: 'opacity' }); return; }
  gsap.timeline({ delay: 0.15 })
    .to('.curtain__ch', { yPercent: -110, duration: 0.45, ease: 'expo.in', stagger: 0.02 }, 0)
    .to('.curtain__meta', { opacity: 0, duration: 0.25 }, 0)
    .to(panel, { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, 0.2)
    .fromTo('main', { opacity: 0.5 }, { opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'opacity' }, 0.35)
    .set(panel, { visibility: 'hidden', yPercent: 100, onComplete: fxStop });
}

async function go(href, { push = true } = {}) {
  const url = new URL(href, location.href);
  if (busy) return;
  busy = true;
  const htmlP = fetchPage(url.href);
  lenis?.stop();                                 // freeze scrolling while the page swaps
  const swallow = (e) => e.preventDefault();
  window.addEventListener('wheel', swallow, { passive: false }); window.addEventListener('touchmove', swallow, { passive: false });
  window.naturikMenuClose?.();
  window.naturikCart?.close();
  try {
    const dest = /shop/.test(url.pathname) ? 'shop' : /contact/.test(url.pathname) ? 'contact' : 'home';
    const [html] = await Promise.all([htmlP, cover(dest)]);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const next = pageOf(doc);
    current?.();                                   // unmount the old page
    const main = document.querySelector('main');
    const fresh = doc.querySelector('main');
    main.replaceWith(fresh);
    document.body.dataset.page = next;
    document.body.className = doc.body.className;
    syncHead(doc);
    syncNav(next);
    if (push) history.pushState({ page: next }, '', url.pathname + url.search + url.hash);
    // hard reset to the top: kill any running smooth-scroll momentum first
    const toTop = () => { lenis?.scrollTo(0, { immediate: true, force: true }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; window.scrollTo(0, 0); };
    lenis?.stop(); toTop();
    current = mounts[next]?.(fresh) || null;
    document.dispatchEvent(new CustomEvent('naturik:page', { detail: { page: next } }));
    ScrollTrigger.refresh();
    if (!url.hash) toTop();
    lenis?.start();
    if (!url.hash) requestAnimationFrame(() => { toTop(); requestAnimationFrame(toTop); });
    if (url.hash) setTimeout(() => { const t = document.querySelector(url.hash); if (t) lenis?.scrollTo(t, { offset: -20 }); }, 300);
    reveal();
  } catch {
    location.href = url.href;                      // graceful fallback: real navigation
  } finally {
    window.removeEventListener('wheel', swallow); window.removeEventListener('touchmove', swallow);
    lenis?.start();
    busy = false;
  }
}

export function initRouter(pageMounts) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  mounts = pageMounts;
  const page = document.body.dataset.page;
  current = mounts[page]?.(document) || null;
  history.replaceState({ page }, '', location.href);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (!isPageUrl(url)) return;
    if (sameDoc(url)) {
      // same page: let anchors / ?p= product links be handled by their own logic
      if (url.hash && url.search === location.search) return;
      if (url.searchParams.get('p') && document.body.dataset.page === 'shop') return;
      if (!url.search && !url.hash) { e.preventDefault(); lenis?.scrollTo(0, { duration: 1.2 }); return; }
    }
    e.preventDefault();
    go(url.href);
  });
  // warm the cache on intent so the swap is instant
  const warm = (e) => { const a = e.target.closest?.('a[href]'); if (!a) return; const u = new URL(a.href, location.href); if (isPageUrl(u) && !sameDoc(u)) fetchPage(u.href).catch(() => {}); };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('touchstart', warm, { passive: true });
  document.addEventListener('focusin', warm);
  // idle prefetch of the other two pages
  (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(() => { document.querySelectorAll('.nav a').forEach((a) => fetchPage(a.href).catch(() => {})); const im = new Image(); im.decoding = 'async'; im.src = new URL('./images/m1-editorial-hero-stage.webp', location.href).href; });

  window.addEventListener('popstate', () => {
    const want = new URL(location.href);
    const wantPage = /shop/.test(want.pathname) ? 'shop' : /contact/.test(want.pathname) ? 'contact' : 'home';
    if (wantPage !== document.body.dataset.page) go(want.href, { push: false });
  });
}
