// Single entry for every page: boot shared UI once, then let the router mount page modules.
import { initApp } from './core/app.js';
import { initRouter } from './core/router.js';
import { ScrollTrigger } from './core/scroll.js';
import { lenis } from './core/scroll.js';
import { mount as home } from './pages/home.js';
import { mount as shop } from './pages/shop.js';
import { mount as contact } from './pages/contact.js';

initApp();
ScrollTrigger.config({ ignoreMobileResize: true });
window.naturikScrollTo = (el, offset = 0) => lenis ? lenis.scrollTo(el, { offset, duration: 1.2 }) : el.scrollIntoView({ behavior: 'smooth' });
initRouter({ home, shop, contact });
