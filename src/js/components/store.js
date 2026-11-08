// Bag state — persisted in localStorage, observable.
import { bySlug, FREE_SHIPPING } from '../data/products.js';

const KEY = 'naturik.bag.v1';
export const HOLD_MS = 15 * 60 * 1000;          // pieces in the bag are held for 15 minutes, then released
const CODES = { DROP01: { pct: 10, label: 'DROP01 — 10% early access' }, CELL78: { pct: 7.8, label: 'CELL78 — 7.8% off' } };
export const SHIPPING = {
  standard: { label: 'Standard — DHL', sub: '2–4 business days · duties paid', price: 12, freeOver: true, days: [2, 4] },
  express: { label: 'Express — DHL Express', sub: '1–2 business days', price: 24, days: [1, 2] },
  pickup: { label: 'Showroom pickup — Prague', sub: 'Ready in 24 h, by appointment', price: 0, days: [1, 1] },
};
const subs = new Set();
let state = load();
if (state.items.length && !state.until) state.until = Date.now() + HOLD_MS;   // bags saved before holds existed

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.items)) return s; } catch {}
  return { items: [], code: null };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} subs.forEach((f) => f(state)); }
// hold: a new piece in the bag (re)starts the 15-minute reservation; an empty bag has none
function hold() { state.until = Date.now() + HOLD_MS; state.released = null; }
// release the bag when the hold has run out; remembers what was removed so the bag can explain it (and offer it back)
function expire() {
  if (!state.items.length || !state.until || Date.now() < state.until) return false;
  state.released = { at: state.until, items: state.items.map(({ slug, size, qty }) => ({ slug, size, qty })), seen: false };
  state.items = []; state.until = null; save(); return true;
}
const expiredSubs = new Set();
const check = () => { if (expire()) expiredSubs.forEach((f) => f(state.released)); };
// other tabs share the same bag
addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); subs.forEach((f) => f(state)); } });

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
    hold(); save(); return true;
  },
  setQty(key, qty) {
    const i = state.items.find((x) => x.key === key); if (!i) return;
    const p = bySlug(i.slug); if (!p) return; const max = Math.min(p.stock[i.size] ?? 0, 2);
    i.qty = Math.max(0, Math.min(max, qty));
    if (!i.qty) state.items = state.items.filter((x) => x !== i);
    if (!state.items.length) state.until = null;
    save();
  },
  remove(key) { state.items = state.items.filter((x) => x.key !== key); if (!state.items.length) state.until = null; save(); },
  clear() { state = { items: [], code: null }; save(); },
  // reservation
  get until() { return state.items.length ? state.until || 0 : 0; },
  left() { return this.until ? Math.max(0, this.until - Date.now()) : 0; },
  get released() { return state.released || null; },
  check,
  onExpire(fn) { expiredSubs.add(fn); return () => expiredSubs.delete(fn); },
  markReleasedSeen() { if (state.released && !state.released.seen) { state.released.seen = true; save(); } },
  dismissReleased() { if (state.released) { state.released = null; save(); } },
  // put released pieces back (as far as stock and the 2-per-size limit allow); returns how many came back
  restore() {
    const r = state.released; if (!r) return 0; let n = 0;
    for (const it of r.items) for (let k = 0; k < it.qty; k++) if (this.add(it.slug, it.size) === true) n++;
    state.released = null; if (n) hold(); save(); return n;
  },
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
