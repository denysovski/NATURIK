import { formatPrice, totalStock, SIZES } from '../data/products.js';

/** One card markup used on the homepage drop row, shop grid and bag upsell. */
export function productCard(p, { eager = false, index = 0 } = {}) {
  const left = totalStock(p);
  const status = left === 0 ? 'Sold out' : left <= 8 ? `${left} left` : 'In stock';
  return `
  <article class="p-card" data-product="${p.slug}" data-color="${p.color}" data-model="${p.model}" style="--i:${index}">
    <div class="p-card__media" data-cursor="View">
      <img src="${p.images[0].src}" alt="${p.images[0].alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="800" height="1000">
      <img src="${(p.images[1] || p.images[0]).src}" alt="" loading="lazy" decoding="async" width="800" height="1000" aria-hidden="true">
      <div class="p-card__badges"><span class="pill ${left <= 8 ? 'pill--cobalt' : ''}">${left > 0 && left <= 8 ? '<i class="dot" aria-hidden="true"></i>' : ''}${status}</span><span class="p-card__swatch" style="background:${p.swatch}" title="${p.colorName}"></span></div>
      <div class="p-card__quick" role="group" aria-label="Quick add ${p.fullName}">
        <span class="p-card__quick-label t-mono">Quick add — size</span>
        ${SIZES.map((s) => `<button class="size-chip size-chip--mini" type="button" data-quick-add="${p.slug}" data-size="${s}" ${p.stock[s] ? '' : 'disabled'} aria-label="Add size ${s}">${s}</button>`).join('')}
      </div>
    </div>
    <a class="p-card__link" href="./shop.html?p=${p.slug}" data-open-product="${p.slug}"><span class="sr-only">View ${p.fullName}</span></a>
    <div class="p-card__info">
      <h3 class="p-card__name">${p.name}</h3><span class="p-card__price">${formatPrice(p.price)}</span>
      <p class="p-card__meta t-mono">${p.colorName} · ${p.fit} · ${p.edition} pcs</p>
    </div>
  </article>`;
}
