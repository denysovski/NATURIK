// Shared UI behaviours. Each one is opt-in through a data attribute, so any page can reuse them.
import { gsap, ScrollTrigger, lenis, reduceMotion } from '../core/scroll.js';
import { PRODUCTS, totalStock } from '../data/products.js';
import { toast } from './toast.js';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- split text: [data-split="lines|words|chars"] ---------- */
export function split(el, mode = el.dataset.split || 'words') {
  if (el.dataset.splitDone) return el.querySelectorAll('.word, .char');
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  // walk text nodes only, so inline elements (<em>, <span class="hl">, <br>) keep their tags and styles
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) { if (n.tagName !== 'BR') walk(n); return; }
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
        const mask = document.createElement('span'); mask.className = 'line-mask'; mask.style.display = 'inline-block';
        const word = document.createElement('span'); word.className = 'word';
        if (mode === 'chars') [...w].forEach((c) => { const ch = document.createElement('span'); ch.className = 'char'; ch.textContent = c; word.appendChild(ch); });
        else word.textContent = w;
        mask.appendChild(word); frag.appendChild(mask);
      });
      n.replaceWith(frag);
    });
  };
  walk(el);
  el.dataset.splitDone = '1';
  return el.querySelectorAll(mode === 'chars' ? '.char' : '.word');
}

export function initReveals(scope = document) {
  if (reduceMotion) return;
  fitHeadlines(scope);
  $$('[data-split]', scope).forEach((el) => {
    const parts = split(el);
    gsap.from(parts, { yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: el.dataset.split === 'chars' ? 0.025 : 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onComplete: () => el.classList.add('is-revealed') });
  });
  $$('[data-rise] .fit-line', scope).forEach((el, i) => {
    gsap.fromTo(el, { yPercent: 60, opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { yPercent: 0, opacity: 1, clipPath: 'inset(-20% -10% -20% -10%)', duration: 1.2, ease: 'expo.out', delay: 0.15 + i * 0.12 });
  });
  $$('[data-reveal]', scope).forEach((el) => {
    gsap.from(el, { opacity: 0, duration: 0.6, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  $$('[data-reveal-stagger]', scope).forEach((el) => {
    gsap.from(el.children, { opacity: 0, duration: 0.6, ease: 'power1.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
}

/* ---------- auto-fit: [data-fit] headlines shrink until they fit their box (no clipped swashes) ---------- */
export function fitHeadlines(scope = document) {
  $$('[data-fit]', scope).forEach((el) => {
    el.style.fontSize = '';
    const max = parseFloat(getComputedStyle(el).fontSize);
    const cs = getComputedStyle(el);
    const box = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let size = max;
    // measure the real ink width (swash glyphs overhang their advance), keep ~4% safety
    const ink = () => { let w = 0; el.querySelectorAll('.fit-line').forEach((l) => (w = Math.max(w, l.getBoundingClientRect().width))); return w || el.scrollWidth; };
    for (let i = 0; i < 18 && ink() > box * 0.95; i++) { size *= 0.94; el.style.fontSize = `${size}px`; }
  });
}

/* ---------- counters: [data-count="78"] ---------- */
export function initCounters(scope = document) {
  $$('[data-count]', scope).forEach((el) => {
    const end = +el.dataset.count, pad = el.dataset.pad ? +el.dataset.pad : 0;
    // start from the smallest number with the same digit count (800 from 100, 25 from 10)
    const start = el.dataset.countFrom ? +el.dataset.countFrom : end >= 10 ? 10 ** (String(Math.round(end)).length - 1) : 0;
    const o = { v: start };
    const fmt = (v) => String(Math.round(v)).padStart(pad, '0');
    if (reduceMotion) { el.textContent = fmt(end); return; }
    el.textContent = fmt(start);
    gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => (el.textContent = fmt(o.v)) });
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
  const update = (y) => {
    const menuOpen = document.querySelector('[data-mobile-menu].is-open');
    last = y;
    const probe = 36;
    h.classList.toggle('on-light', !menuOpen && $$('[data-header-light]').some((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; }));
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
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    btn.innerHTML = `<svg aria-hidden="true"><use href="#i-${open ? 'close' : 'menu'}"/></svg>`;
    if (open) { lenis?.stop(); gsap.from(menu.querySelectorAll('.mm-link'), { yPercent: 100, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out', delay: 0.25 }); } else lenis?.start();
  };
  window.naturikMenuClose = () => menu.classList.contains('is-open') && setOpen(false);
  btn.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    setOpen(open);
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
    const txt = e.target.closest?.('[data-cursor]')?.dataset.cursor;
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

/* ---------- curtain: router drives it; make sure it never sticks after bfcache restores ---------- */
function initCurtainFallback() {
  const panel = document.querySelector('[data-curtain-panel]');
  if (panel) window.addEventListener('pageshow', () => gsap.set(panel, { yPercent: 100, visibility: 'hidden' }));
}

/* ---------- footer wordmark: letters rise as the footer enters ---------- */
function initFooter() {
  const w = document.querySelector('[data-footer-word]');
  if (w && !reduceMotion) {
    w.innerHTML = [...w.textContent].map((c) => `<span class="char">${c}</span>`).join(''); w.dataset.splitDone = '1';
    gsap.from(w.children, { yPercent: 100, stagger: 0.05, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: w, start: 'top 95%', once: true } });
  }
  $$('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));
}

/* ---------- image fade-in over shimmer skeletons ---------- */
function initImageLoading() {
  const mark = (img) => { if (img.complete && img.naturalWidth) { img.classList.add('is-loaded'); img.parentElement?.classList.add('media-loaded'); } };
  document.querySelectorAll('img').forEach(mark);
  const prep = (root = document) => root.querySelectorAll('img:not(.fade-in)').forEach((img) => {
    if (img.closest('.loader, .stage, .details__media, .toast, .p-card__media')) return;
    img.classList.add('fade-in'); mark(img);
  });
  prep();
  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') { e.target.classList.add('is-loaded'); e.target.parentElement?.classList.add('media-loaded'); } }, true);
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('is-loaded'); }, true);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && prep(n.tagName === 'IMG' ? n.parentElement : n)))).observe(document.body, { childList: true, subtree: true });
}

/* ---------- scroll progress line ---------- */
function initScrollProgress() {
  const bar = document.querySelector('[data-scroll-progress]'); if (!bar) return;
  const set = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`; };
  if (lenis) lenis.on('scroll', set); else addEventListener('scroll', set, { passive: true });
  set();
}

/* ---------- keyboard focus stays inside the open layer (modal, bag, product panel) ---------- */
function initFocusTrap() {
  const SEL = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const layer = document.querySelector('.modal.is-open .modal__panel') || document.querySelector('[data-cart].is-open') || document.querySelector('.pdp.is-open');
    if (!layer) return;
    const items = [...layer.querySelectorAll(SEL)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (!layer.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

export function initUI() {
  const refit = () => fitHeadlines(document);
  document.fonts?.ready.then(refit); refit();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(refit, 120); });
  document.addEventListener('naturik:page', () => requestAnimationFrame(refit));
  initImageLoading(); initScrollProgress(); initFocusTrap();
  initHeader(); initMenu(); initCursor(); initMagnetic(); initNewsletter(); initCookies(); initCurtainFallback(); initFooter();
  initAccordions(document);
}
