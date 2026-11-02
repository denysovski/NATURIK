// Partners divider: a 9×2 grid (3×6 on phones) with white rules. The four partners land in random
// cells (never two in one column), the rest carry tracker coordinates. Picking a partner opens a
// panel styled like the Live count buy box. A terminal log streams behind it while it's on screen.
const LOGOS = {
  halden: '<svg viewBox="0 0 64 40"><ellipse cx="32" cy="20" rx="29" ry="16" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="32" cy="20" rx="20" ry="9" fill="currentColor" opacity=".9"/><path d="M18 14c5-4 14-5 20-3" stroke="#000" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/></svg>',
  kovar: '<svg viewBox="0 0 64 40"><path d="M4 26 12 14l8 12 8-12 8 12 8-12 8 12 8-12" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><rect x="28" y="4" width="8" height="9" rx="2" fill="currentColor"/><rect x="30.5" y="13" width="3" height="10" fill="currentColor"/></svg>',
  ostrava: '<svg viewBox="0 0 64 40"><rect x="8" y="4" width="48" height="9" rx="4.5" fill="currentColor"/><rect x="6" y="15.5" width="52" height="9" rx="4.5" fill="currentColor" opacity=".75"/><rect x="10" y="27" width="44" height="9" rx="4.5" fill="currentColor" opacity=".5"/></svg>',
  nightline: '<svg viewBox="0 0 64 40"><mask id="nl-m"><rect width="64" height="40" fill="#fff"/><circle cx="40" cy="15" r="14" fill="#000"/></mask><circle cx="30" cy="20" r="17" fill="currentColor" mask="url(#nl-m)"/><circle cx="52" cy="9" r="2.2" fill="currentColor"/><circle cx="57" cy="22" r="1.6" fill="currentColor"/><circle cx="49" cy="31" r="1.3" fill="currentColor"/></svg>',
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
];
const WORDS = ['X034Y089', 'X110Y048', 'X079Y090', 'cell 41', 'DROP01', '−25 °C', 'X122Y057', 'X041Y129', '800 FP', 'X060Y046', 'M1 / 78C', 'X098Y125', 'satin', 'X015Y094'];
const HEX = () => Math.random().toString(16).slice(2, 10);

export function mountPartners(root) {
  const sec = root.querySelector('.partners');
  if (!sec) return () => {};
  const grid = sec.querySelector('[data-partners-grid]'), panel = sec.querySelector('[data-partners-panel]'), term = sec.querySelector('[data-partners-term]');
  const mobile = innerWidth < 820, cols = mobile ? 3 : 9, rows = mobile ? 6 : 2;
  // random cells, one partner per column at most
  const colsPick = [...Array(cols).keys()].sort(() => Math.random() - 0.5).slice(0, PARTNERS.length);
  const slots = new Map(colsPick.map((c, i) => [((Math.random() * rows) | 0) * cols + c, PARTNERS[i]]));
  let wi = (Math.random() * WORDS.length) | 0;
  grid.style.setProperty('--cols', cols);
  grid.innerHTML = Array.from({ length: cols * rows }, (_, k) => {
    const p = slots.get(k);
    if (!p) return `<div class="pcell" role="presentation"><span class="pcell__x">+</span><span class="pcell__lab">${WORDS[wi++ % WORDS.length]}</span></div>`;
    return `<div class="pcell pcell--p" role="listitem"><button class="partner partner--${p.c}" type="button" aria-expanded="false" data-partner="${p.id}">
      <span class="partner__logo" aria-hidden="true">${LOGOS[p.id]}</span>
      <span class="partner__name">${p.name}</span><span class="partner__role">${p.role} · since ${p.since}</span>
      <span class="partner__more">Open <b>+</b></span></button></div>`;
  }).join('');

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

  // terminal stream in the background, only while visible
  const lines = ['> naturik partners --list', ...PARTNERS.map((p) => `  ${p.id.padEnd(10)} ok   since ${p.since}  ${p.city}`), '  handshake 4/4', '  WARN no_logo_on_jacket (by design)'];
  let li = 0, timer = 0;
  const step = () => {
    const row = li < lines.length ? lines[li] : `  ${HEX()} ${HEX()}  ${WORDS[li % WORDS.length]}`;
    li++;
    const rowsNow = (term.textContent ? term.textContent.split('\n') : []).concat(row);
    term.textContent = rowsNow.slice(-28).join('\n');
  };
  const io = new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(step, 140); });
  io.observe(sec);
  return () => { clearInterval(timer); io.disconnect(); sec.removeEventListener('click', click); };
}
