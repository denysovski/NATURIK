import { lockScroll, unlockScroll } from '../core/scroll.js';

// Generic modal controller: [data-modal="name"], closes on backdrop / [data-modal-close] / Esc. Restores focus.
const stack = [];
let lastFocus = null;

export function openModal(name) {
  const m = document.querySelector(`[data-modal="${name}"]`); if (!m) return null;
  lastFocus = document.activeElement;
  m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
  stack.push(m); lockScroll();
  requestAnimationFrame(() => { const f = m.querySelector('[autofocus], input, button, [href]'); f?.focus({ preventScroll: true }); });
  return m;
}
export function closeModal(m = stack[stack.length - 1]) {
  if (!m) return;
  m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
  stack.splice(stack.indexOf(m), 1);
  if (!stack.length && !document.querySelector('[data-cart].is-open') && !document.querySelector('.pdp.is-open')) unlockScroll();
  m.dispatchEvent(new CustomEvent('modal:close'));
  lastFocus?.focus?.({ preventScroll: true });
}
export function initModals() {
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-modal-close]');
    if (c) closeModal(c.closest('[data-modal]'));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length) { e.preventDefault(); closeModal(); } });   // handled: Esc closes only the top layer
}
export const modalOpen = () => stack.length > 0;
