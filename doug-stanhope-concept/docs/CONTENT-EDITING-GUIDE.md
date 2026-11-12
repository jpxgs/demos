# Content editing guide

Edits are made in data files, then published through the source repository. There is no login screen for content.

Paths below start at the site folder, the folder that contains `index.html`. In the downloadable package that folder is the unzipped archive. In the preview repository it is `doug-stanhope-concept/`.

## Quick reference

| Task | Where |
| --- | --- |
| Add, change, or cancel a show | `data/shows.json` |
| Change a ticket link | `data/shows.json`, field `ticketUrl` |
| Biography | `data/content.json`, field `bio` |
| Albums, books, and screen credits | `data/content.json`, fields `discography`, `books`, and `appearances` |
| Source list | `data/sources.json` |
| Recent podcast episodes | `data/podcast.json`, refreshed with the command below |
| Headshots | an image in `assets/press/`, plus an entry in `data/content.json` `headshots` |
| Podcast links, player, episode notes | `data/content.json`, field `podcast` |
| Press links | `data/content.json`, field `press` |
| Social, store, and contact links | `data/content.json`, fields `social` and `contact` |
| Public address and whether the form is on | `data/site.json`, then `node scripts/apply-site-config.js` |
| Layout or behavior | a developer. Do not edit `style.css` or the scripts for a content change |

Keep JSON valid. Use straight quotes. Put a comma between items, and do not put a comma after the last item.

## Add a show

Open `data/shows.json`. It is a list. Add one object per performance. This example is not a real show. Replace every value.

```json
{
  "id": "2099-03-18-example-theatre",
  "name": "Doug Stanhope",
  "date": "2099-03-18",
  "endDate": "",
  "displayDate": "",
  "startTime": "20:00",
  "endTime": "",
  "timezone": "America/Los_Angeles",
  "venue": "Example Theatre",
  "city": "Example City",
  "region": "CA",
  "country": "US",
  "address": "123 Main Street",
  "postalCode": "90000",
  "ticketUrl": "https://tickets.example.com/this-show",
  "status": "scheduled",
  "notes": ""
}
```

Rules:

- `id` is a short slug: lowercase letters, numbers, and hyphens. It must be unique. A safe pattern is the date plus the city, such as `2099-03-18-example-city`.
- `date` is the venue's calendar date, `YYYY-MM-DD`.
- `startTime` is 24-hour local time, `HH:MM`. If the start time is unknown, leave `startTime` and `timezone` empty. The show can still be listed. It will not be sent to Google as an event until the time and timezone exist.
- `timezone` is an IANA name, such as `America/New_York` or `Europe/London`. Do not write `PST` or `GMT-8` here. The page calculates the offset, including daylight saving.
- `endDate` and `endTime` are optional. Leave them as empty strings for a single performance with no known end.
- `displayDate` is optional. Use it only for a range that should read the way it was announced, such as `June 2–3`. Otherwise leave it empty and the page formats `date`.
- `ticketUrl` must be the direct ticket page for that performance, starting with `https://`. Do not link a venue homepage. If there is no ticket link yet, use `""`. The page then says "No ticket link yet" instead of inventing one.
- `address` is the street address. `region` is the state, province, or region. `country` is a country code such as `US`, or a country name when that is what you have.
- `status` is one of `scheduled`, `sold out`, `canceled`, or `postponed`.
- `notes` is short public text. Leave it empty when there is nothing to add.

The page lists future dates first, soonest at the top. Past dates move into the archive on their own. Do not add a show that is not confirmed.

## Change a ticket link

In that show's object, replace `ticketUrl`. Publish. The link on the page and the event data use the same value.

## Cancel or postpone a show

Do not delete a show that was already announced unless it should disappear entirely.

- Canceled: set `"status": "canceled"`. The date stays visible with the word Canceled. The ticket link stays visible when `ticketUrl` is set, and the event data is marked canceled.
- Postponed: set `"status": "postponed"`. Update `date`, `startTime`, and `ticketUrl` when the new details exist.
- Sold out: set `"status": "sold out"`. Keep the ticket link if the box office still has a page.

A show whose date is in the past leaves the tour-dates section and appears in the archive. Past archive rows do not offer tickets.

## Remove a show

Delete that whole object from the list in `data/shows.json`, including the comma that separated it from the next object. Do not leave a comma after the last object. Use this when the date should disappear. Use `canceled` or `postponed` when people should still see what happened to it.

## What Google needs

Google can list a show only when the page includes event data. This site adds that data for a future show that has all of these:

- `name`
- `date`, `startTime`, and `timezone`
- `venue`, `city`, and `country`
- `status` of `scheduled`, `sold out`, `canceled`, or `postponed`

`address` and `postalCode` should be filled when you have them. `ticketUrl` should be the direct ticket page when one exists. A show with no start time is listed on the page and is not sent to Google.

After the show is on the public site, open [Google's Rich Results Test](https://search.google.com/test/rich-results), paste the public page address, and run the test. Look for an Event. The preview copy has no future shows, so that test will not find an Event until a real one is published.

More detail is in `docs/SHOWS.md`.

## Biography

In `data/content.json`, `bio` is a list of paragraphs. Edit the sentences. Do not add a fact that has not been checked. The page does not interpret HTML in these paragraphs.

## Headshots

1. Put the approved file in `assets/press/`. Use a plain filename such as `press-01.jpg`. JPEG or WebP is appropriate. Do not add a stock photo or an unapproved image.
2. Add an object to `headshots` in `data/content.json`:

```json
{
  "src": "assets/press/press-01.jpg",
  "alt": "Doug Stanhope, head and shoulders, facing the camera",
  "credit": "Photo: photographer name",
  "width": 1200,
  "height": 1600
}
```

`alt` is required. It should say who is in the photo and, briefly, how they are framed. `credit` is the line under the photo, such as `Photo: studio name`. `width` and `height` are the pixel size of the file.

Use JPEG or WebP. A long edge of about 1600 to 2400 pixels is enough. The page shows the picture at most 240 pixels wide, so a multi-megabyte original is wasted. Aim for under about 500 KB. sRGB is the safe color space. Do not add a stock photo or an unapproved file. Until `headshots` has a valid entry, the page says that approved headshots have not been added.

## Podcast

In `data/content.json`, under `podcast`:

- `summary` is the short paragraph.
- `links` is the list of listening destinations. Each item has `label` and `href`. Use the full `https://` address.
- `embed` is optional. Leave it out. The page does not show a player unless this object is present. To add one, set `src` to an `https://omny.fm/...` address and `title` to the accessible name of that player. Any other host is ignored.
- `episodes` is the short list of recent episodes. `url` is optional. `text` is the note.
- `notes` is the sentence that says the list is partial.

Do not add a second player. The listening links are the main promotion.

Recent episode titles come from the public RSS feed, not from this section. From this folder, run:

```bash
node scripts/refresh-podcast.js
```

That rewrites `data/podcast.json`. Read the new titles, then publish the file. The site does not fetch the feed on each visit.

Without Node, open `data/podcast.json` and edit the `episodes` list by hand. Each item needs `title`, `date` as `YYYY-MM-DD`, and `url` starting with `https://`. Set `retrieved` to today's date and `episodeCount` to the number the feed shows, if you know it. Copy one existing object and change the three fields. Keep the commas valid.

## Press and other links

`press` is a list of groups. Each group has `heading` and `links`. Link an article to its own address, not to the publication's homepage. To add a link, copy one object inside the right group and change `label` and `href`.

When you add a fact from a public page, add a line to `data/sources.json`:

```json
{
  "id": "short-name",
  "title": "Publication — article title",
  "href": "https://example.com/the-article",
  "retrieved": "2026-11-12",
  "note": "What this source supports."
}
```

Open the address before you save it. If it does not load, do not list it. The press section of the page prints this list under Sources.

`discography`, `books`, and `appearances` are lists of `{ "title", "detail" }`. `social` and `contact.links` use `{ "label", "href" }`.

`contact.text` is the footer sentence. It currently says contact and booking details have not been supplied. Replace that sentence when a public contact or booking address is approved, and add the address as a link. Do not publish a private inbox.

The public address lives in `data/site.json` as `siteUrl`, with `https://` and no final slash. After changing it, run `node scripts/apply-site-config.js`. That updates the page, the sitemap, `robots.txt`, and the short old-path pages. Do not edit those by hand.

## How signups work

The form is on the page for every visitor. It posts email and region to Mailchimp's own form address. No server is required. The address is built from `data/site.json` under `mailchimp` (`server`, `userId`, `audienceId`, `regionField`). After changing those, run `node scripts/apply-site-config.js`.

The region choices are North America, UK and Ireland, Europe, Australia and New Zealand, Asia, and Other. The select is named `REGION`. A checkbox records consent and is not sent as a list field. An extra hidden field is left empty so automated signups are dropped.

The audience must contain a text field tagged `REGION`. If it does not, Mailchimp rejects the signup. The page says so. This build has not completed a live signup, because that would add a person to the list.

`api/subscribe.js` is an optional later upgrade for a host that runs Node functions. It uses the empty names in `.env.example`. The public form does not need it.

## Preview and publish

Upload the changed files to whatever host is serving the site, or publish the folder the way `START-HERE.md` describes. Then open the public address and check the change. A future show appears under Tour dates. A past date appears under Archive.

On a computer, the local check is:

Local preview, for someone with the files on a computer:

```bash
cd doug-stanhope-concept
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`. The signup form stays on its fallback link in this preview, because the local server does not run the signup function. Dates and text still load.

## Roll back

Use either method:

- In the hosting project, open the previous production deployment that was serving the right version and use Instant Rollback. Do not delete deployments.
- Or revert the commit on main and push that revert. The next production deployment will match the reverted files.

Rolling back files does not remove a person who already joined the mailing list.

## What needs a developer

- Creating or rotating the mailing-list environment variables, if the editor does not have the hosting project.
- Connecting or changing the custom domain.
- Adding a region choice, changing validation, or changing the event data rules.
- Layout, navigation, and the scripts.
- A production deployment that fails.
