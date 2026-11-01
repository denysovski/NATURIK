import { initApp } from '../core/app.js';
import { gsap, ScrollTrigger, lenis } from '../core/scroll.js';
import { Flip } from 'gsap/Flip';
import { initReveals } from '../components/ui.js';
import { productCard } from '../components/productCard.js';
import { initPdpRouting } from '../components/pdp.js';
import { PRODUCTS, totalStock, SITE_URL } from '../data/products.js';

gsap.registerPlugin(Flip);
initApp();

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const grid = $('[data-grid]');
const params = new URLSearchParams(location.search);
let filter = ['black', 'white', 'm1', 'c3', 'l7'].includes(params.get('c')) ? params.get('c') : 'all', sort = 'featured';

if (!grid.children.length) grid.innerHTML = PRODUCTS.map((p, i) => productCard(p, { eager: i < 3, index: i })).join('');
$('[data-shop-total]').textContent = PRODUCTS.reduce((a, p) => a + totalStock(p), 0);
$('[data-n="all"]').textContent = PRODUCTS.length;
$('[data-n="black"]').textContent = PRODUCTS.filter((p) => p.color === 'black').length;
$('[data-n="white"]').textContent = PRODUCTS.filter((p) => p.color === 'white').length;

// ItemList for search engines
$('#ld-list').textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}shop.html?p=${p.slug}`, name: p.fullName })) });

const matches = (el) => filter === 'all' || el.dataset.color === filter || el.dataset.model === filter;
function apply(animate = true) {
  const cards = $$('[data-grid] .p-card');
  const state = Flip.getState(cards);
  const order = [...PRODUCTS].sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : sort === 'scarce' ? totalStock(a) - totalStock(b) : 0);
  order.forEach((p) => grid.appendChild(grid.querySelector(`[data-product="${p.slug}"]`)));
  let n = 0;
  cards.forEach((c) => { const on = matches(c); c.hidden = !on; if (on) n++; });
  $('[data-shop-count]').textContent = `${n} piece${n === 1 ? '' : 's'}`;
  $('[data-empty]').hidden = n > 0;
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  if (animate) Flip.from(state, { duration: 0.8, ease: 'expo.inOut', stagger: 0.03, absolute: true, scale: true,
    onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'expo.out' }),
    onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
    onComplete: () => ScrollTrigger.refresh() });
}
document.addEventListener('click', (e) => {
  const f = e.target.closest('[data-filter]'); if (!f) return;
  filter = f.dataset.filter; apply();
  const u = new URL(location.href); if (filter === 'all') u.searchParams.delete('c'); else u.searchParams.set('c', filter); history.replaceState(history.state, '', u);
});
$('[data-sort]').addEventListener('change', (e) => { sort = e.target.value; apply(); });
$$('[data-cols]').forEach((b) => b.addEventListener('click', () => {
  const st = Flip.getState('[data-grid] .p-card');
  grid.dataset.cols = b.dataset.cols; $$('[data-cols]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  Flip.from(st, { duration: 0.8, ease: 'expo.inOut', scale: true, onComplete: () => ScrollTrigger.refresh() });
}));
apply(false);

/* unique browsing: cards rise in a wave, then lean into scroll velocity */
gsap.from('[data-grid] .p-card:not([hidden])', { y: 140, opacity: 0, rotateX: -25, transformOrigin: '50% 0%', stagger: { each: 0.08, grid: 'auto' }, duration: 1.3, ease: 'expo.out', delay: 0.3 });
const skewTo = gsap.quickTo('[data-grid]', 'skewY', { duration: 0.6, ease: 'power3' });
lenis?.on('scroll', ({ velocity }) => skewTo(Math.max(-3, Math.min(3, velocity * -0.12))));
// parallax: middle column drifts against the scroll
gsap.matchMedia().add('(min-width: 900px)', () => {
  gsap.to('[data-grid][data-cols="3"] .p-card:nth-child(3n+2)', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } });
});

initReveals();
initPdpRouting();
