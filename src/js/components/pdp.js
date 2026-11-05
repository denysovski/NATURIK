// Product detail panel: gallery (photos + live 3D), sizes with stock, size finder, fit scale, delivery ETA, details.
import { bySlug, PRODUCTS, SIZES, SIZE_CHART, formatPrice, totalStock, SITE_URL } from '../data/products.js';
import { gsap, lockScroll, unlockScroll, reduceMotion } from '../core/scroll.js';
import { accordion } from './ui.js';
import { recommendSize } from './sizeAdvisor.js';
import { addToBag } from '../core/app.js';
import { openLegal } from './legal.js';

let panel, current, selected, unit = 'cm';

// one small fact per gallery photo; the same facts for both colourways, shuffled differently per jacket
const FACTS = ['800 FP goose down, RDS certified', '420 g of down in 78 cells', 'Comfort rated to −25 °C', '1.62 kg in size M',
  'Offset two-way YKK® Aquaguard® zip', 'Shot after dark in Prague', '20D recycled ripstop, satin cire', 'The collar zips to the bridge of your nose',
  'Piece number stitched inside the collar', 'One night at −40 °C before it got its rating', 'No logo on the jacket. Only M1.', 'Re-loft service, for life',
  'Patterned in Prague, sewn in Portugal', 'PFC-free water repellent', 'The zip was pulled 10,000 times in a cold room', 'Inner pocket fits a phone and goggles'];
const SPOTS = ['tl', 'bl', 'tr'];
function factsFor(p) {
  let seed = [...p.slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const list = [...FACTS]; for (let i = list.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [list[i], list[j]] = [list[j], list[i]]; }
  return p.images.map((_, i) => ({ text: list[i % list.length], spot: SPOTS[(i + (rnd() * 3 | 0)) % 3] }));
}

function addBusinessDays(d, n) { const r = new Date(d); while (n > 0) { r.setDate(r.getDate() + 1); if (r.getDay() % 6) n--; } return r; }

function ensurePanel() {
  if (panel) return panel;
  panel = document.createElement('div');
  panel.className = 'pdp'; panel.setAttribute('data-lenis-prevent', '');   // wheel scrolls the panel, not the page behind it
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Product details');
  document.body.appendChild(panel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.defaultPrevented && panel.classList.contains('is-open') && !document.querySelector('.modal.is-open')) closeProduct(); });
  return panel;
}

const sizeChart = (p) => {
  const c = SIZE_CHART[p.model];
  const v = (n) => (unit === 'cm' ? n : (n / 2.54).toFixed(1));
  return `<table class="size-table"><thead><tr><th>${unit}</th>${SIZES.map((s) => `<th>${s}</th>`).join('')}</tr></thead><tbody>
    <tr><th>Chest</th>${c.chest.map((x) => `<td>${v(x)}</td>`).join('')}</tr>
    <tr><th>Length</th>${c.length.map((x) => `<td>${v(x)}</td>`).join('')}</tr>
    <tr><th>Sleeve</th>${c.sleeve.map((x) => `<td>${v(x)}</td>`).join('')}</tr></tbody></table>`;
};

function template(p) {
  const left = totalStock(p), sold = p.edition - left;
  const sibling = PRODUCTS.find((x) => x.model === p.model && x.slug !== p.slug);
  const eta = addBusinessDays(new Date(), 4).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return `
  <div class="pdp__bar">
    <nav class="t-mono pdp__crumbs" aria-label="Breadcrumb"><a href="./">Home</a> / <a href="./shop.html" data-pdp-close>Shop</a> / <span aria-current="page">${p.name}</span></nav>
    <button class="icon-btn" type="button" data-pdp-close aria-label="Close product"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
  </div>
  <div class="pdp__grid">
    <section class="pdp__gallery" aria-label="Gallery">
      <div class="pdp__stage" data-stage>
        <div class="pdp__slides" data-slides tabindex="0" aria-label="Product images, use arrow keys">
          ${(() => { const f = factsFor(p); return p.images.map((im, i) => `<figure class="pdp__slide"><img src="${im.src}" alt="${im.alt}" ${i ? 'loading="lazy"' : ''} decoding="async"><figcaption class="pdp__fact pdp__fact--${f[i].spot}">${f[i].text}</figcaption></figure>`).join(''); })()}
        </div>
        <div class="pdp__nav"><button class="icon-btn icon-btn--dark" type="button" data-prev aria-label="Previous image"><svg style="transform:scaleX(-1)"><use href="#i-arrow"/></svg></button><span class="pdp__dots" data-counter aria-hidden="true">${p.images.map((_, i) => `<i class="${i ? '' : 'is-on'}"></i>`).join('')}</span><button class="icon-btn icon-btn--dark" type="button" data-next aria-label="Next image"><svg><use href="#i-arrow"/></svg></button></div>
      </div>
      <div class="pdp__thumbs" data-thumbs>${p.images.map((im, i) => `<button type="button" class="${i ? '' : 'is-active'}" data-thumb="${i}" aria-label="Show image ${i + 1}"><img src="${im.sm}" alt="" loading="lazy"></button>`).join('')}</div>
    </section>

    <section class="pdp__info" aria-labelledby="pdp-title">
      <p class="t-mono t-muted pdp__kicker">First drop. Limited edition.</p>
      <h1 class="pdp__title" id="pdp-title">${p.name}</h1>
      <div class="pdp__row pdp__row--price"><p class="pdp__price">${formatPrice(p.price)}</p><span class="info" tabindex="0" role="button" aria-label="Price information: VAT included, duties paid">i<span class="info__bubble" role="tooltip">VAT incl. · duties paid</span></span></div>
      <p class="pdp__tag">${p.tagline}</p>

      <div class="stock pdp__edition">
        <div class="stock__row t-mono"><span>${left ? `${left} of ${p.edition} left` : 'Sold out'}</span><span>${Math.round((sold / p.edition) * 100)}% claimed</span></div>
        <div class="stock__bar"><span class="stock__fill" style="--p:${(sold / p.edition) * 100}%"></span></div>
      </div>

      <div class="pdp__block">
        <div class="pdp__label"><span class="t-mono">Colour — ${p.colorName}</span></div>
        <div class="pdp__colors">
          <span class="pdp__color is-active" style="--sw:${p.swatch}" title="${p.colorName}"><span class="sr-only">${p.colorName}, selected</span></span>
          ${sibling ? `<a class="pdp__color" href="./shop.html?p=${sibling.slug}" data-open-product="${sibling.slug}" style="--sw:${sibling.swatch}" title="${sibling.colorName}"><span class="sr-only">Switch to ${sibling.colorName}</span></a>` : ''}
        </div>
      </div>

      <div class="pdp__block">
        <div class="pdp__label"><span class="t-mono" data-size-label>Size</span><button type="button" class="link-btn t-mono" data-size-guide>Size guide</button></div>
        <div class="size-grid" role="radiogroup" aria-label="Size">
          ${SIZES.map((s) => `<button type="button" class="size-chip ${p.stock[s] && p.stock[s] <= 2 ? 'is-low' : ''}" ${p.stock[s] ? '' : 'is-soldout'}" data-size="${s}" aria-pressed="false" aria-label="${s}${p.stock[s] ? (p.stock[s] <= 2 ? `, only ${p.stock[s]} left` : '') : ', sold out — join the waitlist'}">${s}</button>`).join('')}
        </div>
        <p class="t-mono t-muted pdp__stock-note" data-stock-note aria-live="polite"></p>
        <div class="waitlist" data-waitlist hidden></div>
      </div>

      <details class="pdp__finder" data-finder>
        <summary><svg><use href="#i-ruler"/></svg><span>Find my size <span class="t-muted">— 20 seconds</span></span><span class="acc__icon" aria-hidden="true"></span></summary>
        <form class="pdp__finder-form" novalidate>
          <div class="fields fields--2">
            <div class="field"><label class="field__label" for="f-h">Height (cm)</label><input class="field__input" id="f-h" name="height" type="number" inputmode="numeric" pattern="[0-9]*" min="140" max="215" placeholder="182"></div>
            <div class="field"><label class="field__label" for="f-c">Chest (cm) <span class="t-muted">or weight</span></label><input class="field__input" id="f-c" name="chest" type="number" inputmode="numeric" pattern="[0-9]*" min="40" max="160" placeholder="100"></div>
          </div>
          <fieldset class="seg pdp__fitpick"><legend class="sr-only">Preferred fit</legend>
            <button type="button" aria-pressed="false" data-fit="slim">Closer</button><button type="button" aria-pressed="true" data-fit="regular">As designed</button><button type="button" aria-pressed="false" data-fit="max">Extra volume</button>
          </fieldset>
          <button class="btn btn--ghost btn--block" type="submit"><span class="btn__label">Recommend my size</span></button>
          <p class="pdp__finder-out" data-finder-out aria-live="polite"></p>
        </form>
      </details>


      <div class="pdp__cta">
        <button class="btn btn--block pdp__add" type="button" data-add disabled><span class="btn__label">Select a size</span></button>
        <p class="pdp__eta"><svg aria-hidden="true"><use href="#i-truck"/></svg>Order today — arrives by ${eta}</p>
      </div>

      <ul class="pdp__trust">
        <li><svg><use href="#i-return"/></svg><span><b>30-day free returns</b><br><span class="t-muted">Exchanges held for you</span></span></li>
        <li><svg><use href="#i-repair"/></svg><span><b>Lifetime repair</b><br><span class="t-muted">Free for 2 years</span></span></li>
        <li><svg><use href="#i-lock"/></svg><span><b>Duties paid</b><br><span class="t-muted">No fees on delivery</span></span></li>
      </ul>

      ${accordion([
        ['Description', `<p>${p.description}</p>`],
        ['Details & features', `<ul>${p.features.map((f) => `<li>${f}</li>`).join('')}</ul>`],
        ['Materials & warmth', `<dl class="spec-list">${p.specs.map(([k, v]) => `<div><dt class="t-mono">${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`],
        ['Size & measurements', `<div class="pdp__label" style="margin-bottom:10px"><span class="t-mono">Garment measurements</span><div class="seg" data-unit><button type="button" aria-pressed="true" data-u="cm">cm</button><button type="button" aria-pressed="false" data-u="in">in</button></div></div><div data-chart>${sizeChart(p)}</div><p style="margin-top:10px">Model is 186 cm / 6'1" with a 98 cm chest and wears size M.</p>`],
        ['Care', '<ul><li>Air out instead of washing</li><li>Delicate 30 °C with down wash</li><li>Tumble low with tennis balls</li><li>Store hanging, never compressed</li></ul>'],
        ['Shipping & returns', '<p>Ships from Prague within 24 h. Standard EU 2–4 days (free over €300), express 1–2 days. 30-day free returns with the prepaid label in the parcel.</p>'],
      ], { single: false })}
    </section>
  </div>
  <div class="pdp__sticky" data-sticky><span><b>${p.name}</b><br><span class="t-mono t-muted" data-sticky-size>Select a size</span></span><button class="btn btn--acid" type="button" data-sticky-add><span class="btn__label">${formatPrice(p.price)} — Add</span></button></div>`;
}

const BASE_META = {};
function setMeta(p) {
  const pairs = [
    ['link[rel="canonical"]', 'href', `${SITE_URL}shop.html?p=${p.slug}`],
    ['meta[name="description"]', 'content', `${p.fullName} — ${p.tagline} ${formatPrice(p.price)}, limited to ${p.edition} pieces. Free EU shipping over €300, 30-day returns.`],
    ['meta[property="og:title"]', 'content', `${p.fullName} | NATURIK`],
    ['meta[property="og:url"]', 'content', `${SITE_URL}shop.html?p=${p.slug}`],
    ['meta[property="og:image"]', 'content', new URL(p.images[0].src, SITE_URL).href],
  ];
  pairs.forEach(([sel, attr, val]) => { const el = document.head.querySelector(sel); if (!el) return; if (!(sel in BASE_META)) BASE_META[sel] = el.getAttribute(attr); el.setAttribute(attr, val); });
}
function resetMeta() {
  Object.entries(BASE_META).forEach(([sel, val]) => { const el = document.head.querySelector(sel); if (!el) return; el.setAttribute(sel.startsWith('link') ? 'href' : 'content', val); });
}
function setJsonLd(p) {
  let s = document.getElementById('ld-product');
  if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-product'; document.head.appendChild(s); }
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product', name: p.fullName, sku: p.slug.toUpperCase(), brand: { '@type': 'Brand', name: 'NATURIK' },
    description: p.description, color: p.colorName, image: p.images.map((i) => new URL(i.src, SITE_URL).href),
    offers: { '@type': 'Offer', priceCurrency: 'EUR', price: p.price, url: `${SITE_URL}shop.html?p=${p.slug}`, availability: totalStock(p) ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut', itemCondition: 'https://schema.org/NewCondition' },
  });
}

export function openProduct(slug, { from, push = true } = {}) {
  const p = bySlug(slug); if (!p) return;
  ensurePanel();
  const wasOpen = panel.classList.contains('is-open');
  // switching colour inside the open page: the current page slides out and the other colourway slides in from the side
  if (wasOpen && current && current.slug !== p.slug && !reduceMotion) {
    const dir = PRODUCTS.indexOf(p) > PRODUCTS.indexOf(current) ? 1 : -1;
    const old = panel.querySelector('.pdp__grid');
    const keepTop = panel.scrollTop;
    current = p; selected = null;
    const tmp = document.createElement('div'); tmp.innerHTML = template(p);
    const fresh = tmp.querySelector('.pdp__grid');
    panel.classList.add('is-swapping');
    const t0 = old.offsetTop;
    // freeze the sticky gallery where it is on screen, so it slides away as a whole instead of jumping
    const og = old.querySelector('.pdp__gallery'), ogTop = og?.getBoundingClientRect().top;
    Object.assign(old.style, { position: 'absolute', left: 0, right: 0, top: `${t0}px`, pointerEvents: 'none', zIndex: 0 });
    fresh.style.zIndex = 2;   // the new page is drawn on top of the one fading out
    old.setAttribute('inert', ''); old.removeAttribute('id');
    old.before(fresh);                                   // the new grid comes first, so bind() finds its elements
    panel.querySelector('[data-sticky]')?.replaceWith(tmp.querySelector('[data-sticky]'));
    panel.querySelector('.pdp__crumbs [aria-current]').textContent = p.name;
    panel.scrollTop = 0;
    gsap.set(old, { y: -keepTop });                      // the old page stays exactly where it was on screen
    if (og) { Object.assign(og.style, { position: 'relative', top: '0px' }); og.style.transform = `translateY(${ogTop - og.getBoundingClientRect().top}px)`; }
    // the old colourway fades out fully (and drifts a little) while the new one slides in over it
    gsap.to(old, { xPercent: -14 * dir, opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => old.remove() });
    gsap.fromTo(fresh, { xPercent: 100 * dir, opacity: 1 }, { xPercent: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform', onComplete: () => panel.classList.remove('is-swapping') });
    bind(p);
  } else {
    current = p; selected = null;
    panel.innerHTML = template(p);
    panel.scrollTop = 0;
    bind(p);
  }
  document.title = `${p.fullName} — ${formatPrice(p.price)} | NATURIK`;
  setJsonLd(p);
  setMeta(p);
  if (push) history.pushState({ p: slug }, '', `?p=${slug}`);
  if (!wasOpen) {
    panel.classList.add('is-open'); lockScroll();
    const media = from?.querySelector('.p-card__media');
    const target = panel.querySelector('.pdp__slide img');
    if (media && target) {
      // the card blurs under an "Opening an item" spinner until the page is ready, then the page fades in over it
      media.querySelector('.p-card__opening')?.remove();
      media.insertAdjacentHTML('beforeend', '<div class="p-card__opening" aria-hidden="true"><span class="p-card__spin"></span><span>Opening an item</span></div>');
      const ov = media.lastElementChild;
      requestAnimationFrame(() => ov.classList.add('is-on'));
      gsap.set(panel, { opacity: 0 });
      const ready = target.complete ? Promise.resolve() : new Promise((r) => { target.addEventListener('load', r, { once: true }); target.addEventListener('error', r, { once: true }); setTimeout(r, 1500); });
      Promise.all([ready, new Promise((r) => setTimeout(r, 450))]).then(() =>
        gsap.to(panel, { opacity: 1, duration: 0.45, ease: 'power2.out', onComplete: () => ov.remove() }));
    } else gsap.fromTo(panel, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform' });   // no leftover transform: it would trap the fixed mobile buy bar
  }
  if (!wasOpen) gsap.from(panel.querySelectorAll('.pdp__info > *'), { y: 30, opacity: 0, stagger: 0.04, duration: 0.9, ease: 'expo.out', delay: 0.5 });
  setTimeout(() => panel.querySelector('[data-pdp-close].icon-btn')?.focus({ preventScroll: true }), 600);
}

export function closeProduct({ push = true, instant = false } = {}) {
  if (!panel?.classList.contains('is-open')) return;
  if (instant) { panel.classList.remove('is-open'); panel.innerHTML = ''; document.getElementById('ld-product')?.remove(); resetMeta(); unlockScroll(); return; }
  gsap.to(panel, { opacity: 0, y: 30, duration: 0.45, ease: 'power3.in', onComplete: () => { panel.classList.remove('is-open'); gsap.set(panel, { clearProps: 'all' }); panel.innerHTML = ''; } });
  unlockScroll();
  document.title = window.__baseTitle || document.title;
  resetMeta();
  document.getElementById('ld-product')?.remove();
  if (push) history.pushState({}, '', location.pathname);
  document.querySelector(`[data-product="${current?.slug}"] .p-card__link`)?.focus({ preventScroll: true });
}


function bind(p) {
  const $ = (s) => panel.querySelector(s), $$ = (s) => [...panel.querySelectorAll(s)];
  panel.onclick = (e) => {
    const close = e.target.closest('[data-pdp-close]'); if (close) { e.preventDefault(); closeProduct(); return; }
    const sw = e.target.closest('[data-open-product]'); if (sw) { e.preventDefault(); openProduct(sw.dataset.openProduct, { push: true }); }
  };

  /* gallery */
  const slides = $('[data-slides]'), counter = $('[data-counter]'), thumbs = $$('[data-thumb]');
  const count = p.images.length;
  const go = (i) => { i = (i + count) % count; slides.scrollTo({ left: i * slides.clientWidth, behavior: 'smooth' }); };
  let idx = 0;
  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    if (i !== idx) { idx = i; [...counter.children].forEach((d, k) => d.classList.toggle('is-on', k === i)); thumbs.forEach((t, k) => t.classList.toggle('is-active', k === i)); thumbs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
  }, { passive: true });
  $('[data-prev]').onclick = () => go(idx - 1);
  $('[data-next]').onclick = () => go(idx + 1);
  thumbs.forEach((t) => (t.onclick = () => go(+t.dataset.thumb)));
  slides.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
  // drag with the mouse on desktop
  let down = false, sx = 0, sl = 0, moved = false;
  slides.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = slides.scrollLeft; slides.style.scrollSnapType = 'none'; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; slides.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', (e) => { if (!down) return; down = false; slides.style.scrollSnapType = ''; const dx = e.clientX - sx; go(Math.abs(dx) > 60 ? idx + (dx < 0 ? 1 : -1) : idx); });

  /* sizes */
  const add = $('[data-add]'), stickyAdd = $('[data-sticky-add]');
  const select = (s) => {
    selected = s;
    $$('.size-chip[data-size]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.size === s)));
    $('[data-stock-note]').innerHTML = '';
    add.disabled = false; add.querySelector('.btn__label').textContent = `Add to bag — ${formatPrice(p.price)}`;
    $('[data-sticky-size]').textContent = `Size ${s}`;
  };
  const waitlist = $('[data-waitlist]');
  const openWaitlist = (s) => {
    $$('.size-chip[data-size]').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    selected = null; add.disabled = true; add.querySelector('.btn__label').textContent = 'Select a size';
    waitlist.hidden = false;
    waitlist.innerHTML = `<p><b>${s} is sold out.</b> Returns and cancellations happen — we'll email you the moment one comes back, before anyone else.</p>
      <form novalidate><label class="sr-only" for="wl-email">Email for the ${s} waitlist</label><input class="field__input" id="wl-email" type="email" autocomplete="email" placeholder="you@domain.com" required><button class="btn btn--dark" type="submit"><span class="btn__label">Notify me</span></button></form><p class="field__error" aria-live="polite"></p>`;
    gsap.from(waitlist, { height: 0, opacity: 0, duration: 0.5, ease: 'expo.out', clearProps: 'height' });
    waitlist.querySelector('input').focus({ preventScroll: true });
    waitlist.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const v = e.target.querySelector('input').value.trim(), err = waitlist.querySelector('.field__error');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.textContent = 'Enter a valid email address'; return; }
      waitlist.innerHTML = `<p><b>You're on the ${s} waitlist.</b> We'll write to ${v.replace(/[<>&"]/g, '')} if one becomes available.</p>`;
    };
  };
  $$('.size-chip[data-size]').forEach((c) => (c.onclick = () => { if (p.stock[c.dataset.size]) { waitlist.hidden = true; select(c.dataset.size); } else openWaitlist(c.dataset.size); }));
  const doAdd = () => {
    if (!selected) {
      panel.querySelector('.size-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
      gsap.fromTo('.pdp .size-grid', { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      $('[data-stock-note]').innerHTML = '<span style="color:var(--c-danger)">Choose a size first</span>';
      return;
    }
    if (addToBag(p.slug, selected)) { add.classList.add('is-added'); setTimeout(() => add.classList.remove('is-added'), 1200); }
  };
  add.onclick = doAdd; stickyAdd.onclick = doAdd;
  $('[data-size-guide]').onclick = () => openLegal('sizing');

  /* size finder: the panel slides open and closed instead of jumping */
  const finder = $('[data-finder]'), fsum = finder.querySelector('summary'), fbody = finder.querySelector('.pdp__finder-form');
  let fAnim = null;
  fsum.addEventListener('click', (e) => {
    e.preventDefault();
    fAnim?.kill();
    const opening = !finder.open || finder.classList.contains('is-closing');
    if (opening) {
      const h0 = finder.classList.contains('is-closing') ? fbody.offsetHeight : 0;
      finder.classList.remove('is-closing'); finder.open = true;
      fAnim = gsap.fromTo(fbody, { height: h0, opacity: h0 ? 1 : 0 }, { height: 'auto', opacity: 1, duration: 0.6, ease: 'expo.out', clearProps: 'height,opacity' });
      gsap.fromTo(fbody.children, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.04, delay: 0.05, clearProps: 'all' });
    } else {
      finder.classList.add('is-closing');
      fAnim = gsap.to(fbody, { height: 0, opacity: 0, duration: 0.42, ease: 'power3.inOut', onComplete: () => { finder.open = false; finder.classList.remove('is-closing'); gsap.set(fbody, { clearProps: 'height,opacity' }); } });
    }
  });

  /* size finder */
  let fit = 'regular';
  $$('[data-fit]').forEach((b) => (b.onclick = () => { fit = b.dataset.fit; $$('[data-fit]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  $('.pdp__finder-form').onsubmit = (e) => {
    e.preventDefault();
    const f = e.target, h = f.height.value, c = +f.chest.value;
    const out = $('[data-finder-out]');
    if (!h || h < 140 || h > 215) { out.innerHTML = '<span style="color:var(--c-danger)">Enter your height in cm (140–215).</span>'; return; }
    const r = recommendSize({ height: h, chest: c >= 70 ? c : 0, weight: c && c < 70 ? c : 0, fit });
    const avail = p.stock[r.size];
    out.innerHTML = `We recommend <b>${r.size}</b> for ${r.reason}.${avail ? '' : ' That size is sold out — try the other colourway or join the restock list.'}`;
    if (avail) select(r.size);
  };

  /* unit toggle */
  panel.querySelector('[data-unit]')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-u]'); if (!b) return;
    unit = b.dataset.u; panel.querySelectorAll('[data-u]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    panel.querySelector('[data-chart]').innerHTML = sizeChart(p);
  });

  /* sticky bar on small screens when main CTA is off-screen */
  const sticky = $('[data-sticky]');
  const io = new IntersectionObserver(([en]) => sticky.classList.toggle('is-on', !en.isIntersecting), { root: panel });
  io.observe(add);
}

let routed = false;
export function initPdpRouting() {
  const first = !routed; routed = true;
  window.__baseTitle = document.title;
  window.naturikOpenProduct = (slug) => openProduct(slug);
  if (first) document.addEventListener('click', (e) => {
    if (document.body.dataset.page !== 'shop') return;
    const a = e.target.closest('[data-open-product]');
    if (!a || a.closest('.pdp')) return;
    e.preventDefault();
    openProduct(a.dataset.openProduct, { from: a.closest('.p-card') });
  });
  if (first) window.addEventListener('popstate', () => {
    if (document.body.dataset.page !== 'shop') return;
    const slug = new URLSearchParams(location.search).get('p');
    if (slug) openProduct(slug, { push: false }); else closeProduct({ push: false });
  });
  const slug = new URLSearchParams(location.search).get('p');
  if (slug && bySlug(slug)) setTimeout(() => openProduct(slug, { push: false }), 400);
}
