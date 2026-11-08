import { bag } from './store.js';
import { formatPrice, FREE_SHIPPING, PRODUCTS, totalStock, bySlug } from '../data/products.js';
import { HOLD_MS } from './store.js';
import { lockScroll, unlockScroll, gsap } from '../core/scroll.js';
import { openCheckout } from './checkout.js';
import { closeModal } from './modal.js';
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
  body.addEventListener('click', (e) => {
    if (e.target.closest('[data-restore]')) {
      const n = bag.restore();
      toast(n ? `${n === 1 ? 'Piece' : `${n} pieces`} back in your bag — held for another 15 min.` : 'Sorry — those pieces have been taken by someone else.');
    }
    if (e.target.closest('[data-released-dismiss]')) bag.dismissReleased();
  });
  foot.addEventListener('click', (e) => {
    if (e.target.closest('[data-checkout-start]')) { close(); setTimeout(openCheckout, 250); }
  });

  /* ---------- 15-minute hold: live countdown, a 2-minute warning, and the release notice ---------- */
  const fmt = (ms) => { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  let warned = 0, closeWarn = null;
  const tick = () => {
    bag.check();                                     // releases the bag once the hold is over (fires onExpire)
    const left = bag.left(); if (!left) return;
    document.querySelectorAll('[data-hold]').forEach((n) => { n.textContent = fmt(left); });
    document.querySelectorAll('[data-hold-bar]').forEach((n) => { n.style.transform = `scaleX(${(left / HOLD_MS).toFixed(4)})`; });
    document.querySelectorAll('[data-hold-box]').forEach((n) => n.classList.toggle('is-low', left <= 120000));
    if (left <= 120000 && left > 15000 && warned !== bag.until && !document.hidden) {
      warned = bag.until;
      closeWarn = toast(`Your bag is held for <b>${fmt(left)}</b> more. After that the pieces go back to the drop.`, { action: 'Checkout', onAction: () => { close(); openCheckout(); }, duration: 6000 });
    }
  };
  // tell the visitor once: right away if they're here, otherwise as soon as they come back to the tab / site
  const announce = () => {
    const r = bag.released; if (!r || r.seen || document.hidden) return;
    bag.markReleasedSeen();
    const n = r.items.reduce((a, i) => a + i.qty, 0);
    toast(`<b>Your reservation ran out.</b><br>You were inactive for 15 minutes, so we released ${n === 1 ? 'the piece' : `${n} pieces`} in your bag.`,
      { action: 'View bag', onAction: open, duration: 8000 });
  };
  bag.onExpire(() => {
    closeWarn?.(); closeWarn = null;
    const inCheckout = document.querySelector('.modal.is-open[data-modal="checkout"]');
    if (inCheckout) { closeModal(inCheckout); setTimeout(open, 300); }   // the bag explains what happened
    announce();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); announce(); } });
  addEventListener('pageshow', () => { tick(); announce(); });
  bag.subscribe(() => render());
  setInterval(tick, 1000); tick(); setTimeout(announce, 1200);

  function render() {
    const items = bag.items, count = bag.count();
    document.querySelectorAll('[data-cart-count]').forEach((n) => { n.textContent = count; n.classList.toggle('has-items', count > 0); });
    const lbl = $('[data-cart-count-label]'); if (lbl) lbl.textContent = `(${count})`;
    const t = bag.totals();
    const rel = bag.released;
    const relNote = rel ? (() => {
      const list = rel.items.map((i) => { const p = bySlug(i.slug); return p ? `${p.name} · ${i.size}${i.qty > 1 ? ` ×${i.qty}` : ''}` : ''; }).filter(Boolean);
      const when = new Date(rel.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `<div class="released" role="status">
        <p class="released__title">You've been inactive, so we released your reservation.</p>
        <p class="released__text">Pieces are held for 15 minutes. At ${when} these went back to the drop: <b>${list.join(', ')}</b>.</p>
        <div class="released__row"><button class="btn btn--dark btn--sm" type="button" data-restore><span class="btn__label">Add them back</span></button><button class="link-btn t-mono" type="button" data-released-dismiss>Dismiss</button></div>
      </div>`; })() : '';
    if (!items.length) {
      const pick = PRODUCTS.filter((p) => totalStock(p) > 0).slice(0, 2);
      body.innerHTML = `${relNote}<div class="empty-state">
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
    const left0 = bag.left();
    body.innerHTML = `
      <div class="hold${left0 <= 120000 ? ' is-low' : ''}" data-hold-box>
        <div class="hold__row"><span class="hold__label"><svg aria-hidden="true"><use href="#i-lock"/></svg>Reserved for you</span><b class="hold__time" data-hold>${fmt(left0)}</b></div>
        <div class="hold__bar"><span data-hold-bar style="transform:scaleX(${(left0 / HOLD_MS).toFixed(4)})"></span></div>
        <p class="hold__note">Limited drop: pieces are held for 15 min, then released to the next person in line.</p>
      </div>
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
      <p class="t-mono t-muted" style="text-align:center">Held for <span data-hold>${fmt(left0)}</span> · then released to the drop</p>`;
  }
}
