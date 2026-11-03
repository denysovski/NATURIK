// First-visit popup: leave an email, get the 10% code (DROP01) and join the newsletter (simulated).
// Shows once per browser, a few seconds after the cookie choice, never during a page transition.
import { gsap, lenis, reduceMotion } from '../core/scroll.js';

const KEY = 'naturik.promo';
const seen = () => { try { return !!localStorage.getItem(KEY); } catch { return true; } };
const mark = (v = '1') => { try { localStorage.setItem(KEY, v); } catch {} };

export function initPromo() {
  const el = document.querySelector('[data-promo]');
  if (!el || seen()) return;
  const card = el.querySelector('.promo__card'), form = el.querySelector('[data-promo-form]'), err = el.querySelector('[data-promo-err]');
  let last = null, isOpen = false;

  const open = () => {
    if (isOpen || seen() || document.documentElement.classList.contains('is-routing')) return;
    isOpen = true; last = document.activeElement;
    el.hidden = false; lenis?.stop();
    if (!reduceMotion) {
      gsap.fromTo(el.querySelector('.promo__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo(card, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
    }
    setTimeout(() => el.querySelector('#promo-email')?.focus({ preventScroll: true }), 200);
  };
  const close = () => {
    if (!isOpen) return; isOpen = false; mark();
    const done = () => { el.hidden = true; lenis?.start(); last?.focus?.({ preventScroll: true }); };
    if (reduceMotion) return done();
    gsap.to(el.querySelector('.promo__backdrop'), { opacity: 0, duration: 0.35 });
    gsap.to(card, { opacity: 0, y: 24, scale: 0.97, duration: 0.35, ease: 'power2.in', onComplete: done });
  };

  el.addEventListener('click', (e) => { if (e.target.closest('[data-promo-close]')) close(); });
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {               // keep focus inside the dialog
      const f = [...card.querySelectorAll('button, input, [href]')].filter((x) => !x.closest('[hidden]'));
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.textContent = "That email doesn't look right."; form.email.focus(); return; }
    err.textContent = '';
    try { localStorage.setItem('naturik.newsletter', '1'); } catch {}
    mark('subscribed');
    form.hidden = true;
    const d = el.querySelector('[data-promo-done]'); d.hidden = false;
    if (!reduceMotion) gsap.fromTo(d, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
    el.querySelector('[data-promo-copy]').focus({ preventScroll: true });
  });
  el.querySelector('[data-promo-copy]').addEventListener('click', (e) => {
    const code = el.querySelector('[data-promo-code]').textContent;
    (navigator.clipboard?.writeText(code) || Promise.reject()).then(() => (e.target.textContent = 'Copied'), () => (e.target.textContent = code));
  });

  // timing: wait for the cookie choice, then a short pause
  const schedule = () => setTimeout(open, 3500);
  const bar = document.querySelector('[data-cookie]');
  let chosen = true; try { chosen = !!localStorage.getItem('naturik.cookies'); } catch {}
  if (!bar || chosen) return schedule();
  // cookie bar still to come: wait until it has opened and been answered
  let wasOpen = false;
  const mo = new MutationObserver(() => {
    if (bar.classList.contains('is-open')) wasOpen = true;
    else if (wasOpen) { mo.disconnect(); schedule(); }
  });
  mo.observe(bar, { attributes: true, attributeFilter: ['class'] });
}
