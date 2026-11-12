# Doug Stanhope — website source

A deliberately simple, text-first static website built with plain HTML, CSS, JSON and browser JavaScript. There is no framework, package manager, database or build step.

## Project map

```
doug-stanhope-concept/
├── index.html
├── style.css
├── data/
│   └── shows.json
├── js/
│   ├── archive-search.js
│   └── site.js
├── docs/
│   ├── OWNER-HANDOFF.md
│   └── CONTENT-EDITING-GUIDE.md
└── README.md
```

## File responsibilities

- `index.html` — page structure and editorial content that changes infrequently.
- `style.css` — typography, spacing, color, responsive behavior and focus states.
- `data/shows.json` — source of truth for confirmed upcoming shows.
- `js/archive-search.js` — filters the historical tour archive by year, city, venue or text.
- `js/site.js` — renders upcoming dates and creates Schema.org Event JSON-LD from complete event records.
- `docs/OWNER-HANDOFF.md` — ownership, accounts and scope overview.
- `docs/CONTENT-EDITING-GUIDE.md` — step-by-step editing instructions.

The empty `shows.json` array is intentional until confirmed future dates, ticket URLs and venue details are supplied. No placeholder dates are published.

## Add a show

See [the content editing guide](docs/CONTENT-EDITING-GUIDE.md). Add a confirmed event to `data/shows.json` with an ISO 8601 local date/time, venue, full postal address and exact ticket URL. The display and structured event data use the same record.

## Automated checks

Run the dependency-free JavaScript checks with Node.js 18 or newer:

```bash
node --test tests/site.test.js
```

The tests cover the empty show list, valid future events, unsafe ticket URLs, malformed data, venue-local date display, timezone validation, and generated Event structured data. See [the compatibility and test checklist](docs/COMPATIBILITY-AND-TESTING.md) for the manual browser/device matrix. Automated tests do not replace a final visual check on physical devices.

## Compatibility

The site uses standard HTML, CSS and browser JavaScript without a framework or third-party runtime dependency. It is intended for current evergreen browsers on Windows, macOS, iOS, iPadOS, Android and ChromeOS. See the compatibility checklist for the supported browser families and manual checks.

## Local preview

For a reliable preview with JSON fetch behavior, run a local static server from this folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

The site can be hosted by any static host. For Vercel, import the repository and set the Root Directory to `doug-stanhope-concept`. Framework preset: Other. Leave build command and output directory blank. If the project is connected to GitHub, commits to its configured production branch may trigger deployment automatically.

Do not connect or change the canonical custom domain until the team approves the site and hosting arrangement.

## Integrations awaiting team input

- Mailing-list provider, signup form/endpoint and exact region-field specification.
- Approved biography copy and official headshots.
- Confirmed future show dates, individual ticket URLs and full venue addresses.
- Exact article URLs for press links.

Never commit passwords, private API keys or secret tokens. The mailing-list integration should use a provider-approved public embed or a secure server-side function if a secret is required.

## Content limitations

The tour history is a partial transcription, not a complete archive. Some catalog and journal entries are also partial. These gaps are marked on the page and should be checked against the original site or a verified Wayback Machine capture before anyone describes the archive as complete.

## Handoff model

The source files are intended for delivery to the team for independent editing and deployment. Routine content changes are self-managed. Hosting, domain, mailing-list and other service accounts should be owned and administered by the team.
