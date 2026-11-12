# Content editing guide

Edits are made in data files, then published through the source repository. There is no login screen for content.

The site folder is `doug-stanhope-concept/`. Paths below are inside that folder unless they start with `doug-stanhope-concept/`.

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
| Press, recordings, books | `data/content.json`, fields `press`, `recordings`, `books` |
| Social, store, and contact links | `data/content.json`, fields `social` and `contact` |
| Public mailing-list link used before the form is connected | `data/content.json` field `listUrl`, and the same address in `index.html` |
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

`alt` is required. `credit` is the line under the photo. `width` and `height` are the pixel size of the file. Until this list has a valid entry, the page says that approved headshots have not been added.

## Podcast

In `data/content.json`, under `podcast`:

- `summary` is the short paragraph.
- `links` is the list of listening destinations. Each item has `label` and `href`. Use the full `https://` address.
- `embed` is the one player. `src` must be an `https://omny.fm/...` address. `title` is the accessible name of the player.
- `episodes` is the short list under the player. `url` is optional. `text` is the note.
- `notes` is the sentence that says the list is partial.

Do not add a second player. The listening links are the main promotion.

Recent episode titles come from the public RSS feed, not from this section. From this folder, run:

```bash
node scripts/refresh-podcast.js
```

That rewrites `data/podcast.json`. Read the new titles, then commit the file. The site does not fetch the feed on each visit.

## Press and other links

`press` is a list of groups. Each group has `heading` and `links`. Link an article to its own address, not to the publication's homepage.

`recordings` and `books` are lists of `{ "title", "detail" }`. `social` and `contact.links` use `{ "label", "href" }`.

`contact.text` is the footer sentence. It currently says contact and booking details have not been supplied. Replace that sentence when a public contact or booking address is approved, and add the address as a link. Do not publish a private inbox.

`siteUrl` is the public site address without a trailing slash. Leave it as `https://demostanhope.vercel.app` until the custom domain is intentionally connected. When it changes, a developer also updates the canonical link in `index.html`, `sitemap.xml`, and `robots.txt`.

## How signups work

The mailing-list section always explains what the list is.

- Before the connection is turned on, visitors see a link to the existing public signup page. That page does not ask for a region. The address is `listUrl` in `data/content.json`. The same address is written in `index.html` so it still works if the script does not run. Change both if the public page moves.
- After the connection is turned on, that link is hidden and the form is shown. The form asks for an email address, a region, and consent. A hidden extra field is there to catch automated submissions. Region choices are North America, UK and Ireland, Europe, Australia and New Zealand, Asia, and Other. Changing those choices requires a developer, because the page and the server must match.

The form does not appear just because `listUrl` is filled in. It appears only when the server reports that the mailing-list account is configured.

## Configure the mailing list

This needs the mailing-list account and the hosting project. Do not put the API key in a file.

The public signup page already identifies the list: server prefix `us7`, audience id `e2b49520e8`. Confirm in the mailing-list account that this is the audience you want before using it.

1. In that audience, add a merge field for region if it does not already exist. Text is the simplest type. Set the field tag to `REGION`. The form will send one of the six region names above.
2. Create an API key in the mailing-list account. The key ends in `-us7`. That suffix must match the server prefix.
3. In the hosting project, add these environment variables for Production and Preview:

| Name | Value |
| --- | --- |
| `MAILCHIMP_API_KEY` | the key from the account |
| `MAILCHIMP_SERVER_PREFIX` | `us7` |
| `MAILCHIMP_AUDIENCE_ID` | `e2b49520e8` |
| `MAILCHIMP_REGION_MERGE_FIELD` | `REGION`, unless the field tag is different |
| `MAILCHIMP_STATUS_IF_NEW` | `pending` |

`pending` means a new person must confirm by email before they are subscribed. Set `subscribed` only if the account owner explicitly wants people added immediately.

4. Redeploy the site, or push a commit, so the new variables are picked up.
5. Open the site. The form should be visible and the fallback link hidden.
6. Submit an internal address and confirm the region arrives on that member. An address that is already subscribed is updated, not duplicated. An address that was removed is not added again.

If the key's suffix and `MAILCHIMP_SERVER_PREFIX` disagree, the form stays hidden. If the region field tag does not exist, the signup fails with a message about the region field.

The connection was not tried against the live account in this build, because no API key was available.

## Preview

1. Edit the data file.
2. Commit the change on a branch, not directly on main, when you want to look first.
3. Open the preview deployment the hosting project creates for that branch.
4. Check the date, the ticket link, and the page on a phone-width window.
5. Merge the branch into main when it is right.

The main branch updates the public site. Do not create a second hosting project.

## Publish

Merging into main publishes. After it finishes, open `https://demostanhope.vercel.app/` and confirm the change. A show added for a future date should appear under Tour dates. A past date should appear under Archive.

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
