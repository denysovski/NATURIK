// Boot sequence shared by every page.
import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/components.css';
import '../../styles/pages.css';
import { initScroll } from './scroll.js';
import { initUI } from '../components/ui.js';
import { initModals } from '../components/modal.js';
import { initCart } from '../components/cartDrawer.js';
import { initLegal } from '../components/legal.js';
import { bag } from '../components/store.js';
import { bySlug } from '../data/products.js';
import { toast } from '../components/toast.js';
import { initLightbox } from '../components/lightbox.js';
import { initSocialFab } from '../components/socialFab.js';
import { initPromo } from '../components/promo.js';

export function initApp() {
  initScroll();
  initModals();
  initLegal();
  initCart();
  initUI();
  initLightbox();
  initSocialFab();
  initPromo();
  // quick-add buttons on any product card
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-quick-add]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    addToBag(b.dataset.quickAdd, b.dataset.size);
  });
}

export function addToBag(slug, size) {
  const p = bySlug(slug); if (!p) return false;
  const r = bag.add(slug, size);
  if (r === 'limit') { toast(`Limited drop — max 2 per size. You already have ${size} in your bag.`); return false; }
  toast(`<b>${p.name}</b><br>${p.colorName} · ${size} — added to bag`, { image: p.images[0].sm, action: 'View bag', onAction: () => window.naturikCart?.open() });
  const btn = document.querySelector('.cart-btn');
  if (btn) btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' });
  return true;
}
