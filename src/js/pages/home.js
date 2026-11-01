import { addToBag } from '../core/app.js';
import { gsap, ScrollTrigger, reduceMotion } from '../core/scroll.js';
import { initReveals, initCounters, split } from '../components/ui.js';
import { SIZES, bySlug, totalStock } from '../data/products.js';

/* Homepage module — mount() wires everything up, the returned function tears it down
   so the router can swap pages without reloads or leaks. */
export function mount(root = document) {
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const m1 = bySlug('m1-obsidian');
  const cleanups = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
  const tick = (fn) => { gsap.ticker.add(fn); cleanups.push(() => gsap.ticker.remove(fn)); };

  /* ---------- viewport metrics, cached (no per-frame layout reads) ---------- */
  const vp = { w: innerWidth, h: innerHeight, mobile: innerWidth < 820 };
  const measure = () => {
    // ignore height-only jitter from mobile browser bars
    if (Math.abs(innerWidth - vp.w) < 2 && Math.abs(innerHeight - vp.h) < 140 && vp.measured) return;
    vp.w = innerWidth; vp.h = innerHeight; vp.mobile = vp.w < 820; vp.measured = true;
    sizeZoom();
  };

  /* ---------- live data ---------- */
  $$('[data-m1-left], [data-m1-left-count]').forEach((n) => (n.textContent = totalStock(m1)));
  $('[data-size-stock]').innerHTML = SIZES.map((s) => {
    const n = m1.stock[s];
    return `<div class="size-stock__row"><span class="t-mono">${s}</span><span class="stock__bar"><span class="stock__fill" style="--p:${(n / 8) * 100}%"></span></span><span class="t-mono ${n <= 2 ? 'is-low' : ''}">${n ? `${n} left` : 'Sold out'}</span></div>`;
  }).join('');
  const drop = $('[data-drop-sizes]');
  drop.innerHTML = SIZES.map((s) => `<button type="button" class="size-chip" data-size="${s}" ${m1.stock[s] ? '' : 'disabled'} aria-label="Add M1 Obsidian size ${s} to bag">${s}</button>`).join('');
  on(drop, 'click', (e) => {
    const b = e.target.closest('[data-size]'); if (!b) return;
    if (addToBag('m1-obsidian', b.dataset.size)) { b.setAttribute('aria-pressed', 'true'); setTimeout(() => b.setAttribute('aria-pressed', 'false'), 900); }
  });

  /* =========================================================
     IMAGE STAGE — one glass-framed photo that travels with the story
     ========================================================= */
  const stage = $('[data-stage]'), frame = $('[data-stage-frame]'), glow = $('[data-stage-glow]');
  const stageImgs = $$('[data-stage-img]'), chip = $('[data-stage-chip]');
  const S = { x: 0, y: vp.mobile ? 0.12 : 0.07, scale: vp.mobile ? 0.8 : 0.96, rotY: -7, rotZ: 0, img: 0, zoom: 1.06, pan: 0, opacity: 1 };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let lastImg = -1, hidden = false;
  on(window, 'pointermove', (e) => { mouse.x = e.clientX / vp.w - 0.5; mouse.y = e.clientY / vp.h - 0.5; }, { passive: true });

  tick(() => {
    if (S.opacity < 0.01) { if (!hidden) { stage.style.visibility = 'hidden'; hidden = true; } return; }
    if (hidden) { stage.style.visibility = 'visible'; hidden = false; }
    mouse.sx += (mouse.x - mouse.sx) * 0.08; mouse.sy += (mouse.y - mouse.sy) * 0.08;
    const tx = S.x * vp.w, ty = S.y * vp.h;
    const ry = S.rotY + mouse.sx * 9, rx = -mouse.sy * 6;
    frame.style.transform = `translate3d(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px), 0) perspective(1400px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${S.rotZ.toFixed(2)}deg) scale(${S.scale.toFixed(4)})`;
    frame.style.setProperty('--sheen', `${(50 + ry * 3).toFixed(1)}%`);
    glow.style.transform = `translate3d(calc(-50% + ${(tx * 0.85).toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px), 0)`;
    stageImgs.forEach((im, i) => {
      // quick, decisive swap around the mid-point instead of a long ghosting double-exposure
      const o = Math.min(1, Math.max(0, (0.5 - Math.abs(i - S.img)) * 4 + 0.5));
      im.style.opacity = o.toFixed(3);
      if (o > 0) im.style.transform = `translate3d(${(mouse.sx * -12).toFixed(1)}px, ${(S.pan * 100 + mouse.sy * -10).toFixed(1)}px, 0) scale(${S.zoom.toFixed(4)})`;
    });
    const cur = Math.round(S.img);
    if (cur !== lastImg) { lastImg = cur; glow.style.backgroundImage = `url(${stageImgs[cur].getAttribute('src')})`; }
    stage.style.opacity = S.opacity.toFixed(3);
  });

  const chipText = ['800 FP · −25 °C', '78 cells · 420 g down', `${totalStock(m1)} of 78 left`];
  const setChip = (i) => { if (chip.dataset.i == i) return; chip.dataset.i = i; gsap.to(chip, { opacity: 0, y: 6, duration: 0.2, onComplete: () => { chip.textContent = chipText[i]; gsap.to(chip, { opacity: 1, y: 0, duration: 0.4 }); } }); };

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
  const Z = { step: 0, active: false, dirty: true, W: 0, H: 0, base: 1 };
  const NAT = { w: 1111, h: 1415 };
  let shownStep = -1, lastStep = -1;

  function sizeZoom() {
    Z.W = media.clientWidth; Z.H = media.clientHeight;
    Z.base = Math.max(Z.W / NAT.w, Z.H / NAT.h);
    Object.values(zImgs).forEach((im) => { im.style.width = `${NAT.w * Z.base}px`; im.style.height = `${NAT.h * Z.base}px`; });
    Z.dirty = true;
  }
  tick(() => {
    if (!Z.active || (!Z.dirty && Z.step === lastStep)) return;
    Z.dirty = false; lastStep = Z.step;
    const f = Math.max(0, Math.min(STEPS.length - 1, Z.step));
    const i0 = Math.min(STEPS.length - 2, Math.floor(f)), i1 = i0 + 1;
    // hold on each detail, move between them (no snap = no scroll hijacking)
    const k = Math.min(1, Math.max(0, (f - i0 - 0.18) / 0.64));
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const a = STEPS[i0], b = STEPS[i1], same = a.img === b.img, lerp = (p, q) => p + (q - p) * e;
    const s = same ? lerp(a.s, b.s) : (e < 0.5 ? a.s * (1 + e * 0.5) : b.s * (1 + (1 - e) * 0.5));
    const fx = same ? lerp(a.fx, b.fx) : (e < 0.5 ? a.fx : b.fx);
    const fy = same ? lerp(a.fy, b.fy) : (e < 0.5 ? a.fy : b.fy);
    const dw = NAT.w * Z.base * s, dh = NAT.h * Z.base * s;
    const cx = Z.W * (vp.mobile ? 0.5 : 0.42), cy = Z.H * (vp.mobile ? 0.36 : 0.5);
    const left = Math.min(0, Math.max(Z.W - dw, cx - fx * dw)), top = Math.min(0, Math.max(Z.H - dh, cy - fy * dh));
    for (const [name, im] of Object.entries(zImgs)) {
      const op = same ? (name === a.img ? 1 : 0) : (name === a.img ? 1 - e : name === b.img ? e : 0);
      im.style.opacity = op;
      if (op > 0) im.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    }
    const holding = k === 0 || k === 1;
    ring.style.transform = `translate3d(${(left + fx * dw).toFixed(1)}px, ${(top + fy * dh).toFixed(1)}px, 0) translate(-50%, -50%) scale(${holding ? 1 : 0.6})`;
    ring.style.opacity = Math.round(f) === 0 || !holding ? 0 : 1;
    const cur = Math.round(f);
    if (cur !== shownStep) { shownStep = cur; showCard(cur); }
  });
  function showCard(i) {
    const st = STEPS[i], card = $('[data-detail-card]');
    $$('[data-detail-index] li').forEach((li, k) => li.classList.toggle('is-on', k === i));
    $('[data-dc-count]').textContent = String(i).padStart(2, '0');
    $('[data-dc-bar]').style.transform = `scaleX(${i / (STEPS.length - 1)})`;
    gsap.to(card, { opacity: 0, y: 12, duration: 0.16, overwrite: true, onComplete: () => {
      $('[data-dc-num]').textContent = `${String(i).padStart(2, '0')} / 05`;
      $('[data-dc-title]').textContent = st.title;
      $('[data-dc-text]').textContent = st.text;
      $('[data-dc-spec]').textContent = st.spec;
      gsap.to(card, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' });
    } });
  }

  /* ---------- intro ---------- */
  function heroReveal(tl) {
    return tl
      .from(S, { scale: 0.55, rotY: -40, rotZ: -6, zoom: 1.6, duration: 1.6, ease: 'expo.out' }, 0)
      .from(frame, { clipPath: 'inset(50% 50% 50% 50% round 24px)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .from($$('.hero__title .char'), { yPercent: 110, rotate: 6, stagger: 0.025, duration: 1.1, ease: 'expo.out' }, 0.15)
      .from($$('.hero__top > *, .hero__bottom > *'), { y: 24, opacity: 0, stagger: 0.05, duration: 0.9, ease: 'expo.out' }, 0.3);
  }
  function intro(viaRouter) {
    const loader = $('[data-loader]');
    $$('[data-hero-word]').forEach((w) => split(w, 'chars'));
    const seen = viaRouter || document.documentElement.classList.contains('seen');
    try { sessionStorage.setItem('naturik.seen', '1'); } catch {}
    if (reduceMotion) { loader?.remove(); return; }
    if (seen || !loader) { loader?.remove(); heroReveal(gsap.timeline({ delay: viaRouter ? 0.35 : 0.1 })); return; }
    const out = $('[data-loader-count]'), bar = $('[data-loader-bar]');
    const shown = { v: 0 }, target = { v: 0.12 };
    const img = stageImgs[0];
    const tasks = [document.fonts?.ready ?? Promise.resolve(), img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })];
    tasks.forEach((t) => t.then(() => (target.v = Math.min(1, target.v + 0.44))));
    const lt = () => { shown.v += (target.v - shown.v) * 0.14; out.textContent = String(Math.round(shown.v * 100)).padStart(3, '0'); bar.style.transform = `scaleX(${shown.v})`; };
    gsap.ticker.add(lt);
    gsap.to(loader.querySelectorAll('.loader__brand span'), { yPercent: -105, stagger: 0.04, duration: 0.8, ease: 'expo.out' });
    Promise.all([Promise.race([Promise.all(tasks), new Promise((r) => setTimeout(r, 2200))]), new Promise((r) => setTimeout(r, 800))]).then(() => {
      target.v = 1;
      gsap.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'expo.inOut', delay: 0.2, onComplete: () => { gsap.ticker.remove(lt); loader.remove(); } });
      heroReveal(gsap.timeline({ delay: 0.55 }));
    });
  }

  /* ---------- scroll choreography (Lenis already smooths, so scrub is direct) ---------- */
  const ctx = gsap.context(() => {
    if (reduceMotion) { S.opacity = 0; return; }
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 820px)', mob: '(max-width: 819px)' }, (c) => {
      const d = c.conditions.desk;
      const step = (trigger, to, st = {}) => gsap.to(S, { ...to, ease: 'none', immediateRender: false, scrollTrigger: { trigger, start: 'top bottom', end: 'top top', scrub: true, ...st } });
      step('#spec', { x: d ? -0.22 : 0, y: d ? 0 : -0.17, scale: d ? 0.92 : 0.64, rotY: d ? 12 : 0, rotZ: -2, img: 1, zoom: 1.22, pan: -0.04 });
      step('#drop', { x: d ? 0.22 : 0, y: d ? 0 : -0.19, scale: d ? 0.92 : 0.6, rotY: d ? -12 : 0, rotZ: 2, img: 2, zoom: 1.12, pan: 0.03 });
      step('#details', { x: 0, y: 0, scale: 1.5, rotY: 0, rotZ: 0, img: 0, zoom: 1, pan: 0, opacity: 0 }, { end: 'top 15%' });
      gsap.to(Z, { step: STEPS.length - 1, ease: 'none', scrollTrigger: { trigger: '#details', start: 'top top', end: d ? '+=400%' : '+=300%', pin: '[data-details-pin]', scrub: true } });
    });
    ScrollTrigger.create({ trigger: '#details', start: 'top bottom', end: 'bottom top', onToggle: (s) => { Z.active = s.isActive; Z.dirty = true; } });
    ScrollTrigger.create({ trigger: '#spec', start: 'top 60%', onEnter: () => setChip(1), onLeaveBack: () => setChip(0) });
    ScrollTrigger.create({ trigger: '#drop', start: 'top 60%', onEnter: () => setChip(2), onLeaveBack: () => setChip(1) });
    gsap.fromTo(media, { clipPath: 'inset(10% 16% 10% 16% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '#details', start: 'top 85%', end: 'top top', scrub: true } });

    const drift = (sel, x) => gsap.to(sel, { xPercent: x, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
    drift('.ht--1', -25); drift('.ht--2', 18); drift('.ht--3', 22); drift('.ht--5', 26);

    const scrub = $('[data-scrub-text]');
    gsap.fromTo(split(scrub, 'words'), { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 45%', scrub: true } });

    const track = $('[data-look-track]');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 40);
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '[data-look-pin]', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true,
      onUpdate: (s) => skew(Math.max(-5, Math.min(5, s.getVelocity() / -450))) } });

    gsap.from('[data-home-products] .p-card', { y: 100, opacity: 0, stagger: 0.07, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-home-products]', start: 'top 88%', once: true } });

    initReveals(root);
    initCounters(root);
  }, root === document ? undefined : root);

  measure();
  on(window, 'resize', measure);
  intro(mount.visited);
  mount.visited = true;
  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => { ctx.revert(); cleanups.forEach((f) => f()); };
}
