# Developer handoff

The site is a static page plus one Node function. There is no framework and no production build. Content is JSON. The browser renders it. The function talks to Mailchimp only when environment variables are present.

## Section order

The page is one document. The order is fixed in `index.html` and covered by `tests/quality.test.js` and the browser test.

1. Header. The name and a compact section nav. It stays visible while scrolling so the long archive does not hide the rest of the page.
2. Tour dates. This is the action most visitors need. With no confirmed shows, the section says none are announced and links to the list. It does not show sample dates.
3. Podcast. Second, because it is the standing public work and was required to be prominent. Promotion is a short paragraph, text links, and the newest titles from the public RSS file.
4. Mailing list. The form is always on the page and posts to Mailchimp's embedded endpoint using the public ids in `data/site.json`. `api/subscribe.js` is an optional Node upgrade and is not required for the form.
5. About. Biography, then headshots. Photos exist only in this section.
6. Work. Discography, books, and screen credits, as a ruled list.
7. Press. Articles and interviews, then the source list.
8. Archive. Past dates transcribed from the previous page, plus links to the Internet Archive and the official past-gigs and journal pages. The official past-gigs page was opened on 12 November 2026 and was not retyped.
9. Footer. Contact and booking, store, and social links.

Smooth scrolling is on, and it is turned off for `prefers-reduced-motion`. A light border groups the podcast links and separates show rows. There is no hero, illustration, gradient, or icon set.

## Type

Body text and the name use IBM Plex Sans, weights 400 and 600. Labels, navigation, section headers, dates, and catalog details use IBM Plex Mono, weights 400 and 500. Section headers are letterspaced uppercase, written as `No. 01 — Tour dates`. Dates use tabular figures. The files in `fonts/` are Latin `woff2` subsets with `font-display: swap`. The license is the SIL Open Font License, copied in `fonts/OFL.txt`. The page does not request a font from another host. The regular sans and the medium mono are preloaded.

## Why there is no CMS

A free git-based editor was considered and not added. The content that changes is the JSON in `data/`. A browser editor such as Decap would still commit to the same repository, and it needs an OAuth application plus an auth endpoint that this hosting setup does not provide. That is more machinery than the content volume, and it is a second thing to transfer. Editing the JSON in the repository, with preview deployments, is the workflow. Revisit a CMS only if the team later refuses the file workflow. The question to ask them is in `docs/CLIENT-REQUEST.md`.

## Layout

```
doug-stanhope-concept/
  index.html              page shell, form, canonical URL
  style.css               all presentation
  404.html                not-found page
  favicon.svg             tab icon, so the browser does not 404
  vercel.json             headers and cache for /data
  robots.txt
  sitemap.xml             the front page only
  api/subscribe.js        HTTP handler
  api/mailchimp.js        validation, request building, response mapping
  data/shows.json         every show, past and future
  data/content.json       biography, catalogs, press, footer
  data/podcast.json       newest podcast episodes from the RSS feed
  data/sources.json       public sources for the added facts
  fonts/                  IBM Plex woff2 files and the OFL text
  js/shows.js             show rules, HTML, Event objects
  js/content.js           editorial HTML and Person data
  js/site.js              loads the JSON files
  js/mailing-list.js      shows the form only when configured
  js/archive-search.js    filters past dates
  assets/press/           approved headshots only
  */index.html            old paths, noindex, jump back to the front page
  tests/                  node:test files
  tests/browser/          Playwright
  docs/
```

`js/shows.js` and `js/content.js` also export for Node. The browser scripts are plain files in order: `shows.js`, `content.js`, `site.js`, `mailing-list.js`, `archive-search.js`.

Old paths (`/tour/`, `/podcast/`, `/press/`, `/about/`, `/recordings/`, `/books/`, `/journal/`, `/store/`) are short HTML files, not copies of the content. They exist so a static host without redirect rules still lands people on the single page. Do not put editorial copy back into them.

## Show schema

`data/shows.json` is the only show source. `js/shows.js` `prepare` normalizes a record. `validateShow` is what the tests run against the live file.

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | `^[a-z0-9-]{1,80}$`, unique |
| `name` | yes | public name |
| `date` | yes | `YYYY-MM-DD`, venue calendar date |
| `endDate` | no | must not be before `date` |
| `displayDate` | no | label for a range, such as `June 2–3` |
| `startTime` | no | `HH:MM`. Required, with `timezone`, before an Event is emitted |
| `endTime` | no | used only with `endDate` and `timezone` |
| `timezone` | with a time | IANA name. Offset is calculated, not stored |
| `venue`, `city`, `country` | for Event data | a record can be listed without them |
| `region`, `address`, `postalCode` | no | included in the visible line and in `PostalAddress` when present |
| `ticketUrl` | no | `http:` or `https:` only. Anything else is rejected and not rendered |
| `status` | yes | `scheduled`, `sold out`, `canceled`, `postponed`. `cancelled` is accepted and stored as `canceled` |
| `notes` | no | escaped text |

Upcoming versus past uses the zoned start instant when a time exists. A date-only show stays upcoming through 23:59:59 UTC on that calendar date. Future rows of every status stay in Tour dates. Past rows render in the archive, and a past `scheduled` row does not repeat the word Scheduled.

The 112 rows in the file were parsed from the previous page's archive. They have no start times, street addresses, or ticket URLs. Country codes were filled from the region already written in that list (`CA` to `US`, Australian abbreviations to `AU`, Canadian provinces to `CA`). `Perth, WA` is `AU`. Other `WA` rows stay `US`. `Norway` and `Sweden` were already written as the region and are stored as the country. Do not treat those rows as newly researched dates.

## Event data

`buildEventGraph` emits one `Event` per upcoming show that has a name, venue, city, country, valid start instant, and known status. Past shows are omitted so Google is not handed old dates as current events. Duplicate `@id` values are dropped.

Each event has `startDate` with a numeric offset, `eventStatus`, `OfflineEventAttendanceMode`, `Place` / `PostalAddress`, performer, `url`, and `@id`. `url` and `@id` are the canonical origin plus `/#show-{id}`. `offers.url` is set only for a safe ticket URL. `availability` is `InStock` for `scheduled` and `SoldOut` for `sold out`. Canceled and postponed events keep the offer URL when a ticket link is on the page, and they do not claim the tickets are in stock. The visible row contains the same name, time, place, address, status, note, and ticket URL.

The graph is one `script#event-jsonld`. It is removed when there is nothing to publish. A separate `script#profile-jsonld` is a `Person` built from `data/content.json`. There is no second, handwritten copy of either graph.

`validateEvent` in `js/shows.js` checks the shape. Tests use fixture shows. The live file currently produces no Event graph, because nothing in it is an upcoming complete show.

## Mailing list

`api/subscribe.js` is the only server code.

`GET /api/subscribe/` returns `{ "configured": false }` or `{ "configured": true, "provider": "mailchimp" }`. It never returns the key or the audience id.

`POST` validates email, region, and `consent === true`. A non-empty `website` field returns `{ "ok": true }` and does not call Mailchimp. A valid signup is `PUT https://{server}.api.mailchimp.com/3.0/lists/{audience}/members/{md5}` with `status_if_new` and `merge_fields`. The URL is built only from the validated server prefix and audience id. The user does not choose the host.

| Variable | Role |
| --- | --- |
| `MAILCHIMP_API_KEY` | Marketing API key. The suffix after `-` must match the server prefix |
| `MAILCHIMP_SERVER_PREFIX` | datacenter, such as `us7` |
| `MAILCHIMP_AUDIENCE_ID` | audience id |
| `MAILCHIMP_REGION_MERGE_FIELD` | merge tag, default `REGION` |
| `MAILCHIMP_STATUS_IF_NEW` | `pending` (default) or `subscribed` |

The public form identifiers, confirmed from the list's own hosted page, are server `us7`, user `99a44c5b158aed2fa397e1429`, audience `e2b49520e8`. That hosted page collects name, email, city, state, postal code, and country. It has no region field. The on-site region value will be rejected until a merge field with the configured tag exists.

`pending` is reported as "check your email". `subscribed` is reported as already on the list, which is also the result of updating an existing member. `unsubscribed`, `cleaned`, and `archived` return 409 and are not opted back in. A 400 that mentions a merge field returns a generic region-field error and does not echo the provider body.

No live call was made. The unit test that would ping Mailchimp skips when the three required variables are absent. Do not describe the form as connected until a real internal signup has been checked.

`vercel.json` sets `trailingSlash: true`, so the browser posts to `./api/subscribe/` with the slash. A slash-less POST can be redirected and lose the method.

## Content and headshots

`data/content.json` is escaped on the way into the page. `data/podcast.json` is the newest RSS sample. `node scripts/refresh-podcast.js` rewrites it from the public feed. There is no build step, so a refresh is a committed file, not a request on each page view. `data/sources.json` is the source list rendered at the end of Press. The page does not embed a player. Listening links and the recent episode list are the podcast section. To add one player, set `podcast.embed` in `data/content.json` to an object with `src` (an `https://omny.fm/...` address) and `title` (the accessible name). Any other host is ignored. The optional preview header already allows `frame-src https://omny.fm`. Do not add a second player. Headshot `src` must match `assets/press/{filename}` and must have alt text. External or path-traversal sources are dropped. `Person.image` is added only for a headshot that passes those rules.

`data/site.json` is the only place for the public origin and the public Mailchimp ids. `node scripts/apply-site-config.js` copies them into the page, sitemap, robots file, and old paths. `tests/quality.test.js` fails if those copies drift. The page script also reads `site.json` for Event and Person URLs.

## Commands

From `doug-stanhope-concept/`, on Node 22:

```bash
npm ci
npm test
npx playwright install --with-deps chromium
npm run test:browser
```

`npm test` is `node --test tests/*.test.js`. It does not need a browser. `npm run check` runs both. There is no compile step. Production dependencies: none. Dev dependencies: Playwright and axe-core, for tests only.

Local preview:

```bash
python3 -m http.server 8000
```

The signup function does not run under that server. On the host, the project root is this folder, the framework preset is Other, and the build command stays empty. Do not add a build command. Do not create a new project, and do not change the production domain from code.

The workflow `.github/workflows/doug-stanhope-checks.yml` runs the unit tests, installs Chromium, runs Playwright at desktop (1280×800) and mobile (390×844), and uploads screenshots.

## Headers and files

`vercel.json` sends `nosniff`, a referrer policy, `X-Frame-Options: DENY`, a locked-down permissions policy, HSTS, and a content security policy. Scripts, styles, and connections are limited to this origin. Frames are limited to `https://omny.fm`. `/data/*` is `must-revalidate` so a show edit is not stuck in the CDN.

`sitemap.xml` lists only the front page. The canonical host is `https://demostanhope.vercel.app/` until someone deliberately moves it. Do not point canonical or the sitemap at the custom domain while this host is the one actually serving the page.

## Tests worth knowing

- `tests/site.test.js` covers empty dates, offsets, ticket links, status, unsafe URLs, duplicate ids, and the live show file.
- `tests/content.test.js` covers podcast links, the Patreon URL, headshots, and escaping.
- `tests/subscribe.test.js` covers validation, the PUT body, the region merge field, duplicates, honeypot, a bad key suffix, and the skipped live ping.
- `tests/quality.test.js` covers canonicals, regions, old paths, secrets, and header presence.
- `tests/browser/site.spec.js` covers render, order, keyboard tab order, axe, overflow, the Mailchimp form action, and screenshots.

Latest local run before this handoff: 32 unit tests passed, 1 skipped (no Mailchimp credentials, no live request), 12 browser tests passed. Re-run them rather than trusting this paragraph after further edits.

## Known limitations

- No upcoming show can be marked complete, or verified in Google's rich results, until a real date is supplied with a time, timezone, venue, city, country, and preferably a street address and ticket URL.
- The mailing list form posts to Mailchimp from the browser. A live signup was not completed. The audience still needs a `REGION` text field or Mailchimp will reject the post. `api/subscribe.js` and `vercel.json` are optional. `vercel.json` only matters on a Vercel-style preview host.
- Headshots and a public booking contact were not available. The Herald essay is linked at its working article URL.
- All Things Comedy returned a bot challenge to a scripted fetch. The address is the one already used by the show's public listings. Apple, Spotify, Patreon, Omny, and the RSS feed were fetched directly. Patreon ` /dougstanhope` returns 404 and is not used.
- Recovered old-site pages, their capture dates, and the downloads that failed are listed in `docs/OLD-SITE.md`. The copy is not the whole historical site.
- There is no embedded player. The accessibility scan covers the page itself. An Omny player is added only if `podcast.embed.src` is an `https://omny.fm/` address.
- JavaScript is required for dates, biography, press, and the footer links, because those come from the JSON files. Headings, the mailing-list fallback, and a short `noscript` list do not.
- Country codes on the transcribed archive are a normalization of text that was already on the page, not a new research pass.
- Repository and hosting access have not been transferred. Editing docs do not make the team able to publish until that access exists.
- Store prices from the previous page were not carried over. Every row linked to the store homepage, so the list could not stay accurate. The footer links to the official store and to the eBay seller id `stinkchicken` taken from the official store page.
