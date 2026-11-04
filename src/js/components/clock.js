// Live clock: real local time (hour, minute, smooth second sweep) + a line at every hour mark showing
// how many people opened the page in that hour today. Shows the current 12-hour half of the day.
// Data: STATS_URL (JSON { hours: [24 numbers], now: number }) when analytics is connected; until then a
// believable sample, seeded by the date so it is stable through the day and grows as the hour goes on.
import { gsap, ScrollTrigger, reduceMotion } from '../core/scroll.js';

const STATS_URL = '';                       // e.g. a tiny serverless endpoint reading Plausible's Stats API
const NS = 'http://www.w3.org/2000/svg';
const C = 500, R_TICK = 285, R_BAR = 306, BAR_MAX = 104;

const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
// a night-leaning day: quiet at 4 am, lunch bump, the real peak late evening
const SHAPE = [0.32, 0.22, 0.14, 0.09, 0.06, 0.07, 0.12, 0.2, 0.3, 0.38, 0.44, 0.5, 0.58, 0.55, 0.48, 0.47, 0.52, 0.6, 0.7, 0.82, 0.93, 1, 0.86, 0.58];
function sampleDay(d = new Date()) {
  const r = seeded(d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate());
  const scale = 300 + r() * 160;
  return SHAPE.map((k) => Math.round(k * scale * (0.82 + r() * 0.36)));
}


// slot-machine numbers: every character sits in its own little window; when it changes, the new
// character rolls up from below and pushes the old one out the top. `spin` runs a few random digits first.
function roll(el, str, { spin = 0, delay = 0 } = {}) {
  if (el._v === str && !spin) return;
  const old = el._v ?? '';
  el._v = str;
  if (reduceMotion) { el.textContent = str; return; }
  const chars = [...str], prev = [...old];
  if (!el._built || prev.length !== chars.length) {
    el.setAttribute('aria-label', str);
    el.innerHTML = chars.map(() => '<span class="roll__c" aria-hidden="true"><span class="roll__col"></span></span>').join('');
    el._built = true;
  } else el.setAttribute('aria-label', str);
  const cells = [...el.children];
  const isDigit = (c) => c >= '0' && c <= '9';
  let k = 0;
  cells.forEach((cell, i) => {
    const col = cell.firstChild, to = chars[i], from = prev[i] ?? '';
    gsap.killTweensOf(col);
    if (from === to && !spin) { col.innerHTML = `<span>${to}</span>`; gsap.set(col, { yPercent: 0 }); return; }
    const seq = [from || ' '];
    if (spin && isDigit(to)) for (let n = 0; n < spin + ((chars.length - i) % 3); n++) seq.push(String((Math.random() * 10) | 0));
    seq.push(to);
    col.innerHTML = seq.map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    const order = chars.length - 1 - i;                        // the last digit moves first, like a counter
    gsap.fromTo(col, { yPercent: 0 }, { yPercent: -100 * (seq.length - 1) / seq.length, duration: spin ? 1.1 + order * 0.12 : 0.8,
      ease: spin ? 'expo.out' : 'power3.inOut', delay: delay + (spin ? order * 0.04 : order * 0.06 + k++ * 0.02),
      onComplete: () => { col.innerHTML = `<span>${to}</span>`; gsap.set(col, { yPercent: 0 }); } });
  });
}

export function mountClock(root) {
  const el = root.querySelector('[data-clock]');
  if (!el) return () => {};
  const sec = el.closest('section');
  const svg = el.querySelector('[data-clock-svg]');
  const gT = svg.querySelector('[data-clock-ticks]'), gS = svg.querySelector('[data-clock-stats]');
  const hand = { h: svg.querySelector('[data-hand="h"]'), m: svg.querySelector('[data-hand="m"]'), s: svg.querySelector('[data-hand="s"]') };
  const sweep = el.querySelector('[data-clock-sweep]'), digital = el.querySelector('[data-clock-digital]');
  const $ = (s) => sec.querySelector(s);
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent?.appendChild(n); return n; };
  const pt = (a, r) => [C + Math.sin(a) * r, C - Math.cos(a) * r];

  // 12 marks only; 12 / 3 / 6 / 9 are the longest and thickest
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, q = i % 3 === 0;
    const [x1, y1] = pt(a, R_TICK - (q ? 58 : 30)), [x2, y2] = pt(a, R_TICK);
    mk('line', { x1, y1, x2, y2, class: q ? 'clock__tick clock__tick--q' : 'clock__tick' }, gT);
  }
  // one stat line + label per hour mark
  const bars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const g = mk('g', { class: 'clock__stat' }, gS);
    const line = mk('line', { class: 'clock__bar' }, g);
    const dot = mk('circle', { class: 'clock__dot', r: 4 }, g);
    const lab = mk('text', { class: 'clock__lab', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
    const n = mk('tspan', { class: 'clock__lab-n' }, lab), hr = mk('tspan', { class: 'clock__lab-h', dx: 6 }, lab);
    return { a, g, line, dot, lab, n, hr, k: 0 };
  });

  let hours = sampleDay(), live = 0, real = false;
  const fmt = (v) => v.toLocaleString('en-US');
  const now = () => new Date();
  const valueFor = (h, d) => {
    const cur = d.getHours();
    if (h > cur) return null;
    if (h < cur || real) return hours[h];
    return Math.max(1, Math.round(hours[h] * ((d.getMinutes() * 60 + d.getSeconds()) / 3600)));   // current hour fills up
  };
  const bumpLive = () => { if (real) return; const target = Math.max(3, Math.round(hours[now().getHours()] / 9)); live = live ? Math.round(live + Math.sign(target - live) * (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0)) : target; };
  bumpLive();
  let grow = reduceMotion ? 1 : 0, spinNext = false;           // 0 → 1 as the section comes in
  const drawStats = () => {
    const d = now(), pm = d.getHours() >= 12, base = pm ? 12 : 0;
    const vals = bars.map((_, i) => valueFor(base + i, d));
    const max = Math.max(1, ...hours.slice(base, base + 12));
    let today = 0; for (let h = 0; h <= d.getHours(); h++) today += valueFor(h, d) || 0;
    bars.forEach((b, i) => {
      const v = vals[i], cur = base + i === d.getHours();
      const t = Math.min(1, Math.max(0, grow * 1.6 - i * 0.05));        // staggered grow-in
      const len = v == null ? 0 : (14 + (v / max) * BAR_MAX) * t;
      const [x1, y1] = pt(b.a, R_BAR), [x2, y2] = pt(b.a, R_BAR + len);
      b.line.setAttribute('x1', x1); b.line.setAttribute('y1', y1); b.line.setAttribute('x2', x2); b.line.setAttribute('y2', y2);
      b.dot.setAttribute('cx', v == null ? x1 : x2); b.dot.setAttribute('cy', v == null ? y1 : y2);
      const [lx, ly] = pt(b.a, R_BAR + len + 40);
      b.lab.setAttribute('x', lx.toFixed(1)); b.lab.setAttribute('y', ly.toFixed(1));
      b.n.textContent = v == null ? '' : fmt(v);
      b.hr.textContent = v == null ? '' : `${String(base + i).padStart(2, '0')}h`;
      b.lab.style.opacity = v == null ? 0 : t;
      b.g.classList.toggle('is-future', v == null); b.g.classList.toggle('is-now', cur);
    });
    const sofar = hours.slice(0, d.getHours() + 1).map((_, h) => valueFor(h, d) || 0);
    const peakH = sofar.reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0);
    roll($('[data-clock-today]'), fmt(today), { spin: spinNext ? 4 : 0, delay: spinNext ? 0.1 : 0 });
    roll($('[data-clock-peak]'), `${String(peakH).padStart(2, '0')}:00`, { spin: spinNext ? 4 : 0, delay: spinNext ? 0.2 : 0 });
    roll($('[data-clock-now]'), fmt(Math.max(1, live)), { spin: spinNext ? 4 : 0 });
    spinNext = false;
    svg.querySelector('[data-clock-desc]').textContent = `Clock showing ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${fmt(today)} visitors so far today.`;
  };

  // hands: real time; on entry they sweep in from 12 (reveal 0 → 1), then run live
  let reveal = reduceMotion ? 1 : 0;
  const setHands = () => {
    const d = now(), ms = d.getMilliseconds(), s = d.getSeconds() + ms / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    const e = reveal;
    hand.h.setAttribute('transform', `rotate(${(h * 30 * e).toFixed(2)} 500 500)`);
    hand.m.setAttribute('transform', `rotate(${(m * 6 * e).toFixed(2)} 500 500)`);
    hand.s.setAttribute('transform', `rotate(${(s * 6 * e).toFixed(2)} 500 500)`);
    sweep.style.transform = `rotate(${(s * 6 * e).toFixed(2)}deg)`;
    digital.textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  let raf = 0, lastStats = 0;
  const frame = (t) => {
    raf = requestAnimationFrame(frame);
    setHands();
    if (t - lastStats > 1000 || grow < 1) { lastStats = t; drawStats(); }
  };
  const play = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { rootMargin: '20% 0px' });
  io.observe(el);
  setHands(); drawStats();

  // live counter wobbles a little every few seconds (sample mode)
  let wob = 0;
  const tickLive = () => { wob = setTimeout(() => { if (raf) { bumpLive(); drawStats(); } tickLive(); }, 7000 + Math.random() * 6000); };
  tickLive();

  if (STATS_URL) fetch(STATS_URL).then((r) => r.json()).then((j) => {
    if (Array.isArray(j.hours) && j.hours.length === 24) { hours = j.hours; real = true; live = j.now ?? live; drawStats(); }
  }).catch(() => {});

  // entry: the clock scales up with the scroll, then the hands sweep in and the stat lines grow
  const sts = [];
  if (!reduceMotion) {
    gsap.set(el, { scale: 0.62, opacity: 0.2 });
    sts.push(gsap.to(el, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'center center', scrub: true } }).scrollTrigger);
    const st = { r: 0, g: 0 };
    sts.push(ScrollTrigger.create({ trigger: sec, start: 'top 45%', once: true, onEnter: () => {
      gsap.to(st, { r: 1, duration: 1.6, ease: 'expo.inOut', onUpdate: () => { reveal = st.r; } });
      gsap.to(st, { g: 1, duration: 1.8, delay: 0.35, ease: 'power3.out', onUpdate: () => { grow = st.g; drawStats(); } });
      el.classList.add('is-on');
      spinNext = true; drawStats();
    } }));
  } else el.classList.add('is-on');

  return () => { pause(); io.disconnect(); clearTimeout(wob); sts.forEach((t) => t.kill()); gsap.set(el, { clearProps: 'all' }); };
}
