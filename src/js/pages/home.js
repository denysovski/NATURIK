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
  const stageImgs = $$('[data-stage-img]'), chip = $('[data-stage-chip]'), sheen = root.querySelector('.stage__sheen');
  const S = { x: 0, y: vp.mobile ? 0.12 : 0.07, scale: vp.mobile ? 0.8 : 0.96, rotY: 0, rotZ: 0, img: 0, zoom: 1.06, pan: 0, opacity: 1 };
  let lastImg = -1, hidden = false, lastKey = '';

  // Writes only when the scroll-driven state actually changed: zero work while idle.
  tick(() => {
    if (S.opacity < 0.01) { if (!hidden) { stage.style.visibility = 'hidden'; hidden = true; } return; }
    if (hidden) { stage.style.visibility = 'visible'; hidden = false; }
    const key = `${S.x.toFixed(4)}|${S.y.toFixed(4)}|${S.scale.toFixed(4)}|${S.rotY.toFixed(2)}|${S.rotZ.toFixed(2)}|${S.img.toFixed(3)}|${S.zoom.toFixed(4)}|${S.pan.toFixed(4)}|${S.opacity.toFixed(3)}|${vp.w}|${vp.h}`;
    if (key === lastKey) return;
    lastKey = key;
    const tx = S.x * vp.w, ty = S.y * vp.h;
    frame.style.transform = `translate3d(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px), 0) perspective(1400px) rotateY(${S.rotY.toFixed(2)}deg) rotateZ(${S.rotZ.toFixed(2)}deg) scale(${S.scale.toFixed(4)})`;
    sheen.style.transform = `translate3d(${(S.x * 60).toFixed(1)}%, 0, 0)`;
    glow.style.transform = `translate3d(calc(-50% + ${(tx * 0.9).toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px), 0) scale(${S.scale.toFixed(3)})`;
    stageImgs.forEach((im, i) => {
      const o = Math.min(1, Math.max(0, (0.5 - Math.abs(i - S.img)) * 4 + 0.5));
      im.style.opacity = o.toFixed(3);
      im.style.visibility = o > 0 ? 'visible' : 'hidden';
      if (o > 0) im.style.transform = `translate3d(0, ${(S.pan * 100).toFixed(1)}px, 0) scale(${S.zoom.toFixed(4)})`;
    });
    const cur = Math.round(S.img);
    stage.style.opacity = S.opacity.toFixed(3);
  });

  // hover over the travelling photo (it sits behind the content, so hit-test it ourselves)
  on(window, 'pointermove', (e) => {
    if (hidden) return;
    const r = frame.getBoundingClientRect();
    frame.classList.toggle('is-hover', e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
  }, { passive: true });

  const chipText = ['800 FP · −25 °C', '78 cells · 420 g down', `${totalStock(m1)} of 78 left`];
  const setChip = (i) => { if (chip.dataset.i == i) return; chip.dataset.i = i; gsap.to(chip, { opacity: 0, y: 6, duration: 0.2, onComplete: () => { chip.textContent = chipText[i]; gsap.to(chip, { opacity: 1, y: 0, duration: 0.4 }); } }); };

  /* =========================================================
     DETAILS — pinned full-bleed zoom with glass cards
     ========================================================= */
  const STEPS = [
    { img: 'hero', fx: 0.5, fy: 0.5, s: 1, title: 'M1 Puffer 78C', text: 'Seventy-eight hand-filled cells, one funnel collar and a satin shell that throws light like wet asphalt.', spec: 'Obsidian · 78 numbered pieces' },
    { img: 'hero', fx: 0.5, fy: 0.3, s: 2.2, title: 'Funnel collar', text: 'Two stacked cells rise to the bridge of your nose. A brushed chin guard sits inside, so the zip never touches skin.', spec: 'Height 27 cm · two cells' },
    { img: 'hero', fx: 0.41, fy: 0.62, s: 2.6, title: 'M1 print', text: 'Matte grey by day, bright under headlights. Printed across one full chest cell so it moves with the down.', spec: 'Reflective · wash-fast' },
    { img: 'hero', fx: 0.25, fy: 0.66, s: 2.3, title: 'Shoulder cell', text: 'One continuous cell over a dropped shoulder — no seam where a bag strap sits. The wordmark rides on the cap.', spec: 'Single-cell yoke' },
    { img: 'hero', fx: 0.505, fy: 0.78, s: 2.5, title: 'Offset two-way zip', text: 'Moved off-centre so the chest panel stays clean. Opens from the hem so you can sit down without unzipping.', spec: 'YKK® Aquaguard® · two-way' },
    { img: 'hero', fx: 0.5, fy: 0.34, s: 1.7, title: 'Stand-up collar', text: 'Three vertical seams shape the collar so it stands on its own, even fully unzipped.', spec: 'Self-supporting · 3 panels' },
    { img: 'hero', fx: 0.5, fy: 0.5, s: 1, title: 'Every detail, one jacket', text: 'Seventy-eight cells, one collar, one zip that sits where it should. Numbered and never restocked.', spec: 'M1 Puffer 78C · €890', end: true },
  ];
  const media = $('[data-zoom-media]');
  const zImgs = Object.fromEntries($$('[data-zoom-img]').map((im) => [im.dataset.zoomImg, im]));
  const ring = $('[data-focus-ring]');
  const Z = { step: 0, active: false, dirty: true, W: 0, H: 0, base: 1 };
  // natural size per photo (they differ: landscape front/sleeve, portrait back)
  const NATS = Object.fromEntries(Object.entries(zImgs).map(([k, im]) => [k, { w: +im.dataset.w || 1111, h: +im.dataset.h || 1415 }]));
  let shownStep = -1, lastStep = -1;

  function sizeZoom() {
    Z.W = media.clientWidth; Z.H = media.clientHeight;
    Z.bases = {};
    Object.entries(zImgs).forEach(([k, im]) => { const n = NATS[k], b = Math.max(Z.W / n.w, Z.H / n.h); Z.bases[k] = b; im.style.width = `${n.w * b}px`; im.style.height = `${n.h * b}px`; });
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
    let s = same ? lerp(a.s, b.s) : (e < 0.5 ? a.s * (1 + e * 0.5) : b.s * (1 + (1 - e) * 0.5));
    const fx = same ? lerp(a.fx, b.fx) : (e < 0.5 ? a.fx : b.fx);
    const fy = same ? lerp(a.fy, b.fy) : (e < 0.5 ? a.fy : b.fy);
    const cx = Z.W * (vp.mobile ? 0.5 : 0.42), cy = Z.H * (vp.mobile ? 0.36 : 0.5);
    // tall screens already magnify wide photos just to fill them: zoom less on top of that
    if (Z.H > Z.W) s = 1 + (s - 1) * 0.3;
    const place = (name) => {
      const n = NATS[name], dw = n.w * Z.bases[name] * s, dh = n.h * Z.bases[name] * s;
      return { dw, dh, left: Math.min(0, Math.max(Z.W - dw, cx - fx * dw)), top: Math.min(0, Math.max(Z.H - dh, cy - fy * dh)) };
    };
    let ringAt = null;
    for (const [name, im] of Object.entries(zImgs)) {
      const op = same ? (name === a.img ? 1 : 0) : (name === a.img ? 1 - e : name === b.img ? e : 0);
      im.style.opacity = op;
      im.style.visibility = op > 0 ? 'visible' : 'hidden';
      if (op > 0) { const g = place(name); im.style.transform = `translate3d(${g.left.toFixed(1)}px, ${g.top.toFixed(1)}px, 0) scale(${s.toFixed(4)})`; if (op >= 0.5) ringAt = g; }
    }
    const g = ringAt || place(a.img);
    const left = g.left, top = g.top, dw = g.dw, dh = g.dh;
    const holding = k === 0 || k === 1;
    ring.style.transform = `translate3d(${(left + fx * dw).toFixed(1)}px, ${(top + fy * dh).toFixed(1)}px, 0) translate(-50%, -50%) scale(${holding ? 1 : 0.6})`;
    ring.style.opacity = Math.round(f) === 0 || STEPS[Math.round(f)].end || !holding ? 0 : 1;
    const cur = Math.round(f);
    if (cur !== shownStep) { shownStep = cur; showCard(cur); }
  });
  function showCard(i) {
    const st = STEPS[i], card = $('[data-detail-card]');
    $$('[data-detail-index] li').forEach((li, k) => li.classList.toggle('is-on', st.end ? k === 0 : k === i));
    $('[data-dc-bar]').style.transform = `scaleX(${i / (STEPS.length - 1)})`;
    gsap.to(card, { opacity: 0, y: 12, duration: 0.16, overwrite: true, onComplete: () => {
      $('[data-dc-title]').textContent = st.title;
      $('[data-dc-text]').textContent = st.text;
      gsap.to(card, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' });
    } });
  }

  /* ---------- intro: photo and UI are simply there; only the headline letters rise ---------- */
  function intro() {
    $$('[data-hero-word]').forEach((w) => split(w, 'chars'));
    try { sessionStorage.setItem('naturik.seen', '1'); } catch {}
    if (reduceMotion) return;
    gsap.from($$('.hero__title .char'), { yPercent: 110, stagger: 0.02, duration: 0.9, ease: 'expo.out', delay: 0.05,
      onComplete: () => root.querySelector('.hero__title')?.classList.add('is-revealed') });
  }

  /* ---------- scroll choreography (Lenis already smooths, so scrub is direct) ---------- */
  // index links: jump the scroll to the exact point where that detail is in focus
  let detailsST = null;
  on(root, 'click', (e) => {
    const b = e.target.closest('[data-detail-go]'); if (!b || !detailsST) return;
    const i = +b.dataset.detailGo;
    const y = detailsST.start + (detailsST.end - detailsST.start) * (i / (STEPS.length - 1));
    window.naturikScrollTo ? window.naturikScrollTo(y, 0) : window.scrollTo({ top: y, behavior: 'smooth' });
  });

  const ctx = gsap.context(() => {
    if (reduceMotion) { S.opacity = 0; return; }
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 820px)', mob: '(max-width: 819px)' }, (c) => {
      const d = c.conditions.desk;
      const step = (trigger, to, st = {}) => gsap.to(S, { ...to, ease: 'none', immediateRender: false, scrollTrigger: { trigger, start: 'top bottom', end: 'top top', scrub: true, ...st } });
      step('#spec', { x: d ? -0.22 : 0, y: d ? 0 : -0.17, scale: d ? 0.92 : 0.64, rotY: 0, rotZ: -1.5, img: 1, zoom: 1.12, pan: 0 });
      step('#drop', { x: d ? 0.22 : 0, y: d ? 0 : -0.19, scale: d ? 0.92 : 0.6, rotY: 0, rotZ: 1.5, img: 2, zoom: 1.08, pan: 0 });
      step('#details', { x: 0, y: 0, scale: 1.5, rotY: 0, rotZ: 0, img: 0, zoom: 1, pan: 0, opacity: 0 }, { end: 'top 15%' });
      detailsST = gsap.to(Z, { step: STEPS.length - 1, ease: 'none', scrollTrigger: { trigger: '#details', start: 'top top', end: d ? '+=460%' : '+=340%', pin: '[data-details-pin]', scrub: true } }).scrollTrigger;
    });
    ScrollTrigger.create({ trigger: '#details', start: 'top bottom', end: 'bottom top', onToggle: (s) => { Z.active = s.isActive; Z.dirty = true; media.style.visibility = s.isActive ? 'visible' : 'hidden'; } });
    // release: the full-bleed photo folds back into a card as the next section arrives (mirror of the entry)
    gsap.timeline({ scrollTrigger: { trigger: '#manifesto', start: 'top bottom', end: 'top 25%', scrub: true } })
      .fromTo(media, { scale: 1, borderRadius: 0 }, { scale: 0.68, borderRadius: 28, ease: 'none', immediateRender: false }, 0)
      .to(root.querySelector('.details__ui'), { opacity: 0, y: -30, ease: 'none' }, 0);
    ScrollTrigger.create({ trigger: '#spec', start: 'top 60%', onEnter: () => setChip(1), onLeaveBack: () => setChip(0) });
    ScrollTrigger.create({ trigger: '#drop', start: 'top 60%', onEnter: () => setChip(2), onLeaveBack: () => setChip(1) });
    gsap.fromTo(media, { scale: 0.68, borderRadius: 28 }, { scale: 1, borderRadius: 0, ease: 'none', immediateRender: true, scrollTrigger: { trigger: '#details', start: 'top 85%', end: 'top top', scrub: true } });


    const scrub = $('[data-scrub-text]');
    gsap.fromTo(split(scrub, 'words'), { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 45%', scrub: true } });

    const track = $('[data-look-track]');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 40);
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '[data-look-pin]', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true } });


    initReveals(root);
  }, root === document ? undefined : root);

  measure();
  on(window, 'resize', measure);
  intro();
  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => { ctx.revert(); cleanups.forEach((f) => f()); };
}
