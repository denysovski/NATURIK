// Floating social button, bottom-left on every page. Opens a small menu upwards.
// The networks don't exist yet, so the links go nowhere (they just close the menu).
export function initSocialFab() {
  const fab = document.querySelector('[data-fab]');
  if (!fab) return;
  const btn = fab.querySelector('[data-fab-btn]');
  const set = (open) => { fab.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', () => set(!fab.classList.contains('is-open')));
  fab.addEventListener('click', (e) => { if (e.target.closest('[data-fab-link]')) { e.preventDefault(); set(false); } });
  document.addEventListener('click', (e) => { if (!fab.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}
