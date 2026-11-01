import { initApp } from '../core/app.js';
import { gsap } from '../core/scroll.js';
import { initReveals, accordion } from '../components/ui.js';
import { toast } from '../components/toast.js';

initApp();
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

const FAQ = [
  ['How does the M1 fit?', 'Oversized by design — roomy enough for a hoodie and knit underneath. Most people take their usual size; size down for a cleaner line. Every product page has a 20-second size finder and garment measurements in cm and inches.'],
  ['Will you restock sold-out sizes?', 'No. Every drop is numbered and limited. When a size is gone it stays gone — that is the point. Join the Drop 02 list to hear first about the next one.'],
  ['How long does delivery take?', 'Pieces leave our Prague studio within 24 hours on business days. Standard DHL is 2–4 business days across the EU (free over €300), Express is 1–2 days. Duties are prepaid for the UK, Switzerland and Norway.'],
  ['What is your return policy?', '30 days from delivery, free, with the prepaid label in your parcel. Exchanges are held for you the moment you request them so your new size can\'t sell out.'],
  ['How warm is it really?', 'The M1 is rated comfortable to −25 °C when standing still with a base layer. 420 g of 800-fill RDS-certified down across 78 sewn-through cells.'],
  ['Can I get it repaired?', 'Yes, for life. Free in the first two years, at cost afterwards — tears, zips, cuffs or a full re-loft.'],
  ['Is this a real store?', 'This site is a design prototype. Checkout is simulated — no order is placed and no payment is taken.'],
];
$('[data-faq]').innerHTML = accordion(FAQ, { single: true, openFirst: true });
$('#ld-faq').textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

// open/closed status in Prague time
(() => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const open = now.getDay() % 6 !== 0 && now.getHours() >= 9 && now.getHours() < 18;
  $('[data-open-status]').textContent = open ? 'Client care is online now' : 'Offline — we reply from 09:00 CET';
})();

// form: topic-dependent fields, validation, simulated send
const form = $('[data-contact]');
const sync = () => { const t = form.topic.value; $$('[data-when]', form).forEach((el) => (el.hidden = !el.dataset.when.split(' ').includes(t))); };
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
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => form.message.focus(), 700);
  toast('Message pre-filled — add your preferred days.');
});

initReveals();
