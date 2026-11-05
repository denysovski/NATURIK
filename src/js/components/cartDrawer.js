import { bag } from './store.js';
import { formatPrice, FREE_SHIPPING, PRODUCTS, totalStock } from '../data/products.js';
import { lockScroll, unlockScroll, gsap } from '../core/scroll.js';
import { openCheckout } from './checkout.js';
import { toast } from './toast.js';

const $ = (s, r = document) => r.querySelector(s);

export function initCart() {
  const drawer = $('[data-cart]'), overlay = $('[data-overlay]');
  if (!drawer) return;
  const body = $('[data-cart-body]', drawer), foot = $('[data-cart-foot]', drawer);

  const open = () => {
    drawer.classList.add('is-open'); overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false'); lockScroll();
    setTimeout(() => drawer.focus({ preventScroll: true }), 50);
    gsap.fromTo(drawer.querySelectorAll('.line-item'), { x: 40, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'expo.out', delay: 0.15 });
  };
  const close = () => {
    drawer.classList.remove('is-open'); overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open') && !document.querySelector('.pdp.is-open')) unlockScroll();
  };
  window.naturikCart = { open, close };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); open(); }
    if (e.target.closest('[data-cart-close]') || e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.defaultPrevented && drawer.classList.contains('is-open')) { e.preventDefault(); close(); } });

  body.addEventListener('click', (e) => {
    const li = e.target.closest('[data-key]'); if (!li) return;
    const key = li.dataset.key, item = bag.items.find((i) => i.key === key);
    if (e.target.closest('[data-inc]')) {
      if (item.qty >= Math.min(item.product.stock[item.size], 2)) toast('Limited drop — max 2 per size per customer.');
      bag.setQty(key, item.qty + 1);
    }
    if (e.target.closest('[data-dec]')) bag.setQty(key, item.qty - 1);
    if (e.target.closest('[data-remove]')) {
      gsap.to(li, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => bag.remove(key) });
    }
  });
  body.addEventListener('click', (e) => {
    const add = e.target.closest('[data-upsell]'); if (!add) return;
    window.naturikOpenProduct?.(add.dataset.upsell);
    if (!window.naturikOpenProduct) location.href = `./shop.html?p=${add.dataset.upsell}`;
  });
  foot.addEventListener('click', (e) => {
    if (e.target.closest('[data-checkout-start]')) { close(); setTimeout(openCheckout, 250); }
  });

  bag.subscribe(() => render());

  function render() {
    const items = bag.items, count = bag.count();
    document.querySelectorAll('[data-cart-count]').forEach((n) => { n.textContent = count; n.classList.toggle('has-items', count > 0); });
    const lbl = $('[data-cart-count-label]'); if (lbl) lbl.textContent = `(${count})`;
    const t = bag.totals();
    if (!items.length) {
      const pick = PRODUCTS.filter((p) => totalStock(p) > 0).slice(0, 2);
      body.innerHTML = `<div class="empty-state">
          <svg aria-hidden="true"><use href="#i-bag"/></svg>
          <p class="t-h3">Your bag is empty.</p>
          <p class="t-muted">Drop 01 is live while pieces last.</p>
          <a class="btn btn--dark" href="./shop.html"><span class="btn__label">Shop the drop</span><svg class="btn__icon"><use href="#i-arrow"/></svg></a>
        </div>
        <p class="t-mono t-muted" style="margin:10px 0 4px">Still in stock</p>
        ${pick.map((p) => `<button class="line-item" style="width:100%;text-align:left" type="button" data-upsell="${p.slug}">
          <img class="line-item__img" src="${p.images[0].sm}" alt="" loading="lazy"><span><span class="line-item__name">${p.fullName}</span><br><span class="line-item__meta">${totalStock(p)} pieces left</span></span><span class="line-item__price">${formatPrice(p.price)}</span></button>`).join('')}`;
      foot.innerHTML = `<p class="t-mono t-muted" style="text-align:center">Free EU shipping over ${formatPrice(FREE_SHIPPING)} · 30-day returns</p>`;
      return;
    }
    const left = Math.max(0, FREE_SHIPPING - (t.subtotal - t.discount));
    const pct = Math.min(100, ((t.subtotal - t.discount) / FREE_SHIPPING) * 100);
    body.innerHTML = `
      <div class="ship-meter">
        <div class="stock__row t-mono"><span>${left > 0 ? `${formatPrice(left)} away from free shipping` : 'Free express-tracked EU shipping unlocked'}</span><span>${Math.round(pct)}%</span></div>
        <div class="stock__bar"><span class="stock__fill" style="--p:${pct}%"></span></div>
      </div>
      ${items.map((i) => `
        <div class="line-item" data-key="${i.key}">
          <img class="line-item__img" src="${i.product.images[0].sm}" alt="${i.product.fullName}" loading="lazy">
          <div>
            <p class="line-item__name">${i.product.name}</p>
            <p class="line-item__meta">${i.product.colorName} · Size ${i.size}</p>
            <p class="line-item__meta">${i.product.stock[i.size] <= 2 ? `<span class="low-note">Only ${i.product.stock[i.size]} left in ${i.size}</span>` : 'In stock'}</p>
            <p class="line-item__meta line-item__ship">Ships in 24 h</p>
            <div class="line-item__row">
              <div class="qty" role="group" aria-label="Quantity"><button type="button" data-dec aria-label="Decrease quantity">−</button><output>${i.qty}</output><button type="button" data-inc aria-label="Increase quantity">+</button></div>
              <button class="line-item__remove" type="button" data-remove>Remove</button>
            </div>
          </div>
          <p class="line-item__price">${formatPrice(i.qty * i.product.price)}</p>
        </div>`).join('')}`;
    foot.innerHTML = `
      <div class="totals">
        <div class="totals__row"><span>Subtotal</span><span>${formatPrice(t.subtotal)}</span></div>
        ${t.discount ? `<div class="totals__row"><span>${t.discountLabel}</span><span>−${formatPrice(t.discount)}</span></div>` : ''}
        <div class="totals__row"><span>Shipping</span><span>${t.shipping ? 'From ' + formatPrice(t.shipping) : '<span class="is-free">Free</span>'}</span></div>
        <div class="totals__row totals__row--grand"><span>Total <span class="t-mono t-muted">incl. VAT</span></span><span>${formatPrice(t.total)}</span></div>
      </div>
      <button class="btn btn--dark btn--block" type="button" data-checkout-start><svg class="btn__icon" style="width:16px"><use href="#i-lock"/></svg><span class="btn__label">Secure checkout</span></button>
      <p class="t-mono t-muted" style="text-align:center">Pieces are reserved for 15 min once checkout starts</p>`;
  }
}
