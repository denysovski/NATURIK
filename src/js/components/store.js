// Bag state — persisted in localStorage, observable.
import { bySlug, FREE_SHIPPING } from '../data/products.js';

const KEY = 'naturik.bag.v1';
const CODES = { DROP01: { pct: 10, label: 'DROP01 — 10% early access' }, CELL78: { pct: 7.8, label: 'CELL78 — 7.8% off' } };
export const SHIPPING = {
  standard: { label: 'Standard — DHL', sub: '2–4 business days · duties paid', price: 12, freeOver: true, days: [2, 4] },
  express: { label: 'Express — DHL Express', sub: '1–2 business days', price: 24, days: [1, 2] },
  pickup: { label: 'Showroom pickup — Prague', sub: 'Ready in 24 h, by appointment', price: 0, days: [1, 1] },
};
const subs = new Set();
let state = load();

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.items)) return s; } catch {}
  return { items: [], code: null };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} subs.forEach((f) => f(state)); }

export const bag = {
  get items() { return state.items.map((i) => ({ ...i, product: bySlug(i.slug) })).filter((i) => i.product); },
  get code() { return state.code; },
  subscribe(fn) { subs.add(fn); fn(state); return () => subs.delete(fn); },
  add(slug, size, qty = 1) {
    const p = bySlug(slug); if (!p) return false;
    const key = `${slug}:${size}`;
    const ex = state.items.find((i) => i.key === key);
    const max = p.stock[size] ?? 0;
    const want = (ex ? ex.qty : 0) + qty;
    if (want > Math.min(max, 2)) return 'limit';
    if (ex) ex.qty = want; else state.items.push({ key, slug, size, qty });
    save(); return true;
  },
  setQty(key, qty) {
    const i = state.items.find((x) => x.key === key); if (!i) return;
    const p = bySlug(i.slug); const max = Math.min(p.stock[i.size] ?? 0, 2);
    i.qty = Math.max(0, Math.min(max, qty));
    if (!i.qty) state.items = state.items.filter((x) => x !== i);
    save();
  },
  remove(key) { state.items = state.items.filter((x) => x.key !== key); save(); },
  clear() { state = { items: [], code: null }; save(); },
  applyCode(raw) {
    const c = String(raw || '').trim().toUpperCase();
    if (!CODES[c]) return false;
    state.code = c; save(); return CODES[c];
  },
  removeCode() { state.code = null; save(); },
  count() { return state.items.reduce((a, i) => a + i.qty, 0); },
  totals(method = 'standard') {
    const subtotal = this.items.reduce((a, i) => a + i.qty * i.product.price, 0);
    const discount = state.code ? Math.round(subtotal * CODES[state.code].pct) / 100 : 0;
    const m = SHIPPING[method] || SHIPPING.standard;
    const shipping = subtotal === 0 ? 0 : (m.freeOver && subtotal - discount >= FREE_SHIPPING ? 0 : m.price);
    const total = subtotal - discount + shipping;
    return { subtotal, discount, discountLabel: state.code ? CODES[state.code].label : '', shipping, total, vat: total - total / 1.21 };
  },
};
