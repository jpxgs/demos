# FIELDNOTES — Signal Library

A lightweight, editorial research library for enduring engineering talks, operational security (OPSEC) research, and deep-value investing sources.

<p>
  <a href="https://signal-video.vercel.app"><strong>Live experience ↗</strong></a> ·
  <a href="https://millzbot.vercel.app/about/">Portfolio ↗</a> ·
  <a href="https://github.com/jpxgs/demos/tree/main/fieldnotes">Source ↗</a>
</p>

## Product thesis

Fieldnotes is designed as an antidote to algorithmic feeds: a small, legible index of material that rewards sustained attention. The interface combines the familiarity of a video library with the restraint of an editorial research tool.

### Product principles

- **Curated, not infinite.** Records have an identifiable subject, creator, and primary-source destination.
- **Source-first.** External links point to original publishers, archives, regulators, and researchers.
- **Low-friction.** Search, discipline filters, saved records, and a focused video player.
- **Quiet by design.** Restrained typography, technical metadata, responsive cards, and no autoplay feed.
- **Accessible by default.** Semantic landmarks, labelled controls, keyboard search shortcut, visible focus, and reduced-motion support.

## Disciplines

| Discipline | Scope |
| --- | --- |
| Talks | Engineering, software design, computing history, and AI |
| OPSEC | Security research, privacy, OSINT, conference archives, and vulnerability intelligence |
| Deep Value | Shareholder letters, investment memos, filings, valuation education, and macro data |

## Architecture

```text
fieldnotes/
├── index.html             # Semantic application shell
├── styles.css             # Responsive design system and component styles
├── src/
│   ├── main.js            # UI state, rendering, search, saving, and playback
│   └── records.js         # Curated content catalogue
├── package.json           # Scripts and development dependency
├── vite.config.js         # Static production build configuration
└── README.md              # Product and engineering documentation
```

The application is framework-free and data-driven. Content is separated from rendering logic, state is kept intentionally small, and the production bundle is static. This keeps the runtime light and makes new sources straightforward to review.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Build, preview, and test:

```bash
npm run build
npm run preview
npm test
```

The production output is written to `dist/` and can be deployed to any static host, including Vercel.

## Engineering decisions

- **No framework by default:** the interaction model is simple enough that a framework would add more runtime and maintenance than value.
- **Versioned local persistence:** saved records use a namespaced local-storage key and defensive parsing.
- **Progressive external integration:** source destinations remain first-class links; credentials and identifying API requests belong on a server, never in browser code.
- **Privacy-conscious playback:** YouTube's privacy-enhanced embed host is used for videos.
- **Accessible interactions:** search is keyboard-focusable with `/`, filters expose pressed state, and video playback is isolated in a native dialog.

## Data and integration notes

- The catalogue is a curated snapshot, not a live Hacker News recommendation scraper or an automatically synchronized RSS reader.
- The selection reflects talks repeatedly circulated in developer communities; individual Hacker News score histories are not currently stored in the catalogue.
- Some talks are linked through a YouTube search rather than a fixed video ID when a canonical upload could not be confidently verified.
- The player requests a 50% volume level where the browser and YouTube embed API permit programmatic control. Browser autoplay and volume policies may override it.
- Saved records are local to the browser and are not synced across devices.
- Official APIs and feeds are linked directly. Authenticated or identifying server-side integrations should be implemented behind server-side adapters.

## Quality status

- [x] Responsive layout and mobile breakpoints
- [x] Search across title, creator, year, venue, and description
- [x] Discipline filters and saved-record filter
- [x] Persistent saved state with guarded storage access
- [x] Video dialog teardown on close
- [x] External links use `noopener noreferrer`
- [x] Semantic controls and keyboard access
- [x] Reduced-motion preference support
- [x] Content separated from presentation and interaction logic
- [ ] Automated browser tests and Lighthouse audit
- [ ] Live RSS/API ingestion with server-side source adapters

## Provenance

The original FIELDNOTES concept began as a curated selection of talks associated with recurring Hacker News recommendations, expanded with OPSEC and deep-value research sources. The project preserves the distinction between a hand-curated library and an algorithmic feed.
