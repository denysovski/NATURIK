# NATURIK — Drop 01

A one-product drop store for the **M1 Puffer 78C**: 78 hand-filled cells, numbered pieces, never restocked.
Built as a fast, animated single-page experience with a full (simulated) shop and checkout.

**▶ Live site: https://denysovski.github.io/NATURIK/**

![Landing page](docs/screens/01-hero.jpg)

---

## What's inside

| | |
|---|---|
| **Pages** | Home, Shop (with product detail), Contact — switched without reloads |
| **Shop** | Filters, sorting, 2/3-column view, product gallery, size finder, waitlist for sold-out sizes |
| **Cart & checkout** | Slide-in bag, discount codes, 4-step checkout with card validation (demo only, no payments) |
| **Motion** | Scroll-driven photo stage, zoom-in sections, page transitions with a tracker/terminal overlay, counters, glitch effects |
| **Extras** | First-visit 10% popup with newsletter sign-up, live "people looking now" line, floating social button |
| **3D** | A green blob and three small glossy objects, rendered with three.js only when on screen |
| **SEO** | Meta + Open Graph, JSON-LD (Product, ItemList, FAQ, Organization), sitemap, robots, 404 |

## Tour of the homepage

| | |
|---|---|
| ![Warmth](docs/screens/02-warmth.jpg) **Portable summer** — the photo card travels with the story, specs count up as they scroll in. | ![Our partners](docs/screens/03b-our-partners.jpg) **Our partners** — the section zooms in to fill the screen before the grid closes. |
| ![Partners](docs/screens/03-partners.jpg) **Partners grid** — 7×2, one partner per column, info cards and connected tracker cells. Open a partner for details. | ![Live count](docs/screens/04-live-count.jpg) **Live count** — who's looking right now, stock per size, add straight to the bag. |
| ![Signal](docs/screens/05-signal.jpg) **Signal** — flashing phrases, each one a link to a part of the site. | ![Promo](docs/screens/15-promo.jpg) **First visit** — leave an email, get the 10% code instantly. |
| ![Who we are](docs/screens/06-who-we-are.jpg) **Who we are** — a soft 3D blob that swells on hover. | ![Closer](docs/screens/07-closer.jpg) **Closer** — pinned zoom into six details, with a green crosshair and a clickable index. |
| ![Who it's for](docs/screens/08-who-its-for.jpg) **Who it's for** — one 3D object per type of wearer. | ![Lookbook](docs/screens/09-lookbook.jpg) **Lookbook** — horizontal scroll, mixed frame sizes, drifting light. |
| ![Drop row](docs/screens/10-drop-row.jpg) **Drop 01 — six pieces** — Obsidian on top, Arctic below, photo swap on hover. | ![Contact](docs/screens/13-contact.jpg) **Contact** — form, studio details, socials. |

## Floating social menu

![Social menu](docs/screens/14-social.jpg)

## Shop

| | |
|---|---|
| ![Shop](docs/screens/11-shop.jpg) | ![Product](docs/screens/12-product.jpg) |

## Mobile

<p>
  <img src="docs/screens/m-hero.jpg" width="240" alt="Mobile landing">
  <img src="docs/screens/m-live-count.jpg" width="240" alt="Mobile live count">
  <img src="docs/screens/m-drop-row.jpg" width="240" alt="Mobile product row">
</p>

---

## Try the demo checkout

- Card number **4242 4242 4242 4242**, any future date, any CVC
- Discount codes **DROP01** (−10 %) and **CELL78** (−7.8 %)
- Nothing is charged and no order is sent — the bag lives in your browser
- The "people looking right now" numbers are simulated for the demo

## Tech

- **Vite** — multi-page build, small custom plugin for HTML partials and build-time product rendering
- **GSAP + ScrollTrigger** and **Lenis** — all scroll animation and smooth scrolling
- **three.js** — loaded lazily, only for the 3D pieces
- Plain HTML, CSS and JavaScript — no framework
- Fonts: Neue Montreal, Dirtyline and Canobis (self-hosted)

```
index.html · shop.html · contact.html   pages
partials/                               header, footer, overlays
src/js/core/                            app shell, router, scroll
src/js/components/                      cart, checkout, product page, 3D, effects …
src/js/data/products.js                 the six pieces of Drop 01
src/styles/                             tokens, components, pages
public/                                 images, fonts, icons, SEO files
```

## Run it locally

```bash
npm install
npm run dev       # local dev server
npm run build     # production build into dist/
npm run preview   # serve the build
```

Pushing to `main` builds and deploys to GitHub Pages automatically.

---

<sub>Demo store. Product names, partners and figures are for illustration only.</sub>
