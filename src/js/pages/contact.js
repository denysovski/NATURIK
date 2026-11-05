import { mountContact3d } from '../components/contact3d.js';
import { gsap } from '../core/scroll.js';
import { initReveals } from '../components/ui.js';
import { createSelect } from '../components/select.js';
import { toast } from '../components/toast.js';
import { PRODUCTS } from '../data/products.js';

export function mount(root = document) {
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const cleanups = [];

  // open/closed status in Prague time
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const open = now.getDay() % 6 !== 0 && now.getHours() >= 9 && now.getHours() < 18;
  $('[data-open-status]').textContent = open ? 'Client care is online now' : 'Offline — we reply from 09:00 CET';

  // ---------- onboarding: pick a topic first, then only the fields that topic needs ----------
  const ob = $('[data-ob]'), pick = $('[data-ob-pick]'), form = $('[data-contact]');
  const TOPICS = {
    sizing:  { title: 'Sizing help', sub: 'Your height and usual size are enough for us to pick the right cell.', msg: 'Anything else about fit?', ph: 'Shoulders, layering, arm length…' },
    product: { title: 'About a product', sub: 'Fabric, warmth, care or what comes next — ask away.', msg: 'Your question', ph: 'What would you like to know?' },
    order:   { title: 'My order', sub: 'Your order number gets you an answer twice as fast.', msg: 'What do you need?', ph: 'Delivery, change of address, a return…' },
    problem: { title: 'Report a problem', sub: 'Just tell us what broke and where — that is all we need.', msg: 'What went wrong?', ph: 'Page, button, what you expected to happen…' },
    other:   { title: 'Something else', sub: 'Press, wholesale or just a hello.', msg: 'Message', ph: 'Tell us what you need…' },
  };
  const usual = createSelect($('[data-usual-size]'), { label: 'Usual size', name: 'usual', options: [['', 'Not sure'], ['XS', 'XS'], ['S', 'S'], ['M', 'M'], ['L', 'L'], ['XL', 'XL'], ['XXL', 'XXL']] });
  const piece = createSelect($('[data-piece]'), { label: 'Piece', name: 'piece', options: [['', 'Not sure / general'], ...PRODUCTS.map((p) => [p.slug, p.fullName])] });
  cleanups.push(usual.destroy, piece.destroy);
  const sync = () => {
    const t = form.topic.value, c = TOPICS[t];
    $$('[data-when]').forEach((el) => {
      const on = el.dataset.when.split(' ').includes(t);
      el.hidden = !on;
      el.querySelectorAll('input, textarea').forEach((i) => (i.disabled = !on));   // hidden fields are never validated or sent
    });
    $('[data-ob-title]').textContent = c.title; $('[data-ob-sub]').textContent = c.sub;
    $('[data-msg-label]').textContent = c.msg; form.message.placeholder = c.ph;
  };
  // cross-fade between the two steps, with the container height tweened so nothing below jumps
  const swap = (from, to, dir = 1, then) => {
    const h0 = ob.offsetHeight;
    gsap.to(from, { opacity: 0, x: -30 * dir, duration: 0.28, ease: 'power2.in', onComplete: () => {
      from.hidden = true; to.hidden = false; gsap.set(from, { clearProps: 'all' });
      const h1 = ob.offsetHeight;
      gsap.fromTo(ob, { height: h0 }, { height: h1, duration: 0.5, ease: 'expo.inOut', clearProps: 'height' });
      gsap.fromTo(to, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out', clearProps: 'all' });
      gsap.fromTo(to.querySelectorAll('.field:not([hidden] .field), .fields:not([hidden]), .ob-opt, .check, .btn'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'expo.out', delay: 0.08, clearProps: 'all' });
      then?.();
    } });
  };
  const goForm = (topic, { focus = true } = {}) => {
    form.topic.value = topic; sync();
    swap(pick, form, 1, () => { if (focus) setTimeout(() => form.querySelector('.field:not([hidden]) input:not([disabled]), .field:not([hidden]) textarea')?.focus({ preventScroll: true }), 350); });
  };
  const goPick = () => swap(form, pick, -1, () => pick.querySelector(`[data-pick="${form.topic.value}"]`)?.focus({ preventScroll: true }));
  pick.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) goForm(b.dataset.pick); });
  $('[data-ob-back]').addEventListener('click', goPick);
  sync();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const set = (input, msg) => { input.setAttribute('aria-invalid', String(!!msg)); const err = (input.closest('.field') || input.parentElement).querySelector('.field__error'); if (err) err.textContent = msg || ''; if (msg) ok = false; };
    if (!form.name.disabled) set(form.name, form.name.value.trim().length < 2 ? 'Tell us your name' : '');
    set(form.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.value.trim()) ? '' : 'Enter a valid email address');
    if (!form.height.disabled) { const h = +form.height.value; set(form.height, h >= 120 && h <= 230 ? '' : 'Your height in cm, e.g. 182'); }
    if (!form.order.disabled) set(form.order, form.order.value.trim().length >= 4 ? '' : 'Your order number, e.g. NTK-2612345');
    set(form.message, form.message.value.trim().length < 10 ? 'A few more words, please (10+ characters)' : '');
    $('[data-consent-err]').textContent = form.consent.checked ? '' : 'Please confirm so we can reply';
    if (!form.consent.checked) ok = false;
    if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    const btn = form.querySelector('button[type="submit"]'); btn.classList.add('is-loading');
    setTimeout(() => {
      btn.classList.remove('is-loading');
      $('[data-ticket]').textContent = `#${Math.floor(10000 + Math.random() * 89999)}`;
      $('[data-reply-to]').textContent = form.email.value.trim();
      const done = $('[data-contact-done]'); done.hidden = false;
      gsap.fromTo(done, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' });
      gsap.from(done.querySelector('.co-done__mark'), { scale: 0, rotate: -90, duration: 1, ease: 'elastic.out(1, 0.5)' });
    }, 1100);
  });
  $('[data-contact-reset]').addEventListener('click', () => { form.reset(); $('[data-contact-done]').hidden = true; goPick(); });
  $('[data-book]').addEventListener('click', () => {
    const show = () => { form.message.value = 'Hi — I would like to book a showroom slot in Prague to try the M1. Preferred days: '; };
    if (form.hidden) goForm('sizing', { focus: false }); else { form.topic.value = 'sizing'; sync(); }
    show();
    window.naturikScrollTo?.(ob, -90);
    setTimeout(() => form.message.focus({ preventScroll: true }), 950);
    toast('Message pre-filled — add your height and preferred days.');
  });

  // ---------- opening hours bubble (hover / focus / tap) ----------
  const hrs = $('[data-hours]');
  if (hrs) {
    const btn = hrs.querySelector('.hours__btn');
    const setOpen = (v) => { if (v) hrs.style.setProperty('--hx', `${hrs.getBoundingClientRect().left.toFixed(0)}px`); hrs.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', String(v)); };
    let t;
    hrs.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(t); setOpen(true); } });
    hrs.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') t = setTimeout(() => setOpen(false), 120); });
    btn.addEventListener('click', () => setOpen(!hrs.classList.contains('is-open')));
    btn.addEventListener('focus', () => setOpen(true)); btn.addEventListener('blur', () => setOpen(false));
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    const away = (e) => { if (!hrs.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', esc); document.addEventListener('pointerdown', away);
    cleanups.push(() => { document.removeEventListener('keydown', esc); document.removeEventListener('pointerdown', away); });
  }

  const ctx = gsap.context(() => initReveals(root));
  cleanups.push(mountContact3d(root));
  return () => { ctx.revert(); cleanups.forEach((f) => f()); };
}
