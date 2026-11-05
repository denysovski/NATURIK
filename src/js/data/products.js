// Drop 01 catalogue. Images are placeholders until the real campaign is shot.
const IMG = (n) => {
  const name = typeof n === 'number' ? `look-0${n}` : n;
  return { src: `./images/${name}.webp`, sm: `./images/${name}-sm.webp`, alt: ALT[name] || 'NATURIK Drop 01 campaign image' };
};
const ALT = {
  'm1-editorial-hero': 'M1 Puffer 78C in black worn with knit balaclava, beanie and green ski goggles against a concrete wall',
  'm1-front': 'M1 Puffer 78C front view on model',
  'm1-three': 'M1 Puffer 78C three-quarter view showing chest print and sleeve',
  'm1-side': 'M1 Puffer 78C side profile',
  'm1-back': 'M1 Puffer 78C back view',
  'm1-back-three': 'M1 Puffer 78C back three-quarter view',
  'm1-detail-print': 'Close-up of the grey M1 chest print',
  'm1-detail-sleeve': 'Close-up of the reflective sleeve wordmark',
  'm1-detail-collar': 'Funnel collar zipped up over a knit balaclava',
  'm1-detail-hood': 'Collar from behind with vertical seams',
  'm1-detail-zip': 'Offset two-way zip detail',
  'm1-detail-open': 'Jacket opened showing the inner lining',
  'm1-editorial-back': 'Back of the M1 Puffer showing collar and baffles',
  'm1-editorial-sleeve': 'Shoulder and sleeve of the M1 Puffer with chest print',
  'm1-chest': 'Black M1 chest print and sleeve wordmark, close',
  'm1-acid-rain': 'Black puffer splashed with green paint in the rain',
  'm1-goggles': 'Green goggles over a knit balaclava and the black collar',
  'm1-hand': 'Green hand print on the wet black chest panel',
  'm1-zip': 'Offset two-way zip on the black shell',
  'arctic-front': 'Arctic white puffer, three-quarter front view',
  'arctic-back': 'Arctic white puffer from behind, collar up',
  'arctic-shoulder': 'Arctic white shoulder with reflective wordmark',
  'arctic-full': 'Arctic white puffer, front view with green goggles',
  'arctic-splash-close': 'Arctic white chest panel splashed with green, close',
  'arctic-splash-front': 'Arctic white puffer splashed with green in the rain, front',
  'arctic-splash-turn': 'Arctic white puffer splashed with green, turning to camera',
};

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SIZE_CHART = {
  // garment measurements in cm (oversized by design)
  m1: { chest: [128, 134, 140, 146, 152, 158], length: [70, 72, 74, 76, 78, 80], sleeve: [86, 88, 90, 92, 94, 96] },
  c3: { chest: [132, 138, 144, 150, 156, 162], length: [56, 58, 60, 62, 64, 66], sleeve: [84, 86, 88, 90, 92, 94] },
  l7: { chest: [126, 132, 138, 144, 150, 156], length: [112, 115, 118, 121, 124, 127], sleeve: [86, 88, 90, 92, 94, 96] },
};
// body measurements each size is cut for
export const BODY_CHART = { height: [165, 172, 178, 184, 190, 196], chest: [86, 92, 98, 104, 110, 116] };

const base = {
  m1: {
    model: 'm1', family: 'M1 Puffer 78C', fit: 'Oversized', length: 'Hip', price: 890, edition: 100,
    tagline: '78 hand-filled down cells. One funnel collar. Built for −25 °C city nights.',
    description: 'The jacket the drop is named after. Seventy-eight individually baffled cells of 800-fill responsible down, sealed in a satin-finish recycled ripstop that throws light like wet asphalt. The two-cell funnel collar zips to the bridge of your nose, the offset zip keeps a clean chest panel for the reflective M1 print, and dropped shoulders give the silhouette its heavy, sculpted volume.',
    specs: [['Fill', '800 FP RDS down, 420 g'], ['Shell', '20D recycled nylon ripstop, satin cire'], ['Finish', 'PFC-free DWR'], ['Rating', 'Comfort to −25 °C'], ['Weight', '1.62 kg (size M)'], ['Cells', '78 sewn-through baffles']],
    features: ['Two-cell funnel collar with chin guard', 'Offset two-way YKK® Aquaguard® zip', 'Reflective M1 chest print', 'Fleece-lined hand-warmer pockets', 'Internal phone + goggle pocket', 'Elastic storm cuffs'],
  },
  c3: {
    model: 'c3', family: 'C3 Cropped Cell', fit: 'Boxy oversized', length: 'Cropped', price: 690, edition: 110,
    tagline: 'Fewer cells, more volume. Cropped at the waist, built to layer.',
    description: 'A short, boxy cut with three oversized baffles that sit high on the body — made for wide trousers and long layers underneath. Same down, same shell, same collar engineering as the M1 in a lighter, louder proportion.',
    specs: [['Fill', '800 FP RDS down, 300 g'], ['Shell', '20D recycled nylon ripstop, satin cire'], ['Finish', 'PFC-free DWR'], ['Rating', 'Comfort to −15 °C'], ['Weight', '1.18 kg (size M)'], ['Cells', '54 sewn-through baffles']],
    features: ['Single-cell stand collar', 'Offset two-way zip', 'Cropped elastic hem', 'Hand-warmer pockets', 'Packs into its own inner pocket'],
  },
  l7: {
    model: 'l7', family: 'L7 Long Cell Coat', fit: 'Relaxed A-line', length: 'Below knee', price: 1150, edition: 40,
    tagline: 'Full-length warmth. Eight rows of down from collar to calf.',
    description: 'The longest piece in the drop, cut in a slight A-line so it moves when you walk. Two-way zip opens from the hem for stride, and the collar is the same tall two-cell construction as the M1.',
    specs: [['Fill', '800 FP RDS down, 560 g'], ['Shell', '20D recycled nylon ripstop, satin cire'], ['Finish', 'PFC-free DWR'], ['Rating', 'Comfort to −30 °C'], ['Weight', '2.05 kg (size M)'], ['Cells', '112 sewn-through baffles']],
    features: ['Two-cell funnel collar', 'Two-way zip with stride opening', 'Side-entry pockets', 'Inner zip pocket', 'Back vent with snap'],
  },
};

const colorways = {
  obsidian: { color: 'black', colorName: 'Obsidian', swatch: '#060607' },
  arctic: { color: 'white', colorName: 'Arctic', swatch: '#e2e2df' },
};

function make(model, cw, stock, imgs, extra = {}) {
  const b = base[model], c = colorways[cw], family = extra.family || b.family;
  return {
    id: `${model}-${cw}`, slug: `${model}-${cw}`,
    ...b, ...c, stock, images: imgs.map(IMG), ...extra,
    family, name: family, fullName: `${family} — ${c.colorName}`,
  };
}

export const PRODUCTS = [
  // Drop 01 is one jacket in two colourways. Each card carries every photo of its colour, rain shots included.
  make('m1', 'obsidian', { XS: 6, S: 12, M: 16, L: 15, XL: 10, XXL: 6 }, ['m1-editorial-hero', 'm1-back', 'm1-front', 'm1-three', 'm1-side', 'm1-acid-rain', 'm1-hand', 'm1-goggles', 'm1-chest', 'm1-zip', 'm1-editorial-sleeve', 'm1-editorial-back', 'm1-detail-print'], { hero: true, edition: 250, family: 'M1 Puffer 77C' }),
  make('m1', 'arctic', { XS: 3, S: 8, M: 11, L: 10, XL: 6, XXL: 3 }, ['arctic-splash-turn', 'arctic-full', 'arctic-front', 'arctic-back', 'arctic-shoulder', 'arctic-splash-front', 'arctic-splash-close'], { edition: 250, family: 'M1 Puffer 78C' }),
];

export const bySlug = (s) => PRODUCTS.find((p) => p.slug === s);
export const totalStock = (p) => Object.values(p.stock).reduce((a, b) => a + b, 0);
// the whole drop: every piece of every silhouette, black and white together (500 made)
export const DROP_EDITION = PRODUCTS.reduce((a, p) => a + p.edition, 0);
export const dropLeft = (color) => PRODUCTS.filter((p) => !color || p.color === color).reduce((a, p) => a + totalStock(p), 0);
export const dropMade = (color) => PRODUCTS.filter((p) => !color || p.color === color).reduce((a, p) => a + p.edition, 0);
export const sizeLeft = (size) => PRODUCTS.reduce((a, p) => a + (p.stock[size] || 0), 0);
export const formatPrice = (n) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const FREE_SHIPPING = 300;
export const SITE_URL = 'https://denysovski.github.io/NATURIK/';
