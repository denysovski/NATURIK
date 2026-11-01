// Shared UI behaviours. Each one is opt-in through a data attribute, so any page can reuse them.
import { gsap, ScrollTrigger, lenis, reduceMotion } from '../core/scroll.js';
import { PRODUCTS, totalStock } from '../data/products.js';
import { toast } from './toast.js';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- split text: [data-split="lines|words|chars"] ---------- */
export function split(el, mode = el.dataset.split || 'words') {
  if (el.dataset.splitDone) return el.querySelectorAll('.word, .char');
  const text = el.innerHTML;
  const tokens = text.split(/(<br\s*\/?>)/i);
  el.innerHTML = tokens.map((tk) => {
    if (/^<br/i.test(tk)) return '<br>';
    return tk.split(/(\s+)/).map((w) => {
      if (/^\s+$/.test(w) || !w) return w;
      if (/<[^>]+>/.test(w)) return `<span class="line-mask"><span class="word">${w}</span></span>`;
      const inner = mode === 'chars' ? [...w].map((c) => `<span class="char">${c}</span>`).join('') : w;
      return `<span class="line-mask" style="display:inline-block"><span class="word">${inner}</span></span>`;
    }).join('');
  }).join('');
  el.dataset.splitDone = '1';
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  return el.querySelectorAll(mode === 'chars' ? '.char' : '.word');
}

export function initReveals(scope = document) {
  if (reduceMotion) return;
  $$('[data-split]', scope).forEach((el) => {
    const parts = split(el);
    gsap.from(parts, { yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: el.dataset.split === 'chars' ? 0.025 : 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-reveal]', scope).forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', delay: +el.dataset.delay || 0, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('[data-reveal-stagger]', scope).forEach((el) => {
    gsap.from(el.children, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  $$('[data-clip]', scope).forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    const img = el.querySelector('img'); if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-parallax]', scope).forEach((el) => {
    gsap.fromTo(el, { yPercent: -(+el.dataset.parallax || 10) }, { yPercent: +el.dataset.parallax || 10, ease: 'none', scrollTrigger: { trigger: el.parentElement, scrub: true } });
  });
}

/* ---------- counters: [data-count="78"] ---------- */
export function initCounters(scope = document) {
  $$('[data-count]', scope).forEach((el) => {
    const end = +el.dataset.count, pad = el.dataset.pad ? +el.dataset.pad : 0;
    const o = { v: 0 };
    const fmt = (v) => String(Math.round(v)).padStart(pad, '0');
    if (reduceMotion) { el.textContent = fmt(end); return; }
    el.textContent = fmt(0);
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => (el.textContent = fmt(o.v)) });
  });
}

/* ---------- accordions: .acc__btn ---------- */
export function initAccordions(scope = document) {
  scope.addEventListener('click', (e) => {
    const b = e.target.closest('.acc__btn'); if (!b) return;
    const open = b.getAttribute('aria-expanded') === 'true';
    if (b.closest('[data-acc-single]')) $$('.acc__btn', b.closest('[data-acc-single]')).forEach((x) => x.setAttribute('aria-expanded', 'false'));
    b.setAttribute('aria-expanded', String(!open));
    setTimeout(() => ScrollTrigger.refresh(), 600);
  });
}
export const accordion = (items, { single = false, openFirst = false } = {}) => `
  <div class="acc" ${single ? 'data-acc-single' : ''}>${items.map(([q, a], i) => `
    <div class="acc__item"><button class="acc__btn" type="button" aria-expanded="${openFirst && i === 0}" aria-controls="acc-${q.length}-${i}"><span>${q}</span><span class="acc__icon" aria-hidden="true"></span></button>
    <div class="acc__panel" id="acc-${q.length}-${i}" role="region"><div><div class="acc__body">${a}</div></div></div></div>`).join('')}</div>`;

/* ---------- header: hide on scroll down, colour on light sections ---------- */
function initHeader() {
  const h = document.querySelector('[data-header]'); if (!h) return;
  let last = 0;
  const lights = $$('[data-header-light]');
  const update = (y) => {
    const menuOpen = document.querySelector('[data-mobile-menu].is-open');
    h.classList.toggle('is-hidden', !menuOpen && y > last && y > 240);
    last = y;
    const probe = 36;
    h.classList.toggle('on-light', !menuOpen && lights.some((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; }));
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => update(scroll)); else window.addEventListener('scroll', () => update(scrollY));
  update(scrollY);
  const total = PRODUCTS.reduce((a, p) => a + totalStock(p), 0);
  $$('[data-stock-total]').forEach((n) => (n.textContent = total));
}

/* ---------- mobile menu ---------- */
function initMenu() {
  const btn = document.querySelector('[data-menu-toggle]'), menu = document.querySelector('[data-mobile-menu]');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    btn.innerHTML = `<svg aria-hidden="true"><use href="#i-${open ? 'close' : 'menu'}"/></svg>`;
    if (open) { lenis?.stop(); gsap.from(menu.querySelectorAll('.mm-link'), { yPercent: 100, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out', delay: 0.25 }); } else lenis?.start();
  });
}

/* ---------- cursor with contextual labels: [data-cursor="Drag"] ---------- */
function initCursor() {
  if (matchMedia('(hover: none)').matches) return;
  const dot = document.querySelector('[data-cursor-dot]'), label = document.querySelector('[data-cursor-label]');
  if (!dot) return;
  const xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' }), yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
  const lx = gsap.quickTo(label, 'x', { duration: 0.5, ease: 'power3' }), ly = gsap.quickTo(label, 'y', { duration: 0.5, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); lx(e.clientX); ly(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button');
    dot.classList.toggle('is-hover', !!t);
    const txt = t?.closest('[data-cursor]')?.dataset.cursor;
    label.textContent = txt || ''; label.classList.toggle('is-on', !!txt);
  });
}

/* ---------- magnetic elements: [data-magnetic] ---------- */
function initMagnetic() {
  if (matchMedia('(hover: none)').matches) return;
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest('[data-magnetic]');
    $$('[data-magnetic].is-mag').forEach((m) => { if (m !== el) { m.classList.remove('is-mag'); gsap.to(m, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }); } });
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.classList.add('is-mag');
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
  });
}

/* ---------- newsletter (simulated) ---------- */
function initNewsletter() {
  $$('[data-newsletter]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = f.querySelector('input[type=email]'), msg = f.parentElement.querySelector('[data-news-msg]');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok) { if (msg) { msg.style.color = ''; msg.textContent = 'Enter a valid email address.'; } return; }
    const btn = f.querySelector('button'); btn.classList.add('is-loading');
    setTimeout(() => {
      btn.classList.remove('is-loading'); input.value = '';
      if (msg) { msg.style.color = 'var(--c-acid)'; msg.textContent = "You're on the list. Drop 02 lands in your inbox first."; }
      toast("You're on the Drop 02 list.");
    }, 900);
  }));
}

/* ---------- cookie consent ---------- */
function initCookies() {
  const bar = document.querySelector('[data-cookie]'); if (!bar) return;
  let choice = null; try { choice = localStorage.getItem('naturik.cookies'); } catch {}
  if (!choice) setTimeout(() => bar.classList.add('is-open'), 2600);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookie-choice]'); if (!b) return;
    try { localStorage.setItem('naturik.cookies', b.dataset.cookieChoice); } catch {}
    bar.classList.remove('is-open');
    const cur = document.querySelector('[data-cookie-current]'); if (cur) cur.textContent = b.dataset.cookieChoice === 'all' ? 'all cookies' : 'necessary only';
    toast(b.dataset.cookieChoice === 'all' ? 'Preferences saved — all cookies.' : 'Preferences saved — necessary only.');
  });
}

/* ---------- page transitions: curtain out on internal navigation, in on load ---------- */
function initTransitions() {
  const c = document.querySelector('[data-curtain]'); if (!c || reduceMotion) return;
  const bars = c.querySelectorAll('i');
  if (sessionStorage.getItem('naturik.curtain')) {
    sessionStorage.removeItem('naturik.curtain');
    gsap.set(bars, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(bars, { scaleY: 0, duration: 0.9, ease: 'expo.inOut', stagger: 0.05, delay: 0.05 });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.href.split('#')[0] === location.href.split('#')[0] || /^mailto|tel/.test(a.href)) return;
    if (!/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    sessionStorage.setItem('naturik.curtain', '1');
    gsap.set(bars, { transformOrigin: 'bottom' });
    gsap.to(bars, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', stagger: 0.05, onComplete: () => (location.href = url.href) });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(bars, { scaleY: 0 }); });
}

/* ---------- footer wordmark: letters rise as the footer enters ---------- */
function initFooter() {
  const w = document.querySelector('[data-footer-word]');
  if (w && !reduceMotion) {
    w.innerHTML = [...w.textContent].map((c) => `<span>${c}</span>`).join('');
    gsap.from(w.children, { yPercent: 100, stagger: 0.05, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: w, start: 'top 95%', once: true } });
  }
  $$('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));
}

export function initUI() {
  initHeader(); initMenu(); initCursor(); initMagnetic(); initNewsletter(); initCookies(); initTransitions(); initFooter();
  initAccordions(document);
}
