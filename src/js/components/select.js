// Custom select: pill trigger + glass listbox, full keyboard support (↑ ↓ Home End Enter Esc, type-ahead).
import { gsap } from '../core/scroll.js';

let uid = 0;
export function createSelect(host, { label, options, value = options[0][0], onChange, name }) {
  const id = `sel-${++uid}`;
  host.classList.add('select');
  host.innerHTML = `
    <button type="button" class="select__btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}">
      <span class="select__label t-mono">${label}</span><span class="select__value"></span>
      <svg class="select__chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
    </button>
    <ul class="select__list" role="listbox" id="${id}" tabindex="-1" aria-label="${label}">
      ${options.map(([v, t]) => `<li role="option" data-value="${v}" aria-selected="false"><span>${t}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2"/></svg></li>`).join('')}
    </ul>${name ? `<input type="hidden" name="${name}" value="${value}">` : ''}`;
  const btn = host.querySelector('.select__btn'), list = host.querySelector('.select__list'), items = [...list.children];
  let active = 0, current = value, open = false;

  const paint = () => {
    host.querySelector('.select__value').textContent = options.find(([v]) => v === current)[1];
    items.forEach((li, i) => { li.setAttribute('aria-selected', String(li.dataset.value === current)); li.classList.toggle('is-active', i === active); });
    list.setAttribute('aria-activedescendant', '');
  };
  const show = () => {
    open = true; host.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
    active = Math.max(0, items.findIndex((li) => li.dataset.value === current)); paint();
    gsap.fromTo(list, { opacity: 0, y: -8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'expo.out' });
    gsap.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.03, duration: 0.35, ease: 'expo.out' });
    list.focus({ preventScroll: true });
  };
  const hide = (focusBtn = true) => {
    if (!open) return; open = false; host.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus({ preventScroll: true });
  };
  const choose = (i) => {
    const v = items[i].dataset.value; active = i;
    if (v !== current) { current = v; paint(); const h = host.querySelector('input[type=hidden]'); if (h) h.value = v; onChange?.(v); } else paint();
    hide();
  };
  btn.addEventListener('click', () => (open ? hide() : show()));
  btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); show(); } });
  items.forEach((li, i) => { li.addEventListener('click', () => choose(i)); li.addEventListener('pointermove', () => { active = i; paint(); }); });
  list.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { active = Math.min(items.length - 1, active + 1); paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); paint(); e.preventDefault(); }
    else if (e.key === 'Home') { active = 0; paint(); e.preventDefault(); }
    else if (e.key === 'End') { active = items.length - 1; paint(); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { choose(active); e.preventDefault(); }
    else if (e.key === 'Escape' || e.key === 'Tab') { hide(e.key === 'Escape'); e.stopPropagation(); }
    else if (e.key.length === 1) { const k = items.findIndex((li) => li.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase())); if (k >= 0) { active = k; paint(); } }
  });
  const outside = (e) => { if (open && !host.contains(e.target)) hide(false); };
  document.addEventListener('pointerdown', outside);
  paint();
  return { get value() { return current; }, destroy: () => document.removeEventListener('pointerdown', outside) };
}
