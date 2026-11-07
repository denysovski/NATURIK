// Simulated checkout: Contact → Delivery → Payment → Review → Confirmation. No data leaves the browser.
import { bag, SHIPPING } from './store.js';
import { formatPrice } from '../data/products.js';
import { openModal, closeModal } from './modal.js';
import { gsap } from '../core/scroll.js';

const STEPS = ['Contact', 'Delivery', 'Payment', 'Review'];
const COUNTRIES = [['Czech Republic', 'CZ'], ['Austria', 'AT'], ['Belgium', 'BE'], ['Denmark', 'DK'], ['Finland', 'FI'], ['France', 'FR'], ['Germany', 'DE'], ['Ireland', 'IE'], ['Italy', 'IT'], ['Netherlands', 'NL'], ['Norway', 'NO'], ['Poland', 'PL'], ['Portugal', 'PT'], ['Slovakia', 'SK'], ['Spain', 'ES'], ['Sweden', 'SE'], ['Switzerland', 'CH'], ['United Kingdom', 'GB']];

let state, root, timer;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const luhn = (num) => { let s = 0, alt = false; for (let i = num.length - 1; i >= 0; i--) { let n = +num[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } s += n; alt = !alt; } return s % 10 === 0; };
const brand = (n) => (/^4/.test(n) ? 'VISA' : /^(5[1-5]|2[2-7])/.test(n) ? 'MASTERCARD' : /^3[47]/.test(n) ? 'AMEX' : '');
function addBusinessDays(d, n) { const r = new Date(d); while (n > 0) { r.setDate(r.getDate() + 1); if (r.getDay() % 6) n--; } return r; }
const fmtDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export function openCheckout() {
  root = document.querySelector('[data-checkout]');
  if (!root) return;
  if (!bag.count()) { window.naturikCart?.open(); return; }
  state = { step: 0, data: { country: 'Czech Republic', ship: 'standard', pay: 'card', news: true }, errors: {}, reserved: Date.now() + 15 * 60 * 1000 };
  openModal('checkout');
  render();
  clearInterval(timer);
  timer = setInterval(tick, 1000);
  root.closest('[data-modal]').addEventListener('modal:close', () => clearInterval(timer), { once: true });
}

function tick() {
  const el = root.querySelector('[data-reserve]'); if (!el) return;
  const left = Math.max(0, state.reserved - Date.now());
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  el.textContent = `${m}:${String(s).padStart(2, '0')}`;
}

function summary() {
  const t = bag.totals(state.data.ship);
  return `
  <aside class="co-summary">
    <div class="co-summary__head"><p class="t-mono">Order summary</p><p class="t-mono t-muted">Reserved <b data-reserve>15:00</b></p></div>
    <ul class="co-items">${bag.items.map((i) => `
      <li><span class="co-items__img"><img src="${i.product.images[0].sm}" alt=""><b>${i.qty}</b></span>
        <span><span class="co-items__name">${esc(i.product.name)}</span><span class="t-muted co-items__meta">${i.product.colorName} · ${i.size}</span></span>
        <span>${formatPrice(i.qty * i.product.price)}</span></li>`).join('')}</ul>
    <form class="co-code" data-code novalidate>
      ${bag.code ? `<p class="co-code__applied"><span class="pill pill--cobalt">${bag.code}</span><button class="link-btn t-mono" type="button" data-code-remove>Remove</button></p>`
        : `<label class="sr-only" for="co-code">Discount code</label><input class="field__input" id="co-code" name="code" placeholder="Discount code (try DROP01)" autocomplete="off"><button class="btn btn--ghost" type="submit"><span class="btn__label">Apply</span></button>`}
    </form>
    <p class="field__error" data-code-msg></p>
    <div class="totals">
      <div class="totals__row"><span>Subtotal</span><span>${formatPrice(t.subtotal)}</span></div>
      ${t.discount ? `<div class="totals__row"><span>Discount</span><span>−${formatPrice(t.discount)}</span></div>` : ''}
      <div class="totals__row"><span>Shipping</span><span>${t.shipping ? formatPrice(t.shipping) : '<span class="is-free">Free</span>'}</span></div>
      <div class="totals__row totals__row--grand"><span>Total</span><span>${formatPrice(t.total)}</span></div>
      <div class="totals__row t-muted"><span>incl. VAT 21%</span><span>${formatPrice(t.vat)}</span></div>
    </div>
    <ul class="co-trust t-mono">
      <li><svg><use href="#i-lock"/></svg>Encrypted checkout</li>
      <li><svg><use href="#i-return"/></svg>30-day free returns</li>
      <li><svg><use href="#i-truck"/></svg>Duties &amp; taxes included</li>
    </ul>
  </aside>`;
}

function field(name, label, { type = 'text', auto = '', placeholder = '', hint = '', attrs = '' } = {}) {
  const err = state.errors[name];
  return `<div class="field"><label class="field__label" for="co-${name}">${label}</label>
    <input class="field__input" id="co-${name}" name="${name}" type="${type}" value="${esc(state.data[name])}" ${auto ? `autocomplete="${auto}"` : ''} placeholder="${placeholder}" ${attrs} ${err ? 'aria-invalid="true"' : ''} aria-describedby="co-${name}-e">
    <span class="field__error" id="co-${name}-e">${err || ''}</span>${hint ? `<span class="field__hint">${hint}</span>` : ''}</div>`;
}

function countryField(cur) {
  const code = (COUNTRIES.find(([n]) => n === cur) || COUNTRIES[0])[1];
  return `<div class="field combo" data-combo>
    <span class="field__label" id="co-country-l">Country</span>
    <input type="hidden" name="country" value="${esc(cur)}">
    <button class="field__input combo__btn" type="button" id="co-country" aria-haspopup="listbox" aria-expanded="false" aria-controls="co-country-list" aria-labelledby="co-country-l co-country-v">
      <span class="combo__value" id="co-country-v">${esc(cur)}</span><span class="combo__code">${code}</span><svg class="combo__chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>
    </button>
    <ul class="combo__list" id="co-country-list" role="listbox" tabindex="-1" aria-labelledby="co-country-l" data-lenis-prevent hidden>
      ${COUNTRIES.map(([n, c], i) => `<li class="combo__opt" role="option" id="co-country-o${i}" data-value="${esc(n)}" aria-selected="${n === cur}"><span>${esc(n)}</span><span class="combo__code">${c}</span></li>`).join('')}
    </ul>
  </div>`;
}

function bindCombo(box) {
  const btn = box.querySelector('.combo__btn'), list = box.querySelector('.combo__list'), input = box.querySelector('input[type="hidden"]');
  const opts = [...list.querySelectorAll('[role="option"]')];
  let active = Math.max(0, opts.findIndex((o) => o.getAttribute('aria-selected') === 'true'));
  const mark = (i) => { active = (i + opts.length) % opts.length; opts.forEach((o, k) => o.classList.toggle('is-active', k === active)); list.setAttribute('aria-activedescendant', opts[active].id); opts[active].scrollIntoView({ block: 'nearest' }); };
  const open = () => {
    if (!list.hidden) return;
    list.hidden = false; btn.setAttribute('aria-expanded', 'true');
    const r = btn.getBoundingClientRect(), pr = root.getBoundingClientRect();
    box.classList.toggle('is-up', pr.bottom - r.bottom < 240 && r.top - pr.top > pr.bottom - r.bottom);
    mark(active); list.focus({ preventScroll: true });
    requestAnimationFrame(() => box.classList.add('is-open'));
    document.addEventListener('pointerdown', outside, true);
  };
  const close = (focus = true) => {
    if (list.hidden) return;
    box.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); list.hidden = true;
    document.removeEventListener('pointerdown', outside, true);
    if (focus) btn.focus({ preventScroll: true });
  };
  const pick = (i) => {
    const o = opts[i]; opts.forEach((x) => x.setAttribute('aria-selected', String(x === o)));
    input.value = o.dataset.value; state.data.country = o.dataset.value;
    box.querySelector('.combo__value').textContent = o.dataset.value;
    btn.querySelector('.combo__code').textContent = o.querySelector('.combo__code').textContent;
    close();
  };
  const outside = (e) => { if (!box.contains(e.target)) close(false); };
  btn.addEventListener('click', () => (list.hidden ? open() : close()));
  btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } });
  list.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); mark(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); mark(0); }
    else if (e.key === 'End') { e.preventDefault(); mark(opts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close(false);
    else if (/^[a-z]$/i.test(e.key)) { const k = e.key.toLowerCase(); const from = opts.findIndex((o, i) => i > active && o.dataset.value.toLowerCase().startsWith(k)); const i = from >= 0 ? from : opts.findIndex((o) => o.dataset.value.toLowerCase().startsWith(k)); if (i >= 0) mark(i); }
  });
  opts.forEach((o, i) => { o.addEventListener('pointermove', () => { if (active !== i) mark(i); }); o.addEventListener('click', () => pick(i)); });
}

function stepView() {
  const d = state.data;
  if (state.step === 0) return `
    <h3 class="co-h">Contact</h3>
    <div class="fields">
      ${field('email', 'Email', { type: 'email', auto: 'email', placeholder: 'you@domain.com', hint: 'Order confirmation and tracking go here.' })}
      ${field('phone', 'Phone', { type: 'tel', auto: 'tel', placeholder: '+420 …', hint: 'Only for the courier on delivery day.' })}
      <label class="check"><input type="checkbox" name="news" ${d.news ? 'checked' : ''}><span>Tell me about Drop 02 before it goes public.</span></label>
    </div>`;
  if (state.step === 1) {
    const now = new Date();
    return `
    <h3 class="co-h">Delivery</h3>
    <div class="fields">
      <div class="fields fields--2">${field('first', 'First name', { auto: 'given-name' })}${field('last', 'Last name', { auto: 'family-name' })}</div>
      ${field('address', 'Address', { auto: 'address-line1', placeholder: 'Street and number' })}
      <div class="fields fields--3">${field('city', 'City', { auto: 'address-level2' })}${field('zip', 'Postcode', { auto: 'postal-code' })}
        ${countryField(d.country)}</div>
      <fieldset class="co-choices"><legend class="field__label">Shipping method</legend>
        ${Object.entries(SHIPPING).map(([k, m]) => {
          const t = bag.totals(k);
          const eta = m.days[0] === m.days[1] ? fmtDate(addBusinessDays(now, m.days[0])) : `${fmtDate(addBusinessDays(now, m.days[0]))} – ${fmtDate(addBusinessDays(now, m.days[1]))}`;
          return `<label class="choice"><input type="radio" name="ship" value="${k}" ${d.ship === k ? 'checked' : ''}><span>${m.label}<span class="choice__sub">${m.sub} · arrives ${eta}</span></span><b>${t.shipping ? formatPrice(t.shipping) : '<span class="is-free">Free</span>'}</b></label>`;
        }).join('')}
      </fieldset>
    </div>`;
  }
  if (state.step === 2) return `
    <h3 class="co-h">Payment</h3>
    <p class="co-note t-mono">Demo store — use test card 4242 4242 4242 4242. Nothing is charged.</p>
    <fieldset class="co-choices co-choices--row"><legend class="sr-only">Payment method</legend>
      <label class="choice"><input type="radio" name="pay" value="card" ${d.pay === 'card' ? 'checked' : ''}><span>Card<span class="choice__sub">Visa, Mastercard, Amex</span></span><b class="t-mono">${brand((d.card || '').replace(/\s/g, '')) || 'CARD'}</b></label>
      <label class="choice"><input type="radio" name="pay" value="wallet" ${d.pay === 'wallet' ? 'checked' : ''}><span>Apple Pay / Google Pay<span class="choice__sub">Confirm on your device</span></span><b class="t-mono">WALLET</b></label>
      <label class="choice"><input type="radio" name="pay" value="klarna" ${d.pay === 'klarna' ? 'checked' : ''}><span>Klarna — pay in 30 days<span class="choice__sub">No interest, no fees</span></span><b class="t-mono">LATER</b></label>
    </fieldset>
    ${d.pay === 'card' ? `<div class="fields co-card">
      ${field('cardName', 'Name on card', { auto: 'cc-name' })}
      ${field('card', 'Card number', { auto: 'cc-number', placeholder: '1234 1234 1234 1234', attrs: 'inputmode="numeric" maxlength="23" data-mask="card"' })}
      <div class="fields fields--2 co-card__row">${field('exp', 'Expiry', { auto: 'cc-exp', placeholder: 'MM / YY', attrs: 'inputmode="numeric" maxlength="7" data-mask="exp"' })}${field('cvc', 'CVC', { auto: 'cc-csc', placeholder: '123', attrs: 'inputmode="numeric" maxlength="4"' })}</div>
    </div>` : `<p class="co-note co-card">You'll confirm the payment in a secure window after placing the order.</p>`}`;
  const t = bag.totals(d.ship), m = SHIPPING[d.ship];
  return `
    <h3 class="co-h">Review</h3>
    <dl class="co-review">
      <div><dt class="t-mono">Contact</dt><dd>${esc(d.email)}<br>${esc(d.phone)}</dd><button type="button" class="link-btn t-mono" data-goto="0">Edit</button></div>
      <div><dt class="t-mono">Ship to</dt><dd>${esc(d.first)} ${esc(d.last)}<br>${esc(d.address)}, ${esc(d.zip)} ${esc(d.city)}<br>${esc(d.country)}</dd><button type="button" class="link-btn t-mono" data-goto="1">Edit</button></div>
      <div><dt class="t-mono">Method</dt><dd>${m.label}<br><span class="t-muted">${m.sub}</span></dd><button type="button" class="link-btn t-mono" data-goto="1">Edit</button></div>
      <div><dt class="t-mono">Payment</dt><dd>${d.pay === 'card' ? `${brand(d.card.replace(/\s/g, ''))} •••• ${d.card.replace(/\s/g, '').slice(-4)}` : d.pay === 'wallet' ? 'Apple Pay / Google Pay' : 'Klarna — pay in 30 days'}</dd><button type="button" class="link-btn t-mono" data-goto="2">Edit</button></div>
    </dl>
    <label class="check" style="margin-top:18px"><input type="checkbox" name="terms" ${d.terms ? 'checked' : ''}><span>I accept the <button type="button" class="link-btn" data-legal="terms">terms of sale</button> and have read the <button type="button" class="link-btn" data-legal="withdrawal">right of withdrawal</button>.</span></label>
    <span class="field__error">${state.errors.terms || ''}</span>
    <p class="co-total-line">Total to pay <b>${formatPrice(t.total)}</b></p>`;
}

function render(animate = true) {
  const s = state.step;
  const keep = root.scrollTop;
  root.innerHTML = `
    <button class="icon-btn modal__close" type="button" data-modal-close aria-label="Close checkout"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
    <div class="co">
      <form class="co-main" data-step-form novalidate>
        <header class="co-top">
          <p class="t-mono t-muted">NATURIK — secure checkout</p>
          <h2 class="co-title" id="checkout-title">Checkout</h2>
          <ol class="co-steps" aria-label="Checkout progress">${STEPS.map((n, i) => `<li class="${i < s ? 'is-done' : i === s ? 'is-current' : ''}" ${i === s ? 'aria-current="step"' : ''}>${n}</li>`).join('')}</ol>
        </header>
        <div class="co-step" data-step>${stepView()}</div>
        <div class="co-nav">
          ${s > 0 ? `<button class="btn btn--ghost" type="button" data-back><span class="btn__label">Back</span></button>` : '<span></span>'}
          <button class="btn btn--dark" type="submit"><span class="btn__label">${s === 3 ? 'Place order' : `Continue to ${STEPS[s + 1].toLowerCase()}`}</span><svg class="btn__icon"><use href="#i-arrow"/></svg></button>
        </div>
      </form>
      ${summary()}
    </div>`;
  tick();
  if (animate) gsap.fromTo(root.querySelector('[data-step]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
  else root.scrollTop = keep;
  bind();
}

function collect() {
  root.querySelectorAll('[data-step-form] input, [data-step-form] select').forEach((el) => {
    if (el.type === 'radio') { if (el.checked) state.data[el.name] = el.value; }
    else if (el.type === 'checkbox') state.data[el.name] = el.checked;
    else state.data[el.name] = el.value.trim();
  });
}

function validate() {
  const d = state.data, e = {};
  if (state.step === 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email || '')) e.email = 'Enter a valid email address';
    if ((d.phone || '').replace(/\D/g, '').length < 7) e.phone = 'Enter a phone number for the courier';
  }
  if (state.step === 1) {
    for (const [k, m] of [['first', 'First name'], ['last', 'Last name'], ['address', 'Address'], ['city', 'City']]) if (!d[k]) e[k] = `${m} is required`;
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(d.zip || '')) e.zip = 'Check the postcode';
  }
  if (state.step === 2 && d.pay === 'card') {
    const n = (d.card || '').replace(/\s/g, '');
    if (!d.cardName) e.cardName = 'Name as printed on the card';
    if (n.length < 13 || !luhn(n)) e.card = 'That card number doesn\'t look right';
    const [mm, yy] = (d.exp || '').split('/').map((x) => parseInt(x, 10));
    const now = new Date(), y = 2000 + (yy || 0);
    if (!(mm >= 1 && mm <= 12) || y < now.getFullYear() || (y === now.getFullYear() && mm < now.getMonth() + 1)) e.exp = 'Use MM / YY in the future';
    if (!/^\d{3,4}$/.test(d.cvc || '')) e.cvc = '3–4 digits on the back';
  }
  if (state.step === 3 && !d.terms) e.terms = 'Please accept the terms to place your order';
  state.errors = e;
  return !Object.keys(e).length;
}

function bind() {
  const form = root.querySelector('[data-step-form]');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault(); collect();
    if (!validate()) {
      render();
      const first = root.querySelector('[aria-invalid="true"]');
      first?.focus();
      gsap.fromTo(root.querySelector('[data-step]'), { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    if (state.step < 3) { state.step++; render(); root.scrollTop = 0; } else place();
  });
  form.querySelector('[data-back]')?.addEventListener('click', () => { collect(); state.errors = {}; state.step--; render(); });
  root.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { collect(); state.step = +b.dataset.goto; render(); }));
  form.querySelectorAll('input[name="ship"], input[name="pay"]').forEach((r) => r.addEventListener('change', () => { collect(); render(false); root.querySelector(`input[name="${r.name}"][value="${r.value}"]`)?.focus({ preventScroll: true }); }));
  root.querySelectorAll('[data-combo]').forEach(bindCombo);
  form.querySelectorAll('[data-mask="card"]').forEach((i) => i.addEventListener('input', () => {
    i.value = i.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
    const b = root.querySelector('input[name="pay"][value="card"]')?.closest('.choice')?.querySelector('b'); if (b) b.textContent = brand(i.value.replace(/\s/g, '')) || 'CARD';
  }));
  form.querySelectorAll('[data-mask="exp"]').forEach((i) => i.addEventListener('input', () => {
    const v = i.value.replace(/\D/g, '').slice(0, 4); i.value = v.length > 2 ? `${v.slice(0, 2)} / ${v.slice(2)}` : v;
  }));
  const code = root.querySelector('[data-code]');
  code?.addEventListener('submit', (ev) => {
    ev.preventDefault(); collect();
    const ok = bag.applyCode(code.code?.value);
    if (ok) render(false); else root.querySelector('[data-code-msg]').textContent = 'That code isn\'t valid for this drop.';
  });
  root.querySelector('[data-code-remove]')?.addEventListener('click', () => { collect(); bag.removeCode(); render(false); });
}

function place() {
  const btn = root.querySelector('[data-step-form] button[type="submit"]');
  btn.classList.add('is-loading');
  const d = state.data, t = bag.totals(d.ship), items = bag.items;
  const order = `NTK-${new Date().getFullYear().toString().slice(2)}${String(Math.floor(Math.random() * 1e5)).padStart(5, '0')}`;
  const m = SHIPPING[d.ship];
  const eta = fmtDate(addBusinessDays(new Date(), m.days[1]));
  // staged processing overlay — tells the buyer exactly what is happening
  const ov = document.createElement('div');
  ov.className = 'co-processing'; ov.setAttribute('role', 'status'); ov.setAttribute('aria-live', 'polite');
  ov.innerHTML = `<span class="co-ring" aria-hidden="true"></span><ol class="t-mono"><li>Reserving your pieces</li><li>Authorising payment</li><li>Confirming order</li></ol>`;
  root.appendChild(ov);
  gsap.from(ov, { opacity: 0, duration: 0.3 });
  const lis = ov.querySelectorAll('li');
  lis.forEach((li, i) => { setTimeout(() => { lis.forEach((x, k) => { x.classList.toggle('is-active', k === i); x.classList.toggle('is-done', k < i); }); }, i * 650); });
  setTimeout(() => {
    clearInterval(timer);
    root.innerHTML = `
      <button class="icon-btn modal__close" type="button" data-modal-close aria-label="Close"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
      <div class="co-done">
        <div class="co-done__mark"><svg><use href="#i-check"/></svg></div>
        <p class="t-mono t-muted">Order ${order}</p>
        <h2 class="co-done__title" aria-label="It's yours.">It's yours.</h2>
        <p class="t-lead">Thank you, ${esc(d.first)}. A confirmation is on its way to ${esc(d.email)}. Your piece${items.length > 1 ? 's leave' : ' leaves'} the Prague studio within 24 hours and should arrive by <b>${eta}</b>.</p>
        <ul class="co-done__items">${items.map((i) => `<li><img src="${i.product.images[0].sm}" alt=""><span>${esc(i.product.fullName)}<br><span class="t-muted t-mono">Size ${i.size} · ×${i.qty}</span></span></li>`).join('')}</ul>
        <p class="t-mono">Paid ${formatPrice(t.total)} · ${m.label}</p>
        <p class="co-note t-mono">This is a demo store. No order was placed and no payment was taken.</p>
        <div class="co-done__actions"><a class="btn btn--dark" href="./shop.html"><span class="btn__label">Keep browsing</span></a><button class="btn btn--ghost" type="button" data-modal-close><span class="btn__label">Close</span></button></div>
      </div>`;
    root.scrollTop = 0;
    gsap.from(root.querySelectorAll('.co-done > *'), { y: 30, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out' });
    gsap.from(root.querySelector('.co-done__mark'), { scale: 0, rotate: -90, duration: 1, ease: 'elastic.out(1, 0.5)' });
    bag.clear();
  }, 2100);
}

export { closeModal as closeCheckout };
