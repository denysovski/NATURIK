<div align="center">

# NATURIK — Drop 01

**One down jacket. Two colours. 500 numbered pieces. Never restocked.**

A drop store for the M1 Puffer: scroll-driven storytelling, live 3D objects and a complete (simulated) shop with checkout. No framework, no page reloads.

[**Open the live site**](https://denysovski.github.io/NATURIK/) &nbsp;·&nbsp; [Shop](https://denysovski.github.io/NATURIK/shop.html) &nbsp;·&nbsp; [Product](https://denysovski.github.io/NATURIK/shop.html?p=m1-obsidian) &nbsp;·&nbsp; [Contact](https://denysovski.github.io/NATURIK/contact.html)

![Vite](https://img.shields.io/badge/Vite-000000?style=flat-square&labelColor=000000&logo=vite&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP%20%2B%20ScrollTrigger-000000?style=flat-square&labelColor=000000&logo=greensock&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-000000?style=flat-square&labelColor=000000&logo=threedotjs&logoColor=white)
![Lenis](https://img.shields.io/badge/Lenis-smooth%20scroll-000000?style=flat-square&labelColor=000000)
![No framework](https://img.shields.io/badge/framework-none-000000?style=flat-square&labelColor=000000)

<br>

![Landing page](docs/screens/01-hero.jpg)

</div>

---

## At a glance

| | |
|---|---|
| **The drop** | M1 Puffer **77C** (Obsidian) and **78C** (Arctic), 250 of each. One stock source drives every counter: the nav chip, the hero, Live count, the shop and each product (**106 left: 65 black, 41 white**). |
| **Pages** | Home, Shop with product pages, Contact, Privacy, Terms and 404. Pages switch without reloads, with a tracker/terminal transition. |
| **Shop** | Colour filter, sorting, full-photo gallery with a fact on every photo, a 20-second size finder, a size guide, a waitlist for sold-out sizes and a sliding Obsidian ↔ Arctic switch. |
| **Bag & checkout** | Slide-in bag, free-shipping meter, discount codes, 4-step checkout with card validation (demo only, nothing is charged). |
| **Motion** | Pinned zoom sections, a scroll-scrubbed photo stage, slot-machine counters, a live clock, glitch partners grid and smooth Lenis scrolling. |
| **3D** | A WebGL blob, glossy objects (bike wheel + thermometer, camera, star), a megaphone and a tilted question mark. All three.js, loaded lazily and drawn only while on screen. |
| **SEO** | Meta and Open Graph, JSON-LD (Product, ItemList, FAQ, Organization), sitemap, robots, 404. |

---

## Home

The homepage tells the story of the jacket from top to bottom. Each section has its own scroll choreography.

| | |
|---|---|
| ![Hero](docs/screens/01-hero.jpg) **Hero.** The giant M1 Puffer wordmark around one glass photo card, plus *Remaining 106/500* counting up on load. | ![Portable summer](docs/screens/02-warmth.jpg) **Portable summer.** The photo card travels with the scroll and the specs count up as they enter. |
| ![Our partners](docs/screens/03-partners-intro.jpg) **Our partners.** The section zooms in to fill the screen, then both halves of the grid slide shut over the title. | ![Partners grid](docs/screens/04-partners.jpg) **Partners grid.** A 7 × 2 grid of partners, facts and glitching tracker cells joined by dashed lines. |
| ![Partner card](docs/screens/05-partner-card.jpg) **Partner card.** *Open +* shows a sharp, centred card with a *Since* pill and a link. | ![Live count](docs/screens/06-live-count.jpg) **Live count.** Who is looking right now, stock per size across the whole drop, and the giant *106 left of 500*. |
| ![Signal](docs/screens/07-signal.jpg) **Signal.** Flashing phrases with tracker boxes. Every phrase links somewhere on the site. | ![Who we are](docs/screens/08-who-we-are.jpg) **Who we are.** A soft WebGL blob next to the manifesto, plus *Follow the studio* links. |
| ![Closer](docs/screens/09-closer.jpg) **Closer.** A pinned, full-bleed zoom through six details with a crosshair and a clickable index. | ![Who it's for](docs/screens/10-who-its-for.jpg) **Who it's for.** One glossy 3D object per type of wearer: a bike wheel with a thermometer, a studio camera and a star. |
| ![Lookbook](docs/screens/11-lookbook.jpg) **Lookbook.** Horizontal scroll through mixed frame sizes and notes. | ![Who showed up](docs/screens/12-clock.jpg) **Who showed up.** A real-time clock with a sweeping second hand. Each hour mark shows visitors in that hour, and the numbers roll like a slot machine. |

![Drop 01 — two pieces](docs/screens/13-drop-row.jpg)
**Drop 01 — two pieces.** Obsidian left, Arctic right, with pieces left in green and a photo swap on hover.

---

## Shop & product

| | |
|---|---|
| ![Shop](docs/screens/20-shop.jpg) **The Drop.** *106 pieces left*, one jacket in two colours. | ![Shop grid](docs/screens/21-shop-grid.jpg) **Grid.** Colour filter, sorting and two big cards. |
| ![Opening an item](docs/screens/22-opening.jpg) **Opening an item.** The card blurs under a spinner until the product page is ready. | ![Product](docs/screens/23-product.jpg) **Product page.** The gallery stays fixed while the right column scrolls. Every photo carries a small fact, shuffled differently per colour. |
| ![Size finder](docs/screens/24-size-finder.jpg) **Find my size.** Height and chest (digits only, custom steppers) give a recommendation in cobalt. | ![Size guide](docs/screens/25-size-guide.jpg) **Size guide.** Body and garment measurements, sharp from the first frame. |

![Bag](docs/screens/26-bag.jpg)
**Bag.** Slide-in drawer with a free-shipping meter, quantity steppers and the checkout button.

---

## Contact

| | |
|---|---|
| ![Talk to us](docs/screens/30-contact.jpg) **Talk to us.** A big green and blue 3D megaphone, the average reply time and the opening hours. | ![Hours](docs/screens/34-hours.jpg) **Hours bubble.** Hover the hours for the week, with the weekend *Off* in green. |
| ![What do you need?](docs/screens/31b-onboarding-hover.jpg) **What do you need?** A two-step onboarding: pick one of five topics instead of facing one long form. | ![Sizing form](docs/screens/32-sizing-form.jpg) **Topic form.** Each topic asks only for what it needs, e.g. height and usual size for sizing help. |

![Before you ask](docs/screens/33-faq.jpg)
**Before you ask.** The FAQ, with a tilted, glossy 3D question mark.

---

## Mobile

| | | |
|:---:|:---:|:---:|
| <img src="docs/screens/m-hero.jpg" width="230" alt="Mobile hero"><br><sub>Hero</sub> | <img src="docs/screens/m-live-count.jpg" width="230" alt="Mobile live count"><br><sub>Live count</sub> | <img src="docs/screens/m-who.jpg" width="230" alt="Mobile 3D cards"><br><sub>Who it's for, 3D</sub> |
| <img src="docs/screens/m-clock.jpg" width="230" alt="Mobile clock"><br><sub>Who showed up</sub> | <img src="docs/screens/m-product.jpg" width="230" alt="Mobile product"><br><sub>Product</sub> | <img src="docs/screens/m-contact.jpg" width="230" alt="Mobile contact"><br><sub>Contact</sub> |

---

## Try the demo checkout

- Card **4242 4242 4242 4242**, any future date, any CVC
- Codes **DROP01** (−10 %) and **CELL78** (−7.8 %)
- Nothing is charged and no order is sent. The bag lives in your browser.
- *People looking now* and the visitor clock use sample figures. `src/js/components/clock.js` has a `STATS_URL` hook for real analytics.

## Under the hood

- **Vite** multi-page build, with a small plugin for HTML partials and build-time product rendering
- **GSAP + ScrollTrigger** for every scroll animation, and **Lenis** for smooth scrolling
- **three.js**, lazily imported. Each 3D object compiles in idle time and renders only while visible. The blob adapts its resolution to the device.
- A custom SPA router, so pages swap without reloads, with history and focus handling
- Plain HTML, CSS and JavaScript. Fonts: Neue Montreal, Dirtyline and Canobis.

```
index.html · shop.html · contact.html   pages
partials/                               header, footer, overlays (bag, modals, social button)
src/js/core/                            app shell, router, scroll
src/js/components/                      product page, bag, checkout, clock, partners, 3D (blob, who3d, contact3d) …
src/js/data/products.js                 the two colourways, stock and editions
src/styles/                             tokens, components, pages
public/                                 images, fonts, icons, SEO files
```

## Run it locally

```bash
npm install
npm run dev       # dev server
npm run build     # production build into dist/
npm run preview   # serve the build
```

Pushing to `main` builds and deploys to GitHub Pages automatically.

---

<div align="center"><sub>Demo store. Product names, partners and figures are for illustration only.</sub></div>
