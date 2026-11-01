import { gsap } from '../core/scroll.js';

export function toast(message, { image, action, onAction, duration = 3600 } = {}) {
  const host = document.querySelector('[data-toasts]'); if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `${image ? `<img src="${image}" alt="">` : ''}<div class="toast__body">${message}</div>${action ? `<button class="toast__action" type="button">${action}</button>` : ''}`;
  host.appendChild(el);
  el.querySelector('.toast__action')?.addEventListener('click', () => { onAction?.(); close(); });
  gsap.fromTo(el, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
  const t = setTimeout(close, duration);
  function close() { clearTimeout(t); gsap.to(el, { y: 20, opacity: 0, duration: 0.35, onComplete: () => el.remove() }); }
}
