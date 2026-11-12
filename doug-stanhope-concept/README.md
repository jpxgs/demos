# Doug Stanhope site

Read `START-HERE.md` first. That file is the handoff. The preview host is optional. The files work on any static host.

A single text-first page. Shows and editorial copy live in JSON. One server function talks to Mailchimp when it is configured. There is no framework, no database, and no production build.

## Map

```
index.html                 shell, form, canonical URL
style.css
data/shows.json            shows, including the transcribed past dates
data/content.json          biography, catalogs, press, footer
data/podcast.json          newest podcast episodes from the public RSS feed
data/sources.json          where each public fact came from
fonts/                     IBM Plex, SIL Open Font License
api/subscribe.js           mailing-list endpoint
api/mailchimp.js
js/shows.js                dates, tickets, Event data
js/content.js              editorial rendering
js/site.js                 loads the data files
js/mailing-list.js
js/archive-search.js
assets/press/              approved headshots only
docs/OWNER-HANDOFF.md
docs/CONTENT-EDITING-GUIDE.md
docs/DEVELOPER-HANDOFF.md
docs/REQUIREMENTS-CHECKLIST.md
docs/CLIENT-REQUEST.md
```

`data/shows.json` has past dates only. Upcoming dates are empty on purpose. Do not add a show that was not confirmed.

## Checks

```bash
npm ci
npm test
npx playwright install --with-deps chromium
npm run test:browser
```

## Local preview

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`. This preview does not run `api/subscribe.js`, so the mailing-list form stays on its fallback link.

## Hosting

The existing project already deploys this folder from the main branch. Leave the build command empty. Do not create another project, and do not connect the custom domain until the site owner approves it.

Mailing-list variables, the show schema, and rollback are documented in [docs/CONTENT-EDITING-GUIDE.md](docs/CONTENT-EDITING-GUIDE.md) and [docs/DEVELOPER-HANDOFF.md](docs/DEVELOPER-HANDOFF.md).

Never commit an API key.
