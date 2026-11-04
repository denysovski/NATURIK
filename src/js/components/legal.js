import { openModal } from './modal.js';
import { LEGAL } from '../data/legal.js';
export { LEGAL };

export function openLegal(key) {
  const L = LEGAL[key]; if (!L) return;
  const body = document.querySelector('[data-legal-body]');
  body.innerHTML = `<p class="t-mono t-muted">NATURIK / Information</p><h2>${L.t}</h2>${L.b}`;
  const cur = body.querySelector('[data-cookie-current]');
  if (cur) { let c = null; try { c = localStorage.getItem('naturik.cookies'); } catch {} cur.textContent = c === 'all' ? 'all cookies' : c === 'necessary' ? 'necessary only' : 'not set yet'; }
  openModal('legal');
}

export function initLegal() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-legal]');
    if (b) { e.preventDefault(); openLegal(b.dataset.legal); }
  });
}
