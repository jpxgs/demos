# Requirements checklist

Status words mean what they say. A feature that is built but waiting on data is not marked complete. "Verified in production" means the public site was checked after this change was deployed. Until that deploy is confirmed, the production column says what is still outstanding.

Checked locally before the production deploy: 29 unit tests passed, 1 skipped because no mailing-list credentials were present, 8 browser tests passed on Chromium at 1280×800 and 390×844.

## From the manager

| # | Requirement | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- | --- |
| 1 | Ticket link on every show date | Yes. A safe `ticketUrl` is rendered. A missing or unsafe URL is labeled "No ticket link yet" and is not linked. | Yes, with fixture shows in `tests/site.test.js`. The live file has no ticket URLs. | No. There are no upcoming shows to open. | Confirmed future dates, each with a direct ticket URL. |
| 2 | Event data so each show can be listed | Yes. One Event graph per complete upcoming show, with offset, place, address, status, offer, and canonical URL. | Yes. `validateEvent` runs on fixtures. The live file correctly emits no events. | No. The public page has no Event graph until a complete show exists. | The same show records as item 1, including start time, timezone, venue, city, and country. |
| 3 | Signup connected to the real mailing list | The server function is a Mailchimp member upsert. It stays off without credentials. | Yes, against a mocked API. The live ping test skipped. | No. The public function returns not configured. | API key, server prefix, audience id. An internal signup has not been sent. |
| 4 | Region on signup | Yes. Required select, validated on the server, sent as a merge field. | Yes, including an unknown region and the mapped field name. | No. The form is hidden, so visitors cannot submit a region. | The same credentials as item 3, plus a region merge field on the audience. The public hosted form does not have one. |
| 5 | The team can update dates and other content | Yes. `data/shows.json` and `data/content.json`, with guides. A CMS was evaluated and not added. | The live show file is schema-checked. Content rendering is tested. | The files ship with the site. Publishing still requires repository access the team does not have yet. | Repository and hosting access. Written sign-off if a login editor was expected instead. |
| 6 | Podcast is prominent | Yes. It is the second section, with text links and one player. | Browser test checks the links, the Patreon URL, and that the player fits the viewport. | Pending the production deploy. Link targets were checked before the deploy, except All Things Comedy, which answered a bot challenge. | Nothing required to keep the current links. A newer episode list would need supplied notes. |
| 7 | Biography, headshots, and basic materials | Biography, press, recordings, and books are on the page. Headshots have a slot and no image. | Content tests cover the biography, press URLs, and the empty headshot state. | Pending the production deploy for the text. No photo can be verified. | Approved headshot files, alt text, and credit. |

## From the client notes

| Requirement | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- |
| As simple as possible, plain and text-first | Yes. One serif, black on white, underlined links. Borders and a sticky header are only there to group and navigate. | Browser screenshots at desktop and mobile. Axe on the page, excluding the third-party player. | Pending the production deploy. | None for the current direction. Later design notes were never sent. |
| Keep the old site available | The archive links to the Internet Archive calendar and the official past-gigs page. The old pages were not copied. | The archive links render. | Pending the production deploy. | A reviewed copy of the old pages. A download of a capture was rate-limited and was not saved. |

## From the build brief

| Item | Implemented | Tested | Verified in production | Blocked |
| --- | --- | --- | --- | --- |
| A. One show file with the requested fields, including sold out, canceled, postponed, and missing tickets | Yes | Yes | The empty upcoming state and the past archive ship in `data/shows.json` | Future rows |
| B. JSON-LD checked in tests with fixtures, not fake shows on the live page | Yes | Yes | No Event markup on the live page, which is correct while the file has no complete upcoming show | Real shows |
| C. Mailchimp, secrets only on the server, honest if unconfigured | Yes | Mocked. Not live. | Public endpoint is unconfigured | Credentials and a real signup |
| D. Podcast links checked, player usable on a phone | Yes | Yes | Pending deploy | All Things Comedy could not be fetched through the bot check |
| E. Biography from existing copy, headshot slot, press links that resolve | Yes. Stale homepage links were replaced or removed. | Yes | Pending deploy | Headshots. Herald Scotland essay URL. |
| F. Data-file editing, CMS decision recorded | Yes. CMS not added, with the reason in the developer handoff. | Editing paths are the files the tests read | Pending deploy | Access transfer, and sign-off on this workflow |
| Metadata, canonical, sitemap, robots, headers | Yes. Canonical is the host that actually serves the site. | `tests/quality.test.js` | Pending deploy | Move the canonical only when the custom domain is connected |
| Do not create a new hosting project or change the domain | No project or domain settings were changed by this work | Not a test | Confirm the same project served the new commit | None |

## Do not mark these done

- Ticket links on real dates
- Event rich results
- A working on-site signup
- Region stored on a real member
- Headshots
- The team publishing without new access
- Recovery of the old site into this repository
- A live provider test
