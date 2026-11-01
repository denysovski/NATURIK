import { initApp, addToBag } from '../core/app.js';
import { gsap, ScrollTrigger, reduceMotion } from '../core/scroll.js';
import { initReveals, initCounters, split } from '../components/ui.js';
import { productCard } from '../components/productCard.js';
import { PRODUCTS, SIZES, bySlug, totalStock } from '../data/products.js';

initApp();

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const m1 = bySlug('m1-obsidian');
const isMobile = () => innerWidth < 820;

/* ---------- live data into the page ---------- */
$$('[data-m1-left], [data-m1-left-count]').forEach((n) => (n.textContent = totalStock(m1)));
$('[data-home-products]').innerHTML = PRODUCTS.map((p, i) => productCard(p, { index: i })).join('');
$('[data-size-stock]').innerHTML = SIZES.map((s) => {
  const n = m1.stock[s], max = 8;
  return `<div class="size-stock__row"><span class="t-mono">${s}</span><span class="stock__bar"><span class="stock__fill" style="--p:${(n / max) * 100}%"></span></span><span class="t-mono ${n <= 2 ? 'is-low' : ''}">${n ? `${n} left` : 'Sold out'}</span></div>`;
}).join('');
$('[data-drop-sizes]').innerHTML = SIZES.map((s) => `<button type="button" class="size-chip" data-size="${s}" ${m1.stock[s] ? '' : 'disabled'} aria-label="Add M1 Obsidian size ${s} to bag">${s}</button>`).join('');
$('[data-drop-sizes]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]'); if (!b) return;
  if (addToBag('m1-obsidian', b.dataset.size)) { b.setAttribute('aria-pressed', 'true'); setTimeout(() => b.setAttribute('aria-pressed', 'false'), 900); }
});

/* =========================================================
   IMAGE STAGE — one glass-framed photo that travels with the story
   ========================================================= */
const stage = $('[data-stage]'), frame = $('[data-stage-frame]'), glow = $('[data-stage-glow]');
const stageImgs = $$('[data-stage-img]'), chip = $('[data-stage-chip]');
const S = { x: 0, y: 0.08, scale: 0.96, rotY: -7, rotZ: 0, img: 0, zoom: 1.06, pan: 0, opacity: 1 };
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
let lastImg = -1;
window.addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });

function renderStage() {
  mouse.sx += (mouse.x - mouse.sx) * 0.06; mouse.sy += (mouse.y - mouse.sy) * 0.06;
  const t = performance.now() / 1000;
  const float = reduceMotion ? 0 : Math.sin(t * 0.8) * 6;
  frame.style.transform = `translate(-50%, -50%) translate3d(${S.x * 100}vw, calc(${S.y * 100}vh + ${float}px), 0)
    perspective(1400px) rotateY(${S.rotY + mouse.sx * 10}deg) rotateX(${-mouse.sy * 7}deg) rotateZ(${S.rotZ}deg) scale(${S.scale * (isMobile() ? 0.92 : 1)})`;
  frame.style.setProperty('--sheen', `${50 + (S.rotY + mouse.sx * 10) * 3}%`);
  glow.style.transform = `translate(-50%, -50%) translate3d(${S.x * 85}vw, ${S.y * 100}vh, 0) scale(${S.scale * 1.15})`;
  stageImgs.forEach((im, i) => {
    const o = Math.max(0, 1 - Math.abs(i - S.img));
    im.style.opacity = o;
    im.style.transform = `scale(${S.zoom}) translate3d(${mouse.sx * -12}px, ${S.pan * 100 + mouse.sy * -10}px, 0)`;
  });
  const cur = Math.round(S.img);
  if (cur !== lastImg) { lastImg = cur; glow.style.backgroundImage = `url(${stageImgs[cur].getAttribute('src')})`; }
  stage.style.opacity = S.opacity;
  stage.style.visibility = S.opacity < 0.01 ? 'hidden' : 'visible';
}
gsap.ticker.add(renderStage);

const chipText = ['800 FP · −25 °C', '78 cells · 420 g down', `${totalStock(m1)} of 78 left`];
function setChip(i) { if (chip.dataset.i == i) return; chip.dataset.i = i; gsap.to(chip, { opacity: 0, y: 6, duration: 0.2, onComplete: () => { chip.textContent = chipText[i]; gsap.to(chip, { opacity: 1, y: 0, duration: 0.4 }); } }); }

/* =========================================================
   DETAILS — pinned full-bleed zoom with glass cards
   ========================================================= */
const STEPS = [
  { img: 'hero', fx: 0.5, fy: 0.45, s: 1, title: 'M1 Puffer 78C', text: 'Seventy-eight hand-filled cells, one funnel collar and a satin shell that throws light like wet asphalt.', spec: 'Obsidian · 78 numbered pieces' },
  { img: 'hero', fx: 0.53, fy: 0.21, s: 2.3, title: 'Funnel collar', text: 'Two stacked cells rise to the bridge of your nose. A brushed chin guard sits inside, so the zip never touches skin.', spec: 'Height 27 cm · two cells' },
  { img: 'hero', fx: 0.58, fy: 0.42, s: 2.5, title: 'M1 print', text: 'Matte grey by day, bright under headlights. Printed across one full chest cell so it moves with the down.', spec: 'Reflective · wash-fast' },
  { img: 'sleeve', fx: 0.38, fy: 0.48, s: 1.55, title: 'Shoulder cell', text: 'One continuous cell over a dropped shoulder — no seam where a bag strap sits. The wordmark rides on the cap.', spec: 'Single-cell yoke' },
  { img: 'hero', fx: 0.71, fy: 0.74, s: 2.4, title: 'Offset two-way zip', text: 'Moved off-centre so the chest panel stays clean. Opens from the hem so you can sit down without unzipping.', spec: 'YKK® Aquaguard® · two-way' },
  { img: 'back', fx: 0.5, fy: 0.3, s: 1.75, title: 'Back collar', text: 'Three vertical seams shape the collar so it stands on its own, even fully unzipped.', spec: 'Self-supporting · 3 panels' },
];
const media = $('[data-zoom-media]');
const zImgs = Object.fromEntries($$('[data-zoom-img]').map((im) => [im.dataset.zoomImg, im]));
const ring = $('[data-focus-ring]');
const Z = { step: 0 };
let shownStep = -1;
const NAT = { w: 1111, h: 1415 };

function renderZoom() {
  const W = media.clientWidth, H = media.clientHeight;
  if (!W) return;
  const f = Math.max(0, Math.min(STEPS.length - 1, Z.step));
  const i0 = Math.floor(f), i1 = Math.min(STEPS.length - 1, i0 + 1), k = f - i0;
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // easeInOutCubic between steps
  const a = STEPS[i0], b = STEPS[i1];
  // cross-dissolve when the source photo changes
  const sameImg = a.img === b.img;
  const lerp = (p, q) => p + (q - p) * e;
  const s = sameImg ? lerp(a.s, b.s) : (e < 0.5 ? a.s * (1 + e * 0.6) : b.s * (1 + (1 - e) * 0.6));
  const fx = sameImg ? lerp(a.fx, b.fx) : (e < 0.5 ? a.fx : b.fx);
  const fy = sameImg ? lerp(a.fy, b.fy) : (e < 0.5 ? a.fy : b.fy);
  const base = Math.max(W / NAT.w, H / NAT.h);
  const dw = NAT.w * base * s, dh = NAT.h * base * s;
  const cx = W * (isMobile() ? 0.5 : 0.42), cy = H * (isMobile() ? 0.4 : 0.5);
  const left = Math.min(0, Math.max(W - dw, cx - fx * dw)), top = Math.min(0, Math.max(H - dh, cy - fy * dh));
  for (const [name, im] of Object.entries(zImgs)) {
    const op = sameImg ? (name === a.img ? 1 : 0) : (name === a.img ? 1 - e : name === b.img ? e : 0);
    im.style.opacity = op;
    im.style.width = `${NAT.w * base}px`; im.style.height = `${NAT.h * base}px`;
    im.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${s})`;
  }
  // focus ring sits on the detail
  ring.style.transform = `translate3d(${left + fx * dw}px, ${top + fy * dh}px, 0) translate(-50%, -50%) scale(${f % 1 < 0.15 || f % 1 > 0.85 ? 1 : 0.6})`;
  ring.style.opacity = Math.round(f) === 0 ? 0 : (Math.abs(f - Math.round(f)) < 0.2 ? 1 : 0);
  const cur = Math.round(f);
  if (cur !== shownStep) { shownStep = cur; showCard(cur); }
}

function showCard(i) {
  const st = STEPS[i], card = $('[data-detail-card]');
  $$('[data-detail-index] li').forEach((li, k) => li.classList.toggle('is-on', k === i));
  $('[data-dc-count]').textContent = String(i).padStart(2, '0');
  $('[data-dc-bar]').style.transform = `scaleX(${i / (STEPS.length - 1)})`;
  gsap.to(card, { opacity: 0, y: 14, filter: 'blur(6px)', duration: 0.18, overwrite: true, onComplete: () => {
    $('[data-dc-num]').textContent = `${String(i).padStart(2, '0')} / 05`;
    $('[data-dc-title]').textContent = st.title;
    $('[data-dc-text]').textContent = st.text;
    $('[data-dc-spec]').textContent = st.spec;
    gsap.to(card, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' });
  } });
}
gsap.ticker.add(renderZoom);

/* ---------- loader → hero intro ---------- */
function intro() {
  const loader = $('[data-loader]');
  $$('[data-hero-word]').forEach((w) => split(w, 'chars'));
  if (reduceMotion) { loader.remove(); return; }
  const count = { v: 0 }, out = $('[data-loader-count]'), bar = $('[data-loader-bar]');
  gsap.timeline()
    .to('.loader__brand span', { yPercent: -105, stagger: 0.05, duration: 0.9, ease: 'expo.out' }, 0)
    .to(count, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { out.textContent = String(Math.round(count.v)).padStart(3, '0'); bar.style.transform = `scaleX(${count.v / 100})`; } }, 0)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '+=0.1')
    .from(S, { scale: 0.55, rotY: -40, rotZ: -6, zoom: 1.6, duration: 2, ease: 'expo.out' }, '-=0.7')
    .from(frame, { clipPath: 'inset(50% 50% 50% 50% round 24px)', duration: 1.6, ease: 'expo.inOut' }, '<')
    .from('.hero__title .char', { yPercent: 110, rotate: 6, stagger: 0.025, duration: 1.2, ease: 'expo.out' }, '-=1.4')
    .from('.hero__top > *, .hero__bottom > *', { y: 30, opacity: 0, stagger: 0.06, duration: 1, ease: 'expo.out' }, '-=1')
    .add(() => loader.remove());
}

/* ---------- scroll choreography ---------- */
function choreograph() {
  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 820px)', mob: '(max-width: 819px)' }, (ctx) => {
    const d = ctx.conditions.desk;
    const step = (trigger, to, st = {}) => gsap.to(S, { ...to, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger, start: 'top bottom', end: 'top top', scrub: 1.1, ...st } });
    // hero → spec : photo slides left, turns, swaps to the shoulder shot
    step('#spec', { x: d ? -0.22 : 0, y: d ? 0 : -0.16, scale: d ? 0.92 : 0.62, rotY: d ? 12 : 0, rotZ: -2, img: 1, zoom: 1.22, pan: -0.04 });
    // spec → drop : swipes right, swaps to the back view
    step('#drop', { x: d ? 0.22 : 0, y: d ? 0 : -0.18, scale: d ? 0.92 : 0.6, rotY: d ? -12 : 0, rotZ: 2, img: 2, zoom: 1.12, pan: 0.03 });
    // drop → details : photo grows and dissolves into the full-bleed zoom
    step('#details', { x: 0, y: 0, scale: 1.6, rotY: 0, rotZ: 0, img: 0, zoom: 1, pan: 0, opacity: 0 }, { end: 'top 10%' });
    // details: pinned scroll drives the camera through each detail
    gsap.to(Z, { step: STEPS.length - 1, ease: 'none', scrollTrigger: { trigger: '#details', start: 'top top', end: d ? '+=420%' : '+=320%', pin: '[data-details-pin]', scrub: 0.8, snap: { snapTo: 1 / (STEPS.length - 1), duration: { min: 0.3, max: 0.8 }, ease: 'power2.inOut', delay: 0.05 } } });
  });
  ScrollTrigger.create({ trigger: '#spec', start: 'top 60%', onEnter: () => setChip(1), onLeaveBack: () => setChip(0) });
  ScrollTrigger.create({ trigger: '#drop', start: 'top 60%', onEnter: () => setChip(2), onLeaveBack: () => setChip(1) });
  // details intro: media un-clips from a card into full bleed
  gsap.fromTo(media, { clipPath: 'inset(12% 18% 12% 18% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '#details', start: 'top 80%', end: 'top top', scrub: true } });

  // hero words drift apart
  const drift = (sel, x) => gsap.to(sel, { xPercent: x, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
  drift('.ht--1', -30); drift('.ht--2', 20); drift('.ht--3', 25); drift('.ht--5', 30);

  // manifesto: words light up as you read
  const scrub = $('[data-scrub-text]');
  gsap.fromTo(split(scrub, 'words'), { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 45%', scrub: true } });

  // lookbook: vertical scroll → horizontal travel, skew from velocity
  const track = $('[data-look-track]');
  const dist = () => track.scrollWidth - innerWidth + 40;
  const skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
  gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '[data-look-pin]', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true,
    onUpdate: (s) => skew(Math.max(-6, Math.min(6, s.getVelocity() / -400))) } });
  $$('.look img').forEach((img) => gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-look-pin]', start: 'top top', end: () => `+=${dist()}`, scrub: true } }));

  // product row: cards rise in a wave
  gsap.from('[data-home-products] .p-card', { y: 120, opacity: 0, rotateX: -20, transformOrigin: 'top', stagger: 0.08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '[data-home-products]', start: 'top 85%', once: true } });
}

intro();
initReveals();
initCounters();
if (!reduceMotion) choreograph(); else S.opacity = 0.0;
window.addEventListener('load', () => ScrollTrigger.refresh());
