import { gsap, reduceMotion } from '../core/scroll.js';
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
  const kinds = [...PARTNERS.map((p) => ({ t: 'p', p })), ...INFO.slice(0, nInfo).map((x) => ({ t: 'i', x }))];
  while (kinds.length < n) kinds.push({ t: 'g' });
  kinds.sort(() => Math.random() - 0.5);
  const ERRS = ['ERR 0x41 cell_overflow', 'WARN restock_disabled', 'SIGNAL LOST', 'ERR cold_spot_not_found', '404 logo_on_jacket', 'retry 3/3 …', 'checksum ≠ 78', 'FATAL warmth > 100%', 'ERR 0x7f satin_glare'];
  grid.style.setProperty('--cols', cols);
  grid.innerHTML = kinds.map((k) => {
    if (k.t === 'i') return `<div class="pcell pcell--info" role="presentation"><b class="pinfo__big">${k.x[0]}</b><span class="pinfo__txt">${k.x[1]}</span></div>`;
    if (k.t === 'g') return `<div class="pcell pcell--glitch" role="presentation" aria-hidden="true"><span class="gl__box"><b>+</b><i></i></span><span class="gl__box gl__box--b"><b>+</b><i></i></span><pre class="gl__txt"></pre></div>`;
    const p = k.p;
    return `<div class="pcell pcell--p" role="listitem"><button class="partner partner--${p.c}" type="button" aria-expanded="false" data-partner="${p.id}">
      <span class="partner__logo" aria-hidden="true">${LOGOS[p.id]}</span>
      <span class="partner__txt"><span class="partner__name">${p.name}</span><span class="partner__role">${p.role} • Since ${p.since}</span></span>
      <span class="partner__more">Open +</span></button></div>`;
  }).join('');
  const glitch = [...grid.querySelectorAll('.pcell--glitch')].map((c) => ({ c, txt: c.querySelector('.gl__txt'), boxes: [...c.querySelectorAll('.gl__box')] }));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const glitchStep = () => glitch.forEach((g) => {
    if (Math.random() < 0.55) g.txt.textContent = Array.from({ length: 3 + (Math.random() * 3 | 0) }, () => Math.random() < 0.6 ? pick(ERRS) : `${HEX()} ${HEX().slice(0, 4)}`).join('\n');
    g.c.classList.toggle('is-jolt', Math.random() < 0.18);
    g.boxes.forEach((b) => {
      if (Math.random() < 0.5) return;
      const w = rnd(26, 62), h = rnd(22, 54);
      b.style.cssText = `left:${rnd(4, 70) | 0}%;top:${rnd(6, 70) | 0}%;width:${w | 0}px;height:${h | 0}px`;
      b.lastChild.textContent = `X${String(rnd(0, 160) | 0).padStart(3, '0')}Y${String(rnd(0, 160) | 0).padStart(3, '0')}`;
    });
  });
  glitchStep();

  let open = null;
  const show = (id) => {
    const btns = grid.querySelectorAll('[data-partner]');
    if (open === id) { open = null; panel.hidden = true; btns.forEach((b) => b.setAttribute('aria-expanded', 'false')); return; }
    open = id;
    const p = PARTNERS.find((x) => x.id === id);
    btns.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.partner === id)));
    panel.innerHTML = `<div class="pp">
      <div class="pp__top"><span class="pp__logo partner--${p.c}" aria-hidden="true">${LOGOS[p.id]}</span>
        <div><h3 class="pp__name">${p.name}</h3><p class="pp__meta">${p.role} · ${p.city}</p></div>
        <button class="pp__close" type="button" aria-label="Close" data-pp-close>×</button></div>
      <p class="pp__text">${p.what}</p>
      <div class="pp__chips"><span class="size-chip pp__chip is-on">Since ${p.since}</span>${p.how.map((h) => `<span class="size-chip pp__chip">${h}</span>`).join('')}</div>
    </div>`;
    panel.hidden = false;
    panel.animate?.([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
  };
  const click = (e) => {
    const b = e.target.closest('[data-partner]'); if (b) return show(b.dataset.partner);
    if (e.target.closest('[data-pp-close]')) show(open);
  };
  sec.addEventListener('click', click);

  // scroll-in: the left and right halves of the grid slide in from the sides and close over "Our partners"
  let st = null;
  if (!reduceMotion) {
    const cells = [...grid.children], half = cols / 2;
    const left = cells.filter((_, k) => (k % cols) < Math.floor(half)), right = cells.filter((_, k) => (k % cols) >= Math.ceil(half)), mid = cells.filter((_, k) => cols % 2 && (k % cols) === Math.floor(half));
    const intro = sec.querySelector('[data-partners-intro]');
    const tl = gsap.timeline({ scrollTrigger: mobile
      ? { trigger: sec, start: 'top 85%', end: 'top 10%', scrub: 0.5 }
      : { trigger: sec, start: 'top top', end: () => `+=${innerHeight * 0.9}`, pin: true, scrub: 0.5, refreshPriority: 1, anticipatePin: 1 } });
    tl.fromTo(left, { xPercent: -100 * Math.ceil(half) }, { xPercent: 0, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(right, { xPercent: 100 * Math.ceil(half) }, { xPercent: 0, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(mid, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, ease: 'power2.out', duration: 0.35 }, 0.65)
      .fromTo(intro, { scale: 1, opacity: 1 }, { scale: 0.86, opacity: 0, ease: 'power1.in', duration: 0.35 }, 0.62);
    st = tl.scrollTrigger;
  }
  let timer = 0;
  const io = new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(glitchStep, 160); });
  io.observe(sec);
  return () => { st?.kill(true); clearInterval(timer); io.disconnect(); sec.removeEventListener('click', click); };
}
