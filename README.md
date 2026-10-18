# Sahana Madhavan — Product Manager Portfolio

A fast, accessible, single-page portfolio for APM / PM / TPM / Program Manager / AI PM roles.
It's plain HTML, CSS and JavaScript with no framework and no runtime dependencies, so there is nothing to break at build time and the page loads quickly.

## Project structure

```
.
├── index.html              # All page content (sections: Home, About, Experience, Projects, Skills,
│                           #   Education, Certifications, Resume, Contact)
├── 404.html                # Not-found page
├── favicon.svg
├── robots.txt
├── vercel.json             # Vercel config: static output, clean URLs, caching + security headers
├── package.json            # npm scripts (dev server, verify)
├── scripts/verify.mjs      # Build step: fails the deploy if any local image/link/anchor is missing
├── resume/                 # Put Sahana-Madhavan-Resume.pdf here (see below)
└── assets/
    ├── css/styles.css      # Design system + layout (color tokens at the top)
    ├── js/main.js          # Nav, active-section highlight, tabs, lightbox, resume detection
    └── img/                # Real screenshots (PNG + WebP), OG image, touch icon
```

## Run locally

```bash
npm run dev        # serves the site at http://localhost:3000
npm run verify     # checks every local asset, link and #anchor exists
```

No `npm install` is required. You can also open `index.html` through any static server.
Opening it directly from the file system breaks the root-relative paths, so use a server.

## Deploy to Vercel

**Option A: GitHub (recommended)**
1. Create a new GitHub repository and push the contents of this folder to it.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Leave the defaults. `vercel.json` already sets Framework = Other, Build = `npm run verify`, Output = `.`
4. Click **Deploy**.

**Option B: Vercel CLI**
```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

## Resume PDF

The resume lives at **`resume/Sahana-Madhavan-Resume.pdf`**. Every Resume button (in the navigation bar, the hero and the Resume section) downloads it directly.
To update it, replace that file with a new PDF of the same name and redeploy.

## After you have a domain

Social previews work best with absolute URLs. Once the site has its final address (for example `https://sahanamadhavan.vercel.app`):
- In `index.html`, change `og:image` and `twitter:image` to the full URL, e.g. `https://YOUR-DOMAIN/assets/img/og-image.png`.
- Optionally add `<link rel="canonical" href="https://YOUR-DOMAIN/">` and a `Sitemap:` line in `robots.txt`.

## Editing content

- **Text:** everything is in `index.html`, one clearly commented block per section.
- **Colors:** the color coding is set by CSS variables at the top of `assets/css/styles.css`:
  `--pm` (Product, indigo), `--ai` (AI, violet), `--an` (Analytics, teal), `--cs` (Customer Success, copper).
  Add `c-pm`, `c-ai`, `c-an` or `c-cs` to a card, or `tag--pm` and so on to a tag, to color it.
- **Images:** each screenshot ships as WebP (served first) plus a PNG fallback. If you replace an image, replace both files.

## Accuracy notes (keep these when you edit)

- **Product Pulse** uses a **synthetic** dataset of 6,000 users. The template retention difference is an **observational association, not a causal effect**. The mobile onboarding experiment is **proposed and has not been run**, and no test results are claimed.
- **My Board:** the screenshots show **demo accounts** with sample data, not real customers. AI meeting summarization is described as an **explored concept**, not a deployed feature, with no time-savings claims.

## Quality checklist (already done)

- Responsive at desktop (1440px), tablet (820px) and mobile (390px), with no horizontal scrolling
- Sticky navigation with active-section highlighting and an accessible mobile menu
- Screenshot viewer: tap any screenshot to open it full screen. Pinch, scroll or double-tap to zoom (up to 500%), drag to move around, swipe or use arrow keys to browse, and swipe down or press Esc to close
- Skip link, semantic landmarks, keyboard-operable tabs and lightbox, visible focus states, `prefers-reduced-motion` support
- WebP images with explicit width/height (no layout shift) and lazy loading below the fold
- Meta description, Open Graph/Twitter cards and `schema.org/Person` structured data
