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

const bars = () => [...document.querySelectorAll('[data-curtain] i')];
function cover() {
  if (reduceMotion || document.hidden) return Promise.resolve();
  // never let a paused animation (background tab) block navigation
  return new Promise((r) => { setTimeout(r, 900); gsap.timeline({ onComplete: r })
    .set(bars(), { transformOrigin: 'bottom' })
    .to(bars(), { scaleY: 1, duration: 0.5, ease: 'expo.inOut', stagger: 0.04 })
    .to('main', { opacity: 0.4, y: -30, duration: 0.5, ease: 'expo.inOut' }, 0); });
}
function reveal() {
  if (reduceMotion) { gsap.set('main', { clearProps: 'all' }); return; }
  gsap.set('main', { opacity: 1 });
  gsap.timeline()
    .set(bars(), { transformOrigin: 'top' })
    .fromTo('main', { y: 40, opacity: 1 }, { y: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform' }, 0.05)
    .to(bars(), { scaleY: 0, duration: 0.65, ease: 'expo.inOut', stagger: 0.04 }, 0);
}

async function go(href, { push = true } = {}) {
  const url = new URL(href, location.href);
  if (busy) return;
  busy = true;
  const htmlP = fetchPage(url.href);
  window.naturikMenuClose?.();
  window.naturikCart?.close();
  try {
    const [html] = await Promise.all([htmlP, cover()]);
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
    lenis?.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0);
    current = mounts[next]?.(fresh) || null;
    document.dispatchEvent(new CustomEvent('naturik:page', { detail: { page: next } }));
    ScrollTrigger.refresh();
    if (url.hash) setTimeout(() => { const t = document.querySelector(url.hash); if (t) lenis?.scrollTo(t, { offset: -20 }); }, 300);
    reveal();
  } catch {
    location.href = url.href;                      // graceful fallback: real navigation
  } finally {
    busy = false;
  }
}

export function initRouter(pageMounts) {
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
  (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(() => document.querySelectorAll('.nav a').forEach((a) => fetchPage(a.href).catch(() => {})));

  window.addEventListener('popstate', () => {
    const want = new URL(location.href);
    const wantPage = /shop/.test(want.pathname) ? 'shop' : /contact/.test(want.pathname) ? 'contact' : 'home';
    if (wantPage !== document.body.dataset.page) go(want.href, { push: false });
  });
}
