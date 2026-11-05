import { gsap, ScrollTrigger, reduceMotion } from '../core/scroll.js';
// Partners divider: a 7×2 grid filling the whole section (2×7 on phones) with white rules. The four partners land in random
// partners, info cards and glitching tracker cells are shuffled into the grid. Picking a partner opens
// a panel styled like the Live count buy box. Glitches animate only while the section is on screen.
const LOGOS = {
  halden: '<svg viewBox="0 0 64 40"><ellipse cx="32" cy="20" rx="29" ry="16" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="32" cy="20" rx="20" ry="9" fill="currentColor" opacity=".9"/><path d="M18 14c5-4 14-5 20-3" stroke="#000" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/></svg>',
  kovar: '<svg viewBox="0 0 64 40"><path d="M4 26 12 14l8 12 8-12 8 12 8-12 8 12 8-12" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><rect x="28" y="4" width="8" height="9" rx="2" fill="currentColor"/><rect x="30.5" y="13" width="3" height="10" fill="currentColor"/></svg>',
  ostrava: '<svg viewBox="0 0 64 40"><rect x="8" y="4" width="48" height="9" rx="4.5" fill="currentColor"/><rect x="6" y="15.5" width="52" height="9" rx="4.5" fill="currentColor" opacity=".75"/><rect x="10" y="27" width="44" height="9" rx="4.5" fill="currentColor" opacity=".5"/></svg>',
  nightline: '<svg viewBox="0 0 64 40"><mask id="nl-m"><rect width="64" height="40" fill="#fff"/><circle cx="40" cy="15" r="14" fill="#000"/></mask><circle cx="30" cy="20" r="17" fill="currentColor" mask="url(#nl-m)"/><circle cx="52" cy="9" r="2.2" fill="currentColor"/><circle cx="57" cy="22" r="1.6" fill="currentColor"/><circle cx="49" cy="31" r="1.3" fill="currentColor"/></svg>',
  morava: '<svg viewBox="0 0 64 40"><path d="M4 30C14 8 22 8 32 20s18 12 28-10" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M4 36C14 14 22 14 32 26s18 12 28-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".6"/></svg>',
  vltava: '<svg viewBox="0 0 64 40"><path d="M32 3 47 11.5v17L32 37 17 28.5v-17z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 12v16M25 16l14 8M39 16l-14 8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  ferro: '<svg viewBox="0 0 64 40"><rect x="6" y="6" width="22" height="28" rx="4" fill="currentColor"/><rect x="36" y="6" width="22" height="28" rx="11" fill="none" stroke="currentColor" stroke-width="3.2"/></svg>',
};
const PARTNERS = [
  { id: 'halden', name: 'Halden Optics', role: 'Lenses', since: '2023', city: 'Oslo', c: 'acid',
    what: 'Halden cut the acid-green lens you see in every M1 photo. We worked out the tint together so it reads the same under street sodium light and studio strobes.',
    how: ['Co-developed tint', 'Goggles in the lookbook', 'Lens cloth in every box'] },
  { id: 'kovar', name: 'Kovář Zip Co.', role: 'Hardware', since: '2024', city: 'Brno', c: 'blue',
    what: 'A three-person workshop that machines our two-way zip pulls. The offset zip on the M1 was drawn on their bench, then tested 10,000 times in the cold room.',
    how: ['Offset two-way pull', 'Matte gunmetal finish', 'Spare pull with repairs'] },
  { id: 'ostrava', name: 'Ostrava Down Works', role: 'Down', since: '2022', city: 'Ostrava', c: 'acid',
    what: 'They wash, sort and test the 800-fill down, then fill each of the 78 cells by weight. Every batch is traceable back to its RDS certificate.',
    how: ['RDS-certified down', '78 cells filled by weight', 'Re-loft service for repairs'] },
  { id: 'nightline', name: 'Nightline Studio', role: 'Image', since: '2025', city: 'Prague', c: 'blue',
    what: 'The photographers behind Drop 01. Every shot was made after dark — rooftops, tram depots, a car wash — with the jacket worn, never pinned.',
    how: ['Drop 01 campaign', 'Night-only shoots', 'Behind-the-scenes on our socials'] },
  { id: 'morava', name: 'Morava Textile', role: 'Shell fabric', since: '2023', city: 'Zlín', c: 'acid',
    what: 'They weave and calender the 20D recycled ripstop, then add the satin cire finish that makes the M1 shine like wet asphalt under street light.',
    how: ['Recycled 20D ripstop', 'Satin cire finish', 'PFC-free DWR'] },
  { id: 'vltava', name: 'Vltava Labs', role: 'Cold testing', since: '2024', city: 'Prague', c: 'blue',
    what: 'An independent lab with a −40 °C chamber. Every new pattern spends a night inside before we call it a comfort rating.',
    how: ['−25 °C comfort rating', 'Cold-chamber nights', 'Seam stress tests'] },
  { id: 'ferro', name: 'Ferro Pack', role: 'Packaging', since: '2025', city: 'Plzeň', c: 'acid',
    what: 'Recycled card boxes with no plastic, printed with your piece number. Their folding tool is the reason the box opens like a book.',
    how: ['Plastic-free box', 'Numbered sleeve', 'Return label inside'] },
];
const HEX = () => Math.random().toString(16).slice(2, 10);

export function mountPartners(root) {
  const sec = root.querySelector('.partners');
  if (!sec) return () => {};
  const grid = sec.querySelector('[data-partners-grid]'), panel = sec.querySelector('[data-partners-panel]');
  const mobile = innerWidth < 820, cols = mobile ? 2 : 7, rows = mobile ? 7 : 2;
  // 14 cells: every partner, a few info cards, the rest glitching — all shuffled on every visit
  const INFO = [
    ['78', 'cells per jacket, filled by weight in Ostrava.'],
    ['1,500 km', 'Every partner sits within it of Prague.'],
    ['0', 'logos on the jacket. Their names live here instead.'],
    ['1 night', 'at −40 °C before a rating goes on the label.'],
  ];
  const n = cols * rows, nInfo = Math.min(INFO.length, mobile ? 3 : 3);
  // one partner per column (desktop) / per row (phone), dropped randomly top or bottom / left or right
  const kinds = new Array(n).fill(null), ps = [...PARTNERS].sort(() => Math.random() - 0.5);
  if (!mobile) {
    // fixed anchors: column 1 = partner on top + tracker glitch below; column 7 top = Morava Textile
    const mor = PARTNERS.find((p) => p.id === 'morava'), others = ps.filter((p) => p !== mor);
    kinds[0] = { t: 'p', p: others[0] }; kinds[cols] = { t: 'g' };
    kinds[cols - 1] = { t: 'p', p: mor };
    for (let c = 1; c < cols - 1; c++) kinds[((Math.random() * rows) | 0) * cols + c] = { t: 'p', p: others[c] };
  }
  else for (let r = 0; r < rows; r++) kinds[r * cols + ((Math.random() * cols) | 0)] = { t: 'p', p: ps[r % ps.length] };
  const rest = [...INFO.slice(0, nInfo).map((x) => ({ t: 'i', x }))];
  while (rest.length < kinds.filter((k) => !k).length) rest.push({ t: 'g' });
  if (rest.length > kinds.filter((k) => !k).length) rest.length = kinds.filter((k) => !k).length;
  rest.sort(() => Math.random() - 0.5);
  for (let k = 0; k < n; k++) if (!kinds[k]) kinds[k] = rest.pop();
  const ERRS = ['ERR 0x41 cell_overflow', 'WARN restock_disabled', 'SIGNAL LOST', 'ERR cold_spot_not_found', '404 logo_on_jacket', 'retry 3/3 …', 'checksum ≠ 78', 'FATAL warmth > 100%', 'ERR 0x7f satin_glare'];
  grid.style.setProperty('--cols', cols);
  grid.innerHTML = kinds.map((k) => {
    if (k.t === 'i') return `<div class="pcell pcell--info" role="presentation"><b class="pinfo__big">${k.x[0]}</b><span class="pinfo__txt">${k.x[1]}</span></div>`;
    if (k.t === 'g') return `<div class="pcell pcell--glitch" role="presentation" aria-hidden="true"><span class="gl__box"><b>+</b><i></i></span><span class="gl__box gl__box--b"><b>+</b><i></i></span><span class="gl__box"><b>+</b><i></i></span><pre class="gl__txt"></pre></div>`;
    const p = k.p;
    return `<div class="pcell pcell--p" role="listitem"><button class="partner partner--${p.c}" type="button" aria-expanded="false" data-partner="${p.id}">
      <span class="partner__logo" aria-hidden="true">${LOGOS[p.id]}</span>
      <span class="partner__txt"><span class="partner__name">${p.name}</span><span class="partner__role">${p.role} • Since ${p.since}</span></span>
      <span class="partner__more">Open +</span></button></div>`;
  }).join('');
  // dashed lines stitching every tracked box across the whole grid
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'partners__lines'); svg.setAttribute('aria-hidden', 'true');
  grid.appendChild(svg);
  const glitch = [...grid.querySelectorAll('.pcell--glitch')].map((c) => ({ c, txt: c.querySelector('.gl__txt'), boxes: [...c.querySelectorAll('.gl__box')] }));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const allBoxes = () => glitch.flatMap((g) => g.boxes.filter((b) => b.style.display !== 'none'));
  let order = [];
  // cell geometry is cached (read once, and again only when the grid resizes): the glitch loop never forces a layout
  let geo = null;
  const measureGeo = () => { geo = { w: grid.offsetWidth, h: grid.offsetHeight, cells: glitch.map((g) => ({ x: g.c.offsetLeft, y: g.c.offsetTop, w: g.c.offsetWidth, h: g.c.offsetHeight })) }; };
  const drawLines = () => {
    if (!geo) measureGeo();
    const pts = [];
    glitch.forEach((g, gi) => { const c = geo.cells[gi]; g.boxes.forEach((b) => { if (b.style.display === 'none') return;
      pts.push([c.x + (parseFloat(b.style.left) / 100) * c.w + parseFloat(b.style.width) / 2, c.y + (parseFloat(b.style.top) / 100) * c.h + parseFloat(b.style.height) / 2]); }); });
    const gr = { width: geo.w, height: geo.h };
    if (order.length !== pts.length || Math.random() < 0.2) order = pts.map((_, i) => i).sort(() => Math.random() - 0.5);
    svg.setAttribute('viewBox', `0 0 ${gr.width | 0} ${gr.height | 0}`);
    let d = '', d2 = '';
    order.forEach((i, k) => {
      const p = pts[i], q = pts[order[(k + 1) % order.length]]; if (!p || !q) return;
      const kk = k % 2 ? 0.28 : -0.28, mx = (p[0] + q[0]) / 2 - (q[1] - p[1]) * kk, my = (p[1] + q[1]) / 2 + (q[0] - p[0]) * kk;
      const seg = `M${p[0] | 0} ${p[1] | 0}Q${mx | 0} ${my | 0} ${q[0] | 0} ${q[1] | 0}`;
      k % 3 ? (d += seg) : (d2 += seg);
    });
    svg.innerHTML = `<path d="${d}"/><path class="is-b" d="${d2}"/>`;
  };
  const glitchStep = () => { glitchCells(); drawLines(); };
  const glitchCells = () => glitch.forEach((g) => {
    if (Math.random() < 0.55) g.txt.textContent = Array.from({ length: 3 + (Math.random() * 3 | 0) }, () => Math.random() < 0.6 ? pick(ERRS) : `${HEX()} ${HEX().slice(0, 4)}`).join('\n');
    g.c.classList.toggle('is-jolt', Math.random() < 0.18);
    g.boxes.forEach((b, bi) => {
      if (bi === 2) b.style.display = Math.random() < 0.5 ? 'none' : '';
      if (Math.random() < 0.5 && b.style.left) return;
      const w = rnd(26, 62), h = rnd(22, 54);
      Object.assign(b.style, { left: `${rnd(4, 70) | 0}%`, top: `${rnd(6, 70) | 0}%`, width: `${w | 0}px`, height: `${h | 0}px` });
      b.lastChild.textContent = `X${String(rnd(0, 160) | 0).padStart(3, '0')}Y${String(rnd(0, 160) | 0).padStart(3, '0')}`;
    });
  });
  glitchStep();

  let open = null;
  const ro = new ResizeObserver(() => { geo = null; }); ro.observe(grid);
  const close = () => {
    if (!open) return;
    open = null;
    grid.querySelectorAll('[data-partner]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    const card = panel.querySelector('.pp');
    const done = () => { if (!open) { panel.hidden = true; panel.innerHTML = ''; } };
    card?.animate ? card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).finished.then(done) : done();
    panel.classList.remove('is-on');
  };
  const show = (id) => {
    if (open === id) return close();
    open = id;
    const p = PARTNERS.find((x) => x.id === id);
    grid.querySelectorAll('[data-partner]').forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.partner === id)));
    panel.innerHTML = `<div class="pp" tabindex="-1" role="dialog" aria-modal="false" aria-labelledby="pp-name">
      <div class="pp__top"><span class="pp__logo partner--${p.c}" aria-hidden="true">${LOGOS[p.id]}</span>
        <div><h3 class="pp__name" id="pp-name">${p.name}</h3><p class="pp__meta">${p.role} · ${p.city}</p></div>
        <button class="pp__close" type="button" aria-label="Close" data-pp-close>×</button></div>
      <p class="pp__text">${p.what}</p>
      <div class="pp__foot"><span class="pp__since">Since ${p.since}</span><a class="pp__more" href="./" data-pp-more>Learn more about this company</a></div>
    </div>`;
    // centre of what you can actually see of the section (on desktop the section is pinned, so that's the screen centre)
    // the panel sits on the section itself (outside the zooming frame), so no scale correction is needed
    const r = sec.getBoundingClientRect();
    const vis = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2;
    panel.style.setProperty('--pp-y', `${(vis - r.top).toFixed(0)}px`);
    panel.hidden = false; panel.classList.add('is-on');
    // fade + slide only, no scale: a scaled layer is rasterised blurry until the animation ends
    panel.querySelector('.pp').animate?.([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    panel.querySelector('.pp').focus({ preventScroll: true });
  };
  const click = (e) => {
    const b = e.target.closest('[data-partner]'); if (b) return show(b.dataset.partner);
    if (e.target.closest('[data-pp-close]')) return close();
    if (e.target.closest('[data-pp-more]')) { e.preventDefault(); location.reload(); return; }   // partners are fictional: reloads the same page for now
    if (open && !e.target.closest('.pp')) close();
  };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  sec.addEventListener('click', click);

  // scroll-in: the left and right halves of the grid slide in from the sides and close over "Our partners"
  let st = null;
  if (!reduceMotion) {
    const cells = [...grid.querySelectorAll('.pcell')], half = cols / 2;
    const left = cells.filter((_, k) => (k % cols) < Math.floor(half)), right = cells.filter((_, k) => (k % cols) >= Math.ceil(half)), mid = cells.filter((_, k) => cols % 2 && (k % cols) === Math.floor(half));
    const intro = sec.querySelector('[data-partners-intro]');
    // wrap everything in a frame so the section can "zoom" into the window like Closer does
    let frame = sec.querySelector('.partners__frame');
    if (!frame) { frame = document.createElement('div'); frame.className = 'partners__frame'; while (sec.firstChild) frame.appendChild(sec.firstChild); sec.appendChild(frame); }
    const sts = [];
    // ONE timeline, driven by ONE scroll range, plays the whole thing: approach (card grows) →
    // pinned (settles to full screen, halves close, rest) → leave (card shrinks while the next section
    // rises). Nothing else animates the frame, so fast scrolling, jumping or scrolling back always lands
    // on the exact same state for a given scroll position. Scrub is direct (Lenis already smooths).
    // Timeline units are screen heights, so positions map 1:1 to scroll distance.
    const A = 1, P = mobile ? 0 : 1.7, E = 0.8;                       // approach, pinned, exit
    if (!mobile) sts.push(ScrollTrigger.create({ trigger: sec, start: 'top top', end: () => `+=${innerHeight * P}`, pin: true, refreshPriority: 1 }));
    gsap.set(frame, { scale: 0.76, borderRadius: 36 });
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: mobile
      ? { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true, refreshPriority: 1 }
      : { trigger: sec, start: 'top bottom', end: () => `+=${innerHeight * (A + P + E)}`, scrub: true, refreshPriority: 1, invalidateOnRefresh: true } });
    if (mobile) {
      tl.to(frame, { scale: 1, borderRadius: 0, duration: 1 }, 0);
      const c0 = 0.55;
      tl.fromTo(left, { xPercent: -100 * Math.ceil(half) }, { xPercent: 0, ease: 'power3.inOut', duration: 0.8 }, c0)
        .fromTo(right, { xPercent: 100 * Math.ceil(half) }, { xPercent: 0, ease: 'power3.inOut', duration: 0.8 }, c0)
        .fromTo(intro, { opacity: 1 }, { opacity: 0, duration: 0.3 }, c0 + 0.45)
        .fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.15 }, c0 + 0.7)
        .to({}, { duration: 1 })
        .to(frame, { scale: 0.88, borderRadius: 28, duration: 0.6 });
    } else {
      const p0 = A;                                                    // pin starts here
      tl.to(frame, { scale: 0.9, borderRadius: 22, duration: A }, 0)    // rise + grow, linear with the scroll
        .to(frame, { scale: 1, borderRadius: 0, ease: 'sine.out', duration: 0.45 }, p0)   // settles as the pin catches it
        .fromTo(left, { xPercent: -100 * Math.ceil(half) }, { xPercent: 0, ease: 'power2.inOut', duration: 0.75 }, p0 + 0.1)
        .fromTo(right, { xPercent: 100 * Math.ceil(half) }, { xPercent: 0, ease: 'power2.inOut', duration: 0.75 }, p0 + 0.1)
        .fromTo(mid, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, ease: 'power2.out', duration: 0.3 }, p0 + 0.6)
        .fromTo(intro, { scale: 1, opacity: 1 }, { scale: 0.92, opacity: 0, ease: 'power1.in', duration: 0.3 }, p0 + 0.55)
        .fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.15 }, p0 + 0.8)
        .to(frame, { scale: 0.95, borderRadius: 18, ease: 'sine.in', duration: 0.45 }, p0 + P - 0.45)  // starts letting go
        .to(frame, { scale: 0.86, borderRadius: 32, duration: E }, p0 + P);                         // leaves with the scroll
    }
    // the frame is promoted to its own layer only while it zooms; at rest it is repainted once at full sharpness
    let moving = null;
    tl.eventCallback('onUpdate', () => { const m = Math.abs(gsap.getProperty(frame, 'scale') - 1) > 0.002; if (m !== moving) { moving = m; frame.classList.toggle('is-moving', m); } });
    sts.push(tl.scrollTrigger);
    sec._sts = sts;
  }
  sec.appendChild(panel);              // detail card: outside the frame, never scaled
  let timer = 0;
  const io = new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(glitchStep, 200); });
  io.observe(sec);
  return () => { st?.kill(true); sec._sts?.forEach((t) => t.kill(true)); clearInterval(timer); io.disconnect(); ro.disconnect(); sec.removeEventListener('click', click); document.removeEventListener('keydown', esc); };
}
