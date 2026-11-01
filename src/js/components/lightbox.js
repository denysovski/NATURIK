// Lightbox: any element with data-lb="group" (+ data-lb-src, data-lb-caption) opens a full-size viewer.
// The photo flies from the thumbnail into place, arrows / swipe / keys move through the group.
import { gsap } from '../core/scroll.js';

let el, items = [], idx = 0, origin = null, lastFocus = null;

function build() {
  el = document.createElement('div');
  el.className = 'lb'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Image viewer');
  el.innerHTML = `
    <div class="lb__backdrop" data-lb-close></div>
    <figure class="lb__stage"><img class="lb__img" alt=""><figcaption class="lb__cap t-mono"></figcaption></figure>
    <button class="lb__btn lb__btn--prev" type="button" aria-label="Previous image"><svg style="transform:scaleX(-1)"><use href="#i-arrow"/></svg></button>
    <button class="lb__btn lb__btn--next" type="button" aria-label="Next image"><svg><use href="#i-arrow"/></svg></button>
    <button class="lb__btn lb__close" type="button" data-lb-close aria-label="Close viewer"><svg><use href="#i-close"/></svg></button>
    <div class="lb__dots" aria-hidden="true"></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => { if (e.target.closest('[data-lb-close]')) close(); });
  el.querySelector('.lb__btn--prev').onclick = () => show(idx - 1, -1);
  el.querySelector('.lb__btn--next').onclick = () => show(idx + 1, 1);
  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1, 1);
    if (e.key === 'ArrowLeft') show(idx - 1, -1);
  });
  let sx = null;
  el.addEventListener('pointerdown', (e) => (sx = e.clientX));
  el.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
}

function show(i, dir = 0) {
  if (!items.length) return;
  idx = (i + items.length) % items.length;
  const it = items[idx], img = el.querySelector('.lb__img');
  const set = () => { img.src = it.src; img.alt = it.alt; el.querySelector('.lb__cap').textContent = it.caption || ''; };
  el.querySelectorAll('.lb__dots i').forEach((d, k) => d.classList.toggle('is-on', k === idx));
  if (!dir) { set(); return; }
  gsap.to(img, { x: -dir * 60, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => { set(); gsap.fromTo(img, { x: dir * 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }); } });
}

export function openLightbox(group, start, fromEl) {
  if (!el) build();
  items = group; origin = fromEl; lastFocus = document.activeElement;
  el.querySelector('.lb__dots').innerHTML = items.length > 1 ? items.map(() => '<i></i>').join('') : '';
  el.querySelectorAll('.lb__btn--prev, .lb__btn--next').forEach((b) => (b.hidden = items.length < 2));
  show(start);
  el.classList.add('is-open');
  const img = el.querySelector('.lb__img');
  gsap.fromTo(el.querySelector('.lb__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.fromTo(el.querySelectorAll('.lb__btn, .lb__dots, .lb__cap'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.25, stagger: 0.04 });
  const thumb = fromEl?.querySelector('img') || fromEl;
  const fly = () => {
    if (!thumb?.getBoundingClientRect) { gsap.fromTo(img, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }); return; }
    const a = thumb.getBoundingClientRect(), b = img.getBoundingClientRect();
    gsap.fromTo(img, { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: a.width / b.width, opacity: 0.6 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.85, ease: 'expo.inOut' });
  };
  if (img.complete && img.naturalWidth) fly(); else img.onload = () => { img.onload = null; fly(); };
  setTimeout(() => el.querySelector('.lb__close').focus({ preventScroll: true }), 100);
}

function close() {
  if (!el?.classList.contains('is-open')) return;
  gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => { el.classList.remove('is-open'); gsap.set(el, { clearProps: 'opacity' }); } });
  lastFocus?.focus?.({ preventScroll: true });
}

export function initLightbox() {
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-lb][role="button"]')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lb]'); if (!t) return;
    e.preventDefault();
    const group = [...document.querySelectorAll(`[data-lb="${t.dataset.lb}"]`)];
    const list = group.map((g) => ({ src: g.dataset.lbSrc || g.querySelector('img')?.src, alt: g.querySelector('img')?.alt || '', caption: g.dataset.lbCaption || '' }));
    openLightbox(list, group.indexOf(t), t);
  });
}
