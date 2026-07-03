# Personal Academic Website

This repository contains a minimal bilingual static academic website.

## Structure

- `index.html` - English homepage
- `zh/index.html` - Chinese homepage
- `assets/css/styles.css` - shared styles
- `assets/js/main.js` - small progressive-enhancement script
- `404.html` - bilingual 404 page
- `robots.txt`, `sitemap.xml`, `site.webmanifest` - basic site metadata
- `CONTENT_TODO.md` - placeholders to replace before final publication

## Local Preview

Run a static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

- English: `http://localhost:8000/`
- Chinese: `http://localhost:8000/zh/`

## Updating Content

Search for `TODO_` placeholders and replace them with verified information only. Do not invent affiliations, publications, awards, dates, or contact details.

When a custom domain is selected, update:

- `shenk.dev` in HTML metadata
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`
- `CNAME` with the root domain only

## Publishing

The site is intended for GitHub Pages from the `main` branch and repository root. No build process, database, CMS, analytics, cookies, or external JavaScript dependencies are required.

Deployment trigger: 2026-07-03.
