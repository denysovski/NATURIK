import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis = null;

export function initScroll() {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: !reduceMotion, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // in-page anchors through Lenis
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#top') { e.preventDefault(); lenis.scrollTo(0, { duration: 1.6 }); return; }
    const el = id.length > 1 && document.querySelector(id);
    if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -20, duration: 1.4 }); }
  });
  return lenis;
}

export const lockScroll = () => { lenis?.stop(); document.body.classList.add('is-locked'); };
export const unlockScroll = () => { lenis?.start(); document.body.classList.remove('is-locked'); };
export { gsap, ScrollTrigger };
