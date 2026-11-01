import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { PRODUCTS, totalStock, SITE_URL } from './src/js/data/products.js';
import { productCard } from './src/js/components/productCard.js';

// Build-time content so crawlers (and first paint) get real product markup, not an empty grid.
const PRERENDER = {
  products: () => PRODUCTS.map((p, i) => productCard(p, { eager: i < 3, index: i })).join(''),
  'ld-products': () => `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': PRODUCTS.map((p) => ({
      '@type': 'Product', '@id': `${SITE_URL}shop.html?p=${p.slug}#product`, name: p.fullName, sku: p.slug.toUpperCase(),
      brand: { '@type': 'Brand', name: 'NATURIK' }, color: p.colorName, description: p.description,
      image: p.images.slice(0, 4).map((im) => new URL(im.src, SITE_URL).href),
      offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'EUR', url: `${SITE_URL}shop.html?p=${p.slug}`,
        availability: totalStock(p) ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut',
        itemCondition: 'https://schema.org/NewCondition',
        shippingDetails: { '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CZ' }, deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' } } },
        hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'CZ', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 30, returnFees: 'https://schema.org/FreeReturn' } },
    })),
  })}</script>`,
};

// <!-- @include header {"page":"home"} --> → partials/header.html, with {{page}} vars and active-link helpers
function partials() {
  const render = (html) => html.replace(/<!--\s*@render\s+([\w-]+)\s*-->/g, (_, k) => PRERENDER[k]()).replace(/<!--\s*@include\s+([\w-]+)\s*(\{.*?\})?\s*-->/g, (_, name, json) => {
    const vars = json ? JSON.parse(json) : {};
    let out = readFileSync(resolve(__dirname, `partials/${name}.html`), 'utf8');
    out = out.replace(/\{\{active:(\w+)\}\}/g, (_, p) => (vars.page === p ? 'is-active" aria-current="page' : ''));
    out = out.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
    return render(out);
  });
  return { name: 'naturik-partials', transformIndexHtml: { order: 'pre', handler: render }, handleHotUpdate({ file, server }) { if (file.includes('/partials/')) server.ws.send({ type: 'full-reload' }); } };
}

export default defineConfig({
  base: './',
  plugins: [partials()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        shop: resolve(__dirname, 'shop.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
