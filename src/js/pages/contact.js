import { gsap } from '../core/scroll.js';
import { initReveals } from '../components/ui.js';
import { createSelect } from '../components/select.js';
import { toast } from '../components/toast.js';

export function mount(root = document) {
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const cleanups = [];

  // open/closed status in Prague time
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const open = now.getDay() % 6 !== 0 && now.getHours() >= 9 && now.getHours() < 18;
  $('[data-open-status]').textContent = open ? 'Client care is online now' : 'Offline — we reply from 09:00 CET';

  const form = $('[data-contact]');
  const usual = createSelect($('[data-usual-size]'), { label: 'Usual size', name: 'usual', options: [['', 'Not sure'], ['XS', 'XS'], ['S', 'S'], ['M', 'M'], ['L', 'L'], ['XL', 'XL'], ['XXL', 'XXL']] });
  cleanups.push(usual.destroy);
  const sync = () => { const t = form.topic.value; $$('[data-when]').forEach((el) => (el.hidden = !el.dataset.when.split(' ').includes(t))); };
  form.addEventListener('change', (e) => { if (e.target.name === 'topic') sync(); });
  sync();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const set = (input, msg) => { input.setAttribute('aria-invalid', String(!!msg)); const err = input.parentElement.querySelector('.field__error'); if (err) err.textContent = msg || ''; if (msg) ok = false; };
    set(form.name, form.name.value.trim().length < 2 ? 'Tell us your name' : '');
    set(form.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.value.trim()) ? '' : 'Enter a valid email address');
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
  $('[data-contact-reset]').addEventListener('click', () => { form.reset(); sync(); $('[data-contact-done]').hidden = true; });
  $('[data-book]').addEventListener('click', () => {
    form.querySelector('input[value="sizing"]').checked = true; sync();
    form.message.value = 'Hi — I would like to book a showroom slot in Prague to try the M1. Preferred days: ';
    window.naturikScrollTo?.(form, -90);
    setTimeout(() => form.message.focus({ preventScroll: true }), 900);
    toast('Message pre-filled — add your preferred days.');
  });

  const ctx = gsap.context(() => initReveals(root));
  return () => { ctx.revert(); cleanups.forEach((f) => f()); };
}
