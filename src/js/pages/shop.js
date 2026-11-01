import { gsap, ScrollTrigger, lenis } from '../core/scroll.js';
import { Flip } from 'gsap/Flip';
import { initReveals } from '../components/ui.js';
import { productCard } from '../components/productCard.js';
import { initPdpRouting, closeProduct } from '../components/pdp.js';
import { createSelect } from '../components/select.js';
import { PRODUCTS, totalStock, SITE_URL } from '../data/products.js';

gsap.registerPlugin(Flip);

export function mount(root = document) {
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const cleanups = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };

  const grid = $('[data-grid]');
  const params = new URLSearchParams(location.search);
  let filter = ['black', 'white', 'm1', 'c3', 'l7'].includes(params.get('c')) ? params.get('c') : 'all', sort = 'featured';

  if (!grid.children.length) grid.innerHTML = PRODUCTS.map((p, i) => productCard(p, { eager: i < 3, index: i })).join('');
  $('[data-shop-total]').textContent = PRODUCTS.reduce((a, p) => a + totalStock(p), 0);
  $('[data-n="all"]').textContent = PRODUCTS.length;
  $('[data-n="black"]').textContent = PRODUCTS.filter((p) => p.color === 'black').length;
  $('[data-n="white"]').textContent = PRODUCTS.filter((p) => p.color === 'white').length;
  const ld = $('#ld-list') || document.getElementById('ld-list');
  if (ld) ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}shop.html?p=${p.slug}`, name: p.fullName })) });

  const matches = (el) => filter === 'all' || el.dataset.color === filter || el.dataset.model === filter;
  function apply(animate = true) {
    const cards = $$('[data-grid] .p-card');
    const state = Flip.getState(cards);
    const order = [...PRODUCTS].sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : sort === 'scarce' ? totalStock(a) - totalStock(b) : 0);
    order.forEach((p) => grid.appendChild(grid.querySelector(`[data-product="${p.slug}"]`)));
    let n = 0;
    cards.forEach((c) => { const ok = matches(c); c.hidden = !ok; if (ok) n++; });
    $('[data-shop-count]').textContent = `${n} piece${n === 1 ? '' : 's'}`;
    $('[data-empty]').hidden = n > 0;
    $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    if (animate) Flip.from(state, { duration: 0.75, ease: 'expo.inOut', stagger: 0.03, absolute: true, scale: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.88, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'expo.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.88, duration: 0.35 }),
      onComplete: () => ScrollTrigger.refresh() });
  }
  on(root, 'click', (e) => {
    const f = e.target.closest('[data-filter]'); if (!f) return;
    filter = f.dataset.filter; apply();
    const u = new URL(location.href); if (filter === 'all') u.searchParams.delete('c'); else u.searchParams.set('c', filter); history.replaceState(history.state, '', u);
  });
  const sortSel = createSelect($('[data-sort]'), {
    label: 'Sort',
    options: [['featured', 'Featured'], ['low', 'Price — low to high'], ['high', 'Price — high to low'], ['scarce', 'Fewest left first']],
    onChange: (v) => { sort = v; apply(); },
  });
  cleanups.push(sortSel.destroy);
  $$('[data-cols]').forEach((b) => on(b, 'click', () => {
    const st = Flip.getState($$('[data-grid] .p-card'));
    grid.dataset.cols = b.dataset.cols; $$('[data-cols]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    Flip.from(st, { duration: 0.75, ease: 'expo.inOut', scale: true, onComplete: () => ScrollTrigger.refresh() });
  }));
  apply(false);

  const ctx = gsap.context(() => {
    gsap.from('[data-grid] .p-card:not([hidden])', { y: 120, opacity: 0, stagger: { each: 0.07, grid: 'auto' }, duration: 1.2, ease: 'expo.out', delay: 0.25 });
    initReveals(root);
  });
  // cards lean gently into scroll velocity
  const skewTo = gsap.quickTo(grid, 'skewY', { duration: 0.6, ease: 'power3' });
  const onScroll = ({ velocity }) => skewTo(Math.max(-2, Math.min(2, velocity * -0.08)));
  lenis?.on('scroll', onScroll);
  cleanups.push(() => lenis?.off?.('scroll', onScroll));

  initPdpRouting();
  return () => { closeProduct({ push: false, instant: true }); ctx.revert(); cleanups.forEach((f) => f()); gsap.set(grid, { clearProps: 'all' }); };
}
