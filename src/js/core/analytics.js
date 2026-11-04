// Consent-gated analytics. Nothing loads until the visitor picks "Accept all" in the cookie bar,
// and nothing loads at all until a provider is configured below (the demo ships without one).
// To switch it on: set PLAUSIBLE_DOMAIN to the site's domain registered at plausible.io
// (cookie-less, EU-hosted). Page views are sent on the first load and on every SPA page switch.
const PLAUSIBLE_DOMAIN = '';

let loaded = false;
const consented = () => { try { return localStorage.getItem('naturik.cookies') === 'all'; } catch { return false; } };

function load() {
  if (loaded || !PLAUSIBLE_DOMAIN || !consented()) return;
  loaded = true;
  window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  const s = document.createElement('script');
  s.defer = true; s.dataset.domain = PLAUSIBLE_DOMAIN; s.dataset.autoCapture = 'false';
  s.src = 'https://plausible.io/js/script.manual.js';
  document.head.appendChild(s);
  track();
}
const track = () => { if (loaded) window.plausible?.('pageview', { u: location.href }); };

export function initAnalytics() {
  load();
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookie-choice="all"]')) setTimeout(load, 0); });
  document.addEventListener('naturik:page', track);
}
