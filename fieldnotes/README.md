# FIELDNOTES

A quiet, curated library for engineering talks, operational security research, and deep-value investing.

[Live site](https://signal-video.vercel.app) · [Portfolio](https://millzbot.vercel.app/about/) · [Source](https://github.com/jpxgs/demos/tree/main/fieldnotes)

## What it is

An alternative to algorithmic feeds: a finite, source-led index of material worth returning to. Browse by discipline, search the catalogue, save references locally, and open talks in a focused player.

**Three collections**
- **Talks** — software design, computing history, and AI.
- **OPSEC** — security research, privacy, OSINT, and vulnerability intelligence.
- **Deep Value** — shareholder letters, investment memos, filings, and valuation research.

## Design and implementation

The interface pairs an editorial visual language with a lightweight, framework-free runtime. Content, presentation, and interaction logic are separated so the catalogue can be reviewed and maintained without touching the UI.

```text
fieldnotes/
├── index.html
├── styles.css
├── src/
│   ├── main.js
│   └── records.js
├── package.json
├── vite.config.js
└── README.md
```

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

```bash
npm test       # catalogue integrity checks
npm run build  # tests, then production build
npm run preview
```

The static production build is written to `dist/`.

## Product details

- Search, discipline filters, and a saved-items view.
- Versioned local storage; saved items remain in this browser.
- Responsive layout, semantic controls, keyboard search shortcut, and reduced-motion support.
- YouTube privacy-enhanced embeds. The player requests 50% volume; browser and embed policies may override programmatic volume.
- No autoplay, infinite scroll, or account requirement.

## Editorial scope and limitations

The catalogue is hand-curated, not a live Hacker News scraper or synchronized RSS reader. It reflects talks repeatedly circulated in developer communities, but does not store historical HN scores or recommendation counts. Where a canonical video upload could not be verified confidently, the entry links to a YouTube search instead.

External destinations point to original publishers and primary sources where practical. Live ingestion is intentionally not implied: authenticated or identifying integrations require server-side adapters and are not part of this static build.

## Quality

The production build runs Node-based catalogue checks for stable unique IDs, supported disciplines, valid HTTPS destinations, and catalogue coverage before Vite compiles the site. Automated browser coverage and a Lighthouse audit remain future work.

---

FIELDNOTES is a curated research instrument, not a claim of exhaustive coverage.
