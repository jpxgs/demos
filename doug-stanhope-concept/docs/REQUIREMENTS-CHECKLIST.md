# Requirements checklist

Status words mean what they say. A feature that is built but waiting on data is not marked complete.

Production was opened at `https://demostanhope.vercel.app/` after commit `58c888dab109ca8e102e51596ca659d0e1522539` was deployed. Chromium at 1280×800 and 390×844 showed the section order, the empty date state, the podcast links and recent episodes, the hidden signup form with the off notice, the work catalogs, and the warm paper background. Computed type was IBM Plex Sans and IBM Plex Mono. The header had no border. There were no console errors and no failed same-origin requests. Canonical was `https://demostanhope.vercel.app/`.

Local run before that deploy: 29 unit tests passed, 1 skipped because no mailing-list credentials were present, 8 browser tests passed on Chromium at 1280×800 and 390×844.

## From the manager

| # | Requirement | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- | --- |
| 1 | Ticket link on every show date | Yes. A safe `ticketUrl` is rendered. A missing or unsafe URL is labeled "No ticket link yet" and is not linked. | Yes, with fixture shows in `tests/site.test.js`. The live file has no ticket URLs. | No. There are no upcoming shows to open. | Confirmed future dates, each with a direct ticket URL. |
| 2 | Event data so each show can be listed | Yes. One Event graph per complete upcoming show, with offset, place, address, status, offer, and canonical URL. | Yes. `validateEvent` runs on fixtures. The live file correctly emits no events. | The live page has no Event graph. That matches the empty upcoming list. A real show has not been checked in Google. | The same show records as item 1, including start time, timezone, venue, city, and country. |
| 3 | Signup connected to the real mailing list | The page form posts to Mailchimp from the browser. No API key. The optional server function stays off without credentials. | Yes, against a mocked API. The live ping test skipped. The form's region rejection message is tested. | The optional live endpoint returns not configured, and a POST returns 503. No member was created. | A `REGION` text field on the audience. An internal signup has not been sent. |
| 4 | Region on signup | Yes. Required select, validated on the server, sent as a merge field. | Yes, including an unknown region and the mapped field name. | The form is hidden on the live page. The fallback link is shown. A region cannot be submitted yet. | The same credentials as item 3, plus a region merge field on the audience. The public hosted form does not have one. |
| 5 | The team can update dates and other content | Yes. `data/shows.json` and `data/content.json`, with guides. A CMS was evaluated and not added. | The live show file is schema-checked. Content rendering is tested. | Both data files are served by the live site. Publishing still requires repository access the team does not have yet. | Repository and hosting access. Written sign-off if a login editor was expected instead. |
| 6 | Podcast is prominent | Yes. It is the second section, with listening links and recent episodes. There is no embedded player. | Browser test checks the links, the Patreon URL, and a recent episode title. | Confirmed on the live page at desktop and phone width, with no console errors. All Things Comedy answered a bot challenge when fetched directly. | Nothing required to keep the current links. |
| 7 | Biography, headshots, and basic materials | Biography, press, recordings, and books are on the page. Headshots have a slot and no image. | Content tests cover the biography, press URLs, and the empty headshot state. | The biography and the empty headshot note are on the live page. No photo is published. | Approved headshot files, alt text, and credit. |

## From the client notes

| Requirement | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- |
| As simple as possible, plain and text-first | Yes. IBM Plex, warm paper, underlined links. Sections are separated by space. The header stays at the top of the page. | Browser screenshots at desktop and mobile. Axe on the page. | The live page was inspected at desktop and phone width after `58c888d`. Background `rgb(250, 248, 245)`, header border `0`. | None for the current direction. |
| Keep the old site available | Key pages from the pre-Squarespace site and the last month before the later Squarespace redesign are saved under `archive/`. Capture dates and failures are in `docs/OLD-SITE.md`. | The archive section links to `archive/index.html`. Each saved page has a banner and a Wayback link. | Pending the next preview deploy of this change. | Pages and media that the recovery log marks as failed or left out. |

## From the build brief

| Item | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- |
| A. One show file with the requested fields, including sold out, canceled, postponed, and missing tickets | Yes | Yes | The empty upcoming state and the past archive are on the live page. | Future rows |
| B. JSON-LD checked in tests with fixtures, not fake shows on the live page | Yes | Yes | Confirmed: the live page has Person data and no Event graph. | Real shows |
| C. Mailchimp, secrets only on the server, honest if unconfigured | Yes | Mocked. Not live. | Confirmed unconfigured on the live endpoint. | Credentials and a real signup |
| D. Podcast links checked, usable on a phone | Yes. Links and episode titles. No embedded player. | Yes | Confirmed on the live page at phone width. | All Things Comedy could not be fetched through the bot check |
| E. Biography from existing copy, headshot slot, press links that resolve | Yes. Stale homepage links were replaced or removed. The Herald essay is linked. | Yes | Biography and the empty headshot note are live. The Herald link is in the press list. | Headshots. |
| F. Data-file editing, CMS decision recorded | Yes. CMS not added, with the reason in the developer handoff. | Editing paths are the files the tests read | The data files are served live. | Access transfer, and sign-off on this workflow |
| Metadata, canonical, sitemap, robots, headers | Yes. Canonical is the host that actually serves the site. | `tests/quality.test.js` | Canonical and the security headers were on the live response. | Move the canonical only when the custom domain is connected |
| Do not create a new hosting project or change the domain | No project or domain settings were changed by this work | Not a test | The same project, demostanhope, served the commit. | None |

## Follow-up: type and public records

| Item | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- |
| Self-hosted label typography | IBM Plex Sans and IBM Plex Mono, Latin woff2, OFL, `font-display: swap`, only the four weights in use. Section headers are tracked uppercase. | Font files, license text, and computed font names are checked. | Confirmed on the preview host after `a8d4cce`. The four font files loaded and the computed faces were Plex Sans and Plex Mono. | None. |
| Public-source catalogs and recent episodes | Discography, books, screen credits, a longer biography, more press links, and eight RSS episodes. Each group has a source. Dead links found while checking were left out. | Content rendering and the podcast file shape. | Confirmed on the preview host after `a8d4cce`: Mailbag, 659 episodes, Discount Meat, Grand Central, The Road Dog, Worcester. | A full retype of the official past-gigs page. The recent years were compared and left as the existing selection. |
| Host-agnostic handoff | One zip of the site. It matches the preview. `signupMode` is `live` in both. `preview` and `off` are optional and unused. | Fresh unzip and `npm test`. The form is visible and posts to Mailchimp. | Pending the next preview deploy of this change. | A completed live signup, which needs the `REGION` field and was not sent. |

## Do not mark these done

- Ticket links on real dates
- Event rich results
- A working on-site signup
- Region stored on a real member
- Headshots
- The team publishing without new access
- Recovery of the old site into this repository
- A live provider test
