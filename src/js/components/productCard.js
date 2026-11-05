import { formatPrice, totalStock, SIZES } from '../data/products.js';

const SIZES_ATTR = '(max-width: 520px) 92vw, (max-width: 900px) 46vw, 30vw';

/** One card markup used on the homepage drop row, shop grid and bag upsell. */
export function productCard(p, { eager = false, index = 0 } = {}) {
  const left = totalStock(p);
  const status = left === 0 ? 'Sold out' : left <= 8 ? `${left} left` : 'In stock';
  return `
  <article class="p-card" data-product="${p.slug}" data-color="${p.color}" data-model="${p.model}" style="--i:${index}">
    <div class="p-card__media" data-cursor="View">
      <img src="${p.images[0].src}" srcset="${p.images[0].sm} 480w, ${p.images[0].src} 1100w" sizes="${SIZES_ATTR}" alt="${p.images[0].alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="800" height="1000">
      <img src="${(p.images[1] || p.images[0]).src}" srcset="${(p.images[1] || p.images[0]).sm} 480w, ${(p.images[1] || p.images[0]).src} 1100w" sizes="${SIZES_ATTR}" alt="" loading="lazy" decoding="async" width="800" height="1000" aria-hidden="true">
      <div class="p-card__badges"><span class="pill ${left <= 8 ? 'pill--live' : ''}">${status}</span><span class="p-card__swatch" style="background:${p.swatch}" title="${p.colorName}"></span></div>
      <span class="p-card__more btn btn--acid btn--s" aria-hidden="true"><span class="btn__label">Read more</span><svg class="btn__icon"><use href="#i-arrow"/></svg></span>
    </div>
    <a class="p-card__link" data-cursor="View" href="./shop.html?p=${p.slug}" data-open-product="${p.slug}"><span class="sr-only">View ${p.fullName}</span></a>
    <div class="p-card__info">
      <h3 class="p-card__name">${p.name}</h3><span class="p-card__price">${formatPrice(p.price)}</span>
      <p class="p-card__meta t-mono">${p.colorName} · ${p.fit} · <span class="p-card__left">${left ? `${left} pieces left` : 'Sold out'}</span></p>
    </div>
  </article>`;
}
