# FAQ

## The form says the region field was rejected

The audience does not have a text field tagged `REGION`, or the tag is spelled differently. Follow `docs/MAILING-LIST.md`. The words sent by the page must match the field.

## The form says the address is already subscribed

That person is already on the list. That is a success, not a second signup.

## The form says it is turned off

`signupMode` in `data/site.json` is `off`, or the form tag in `index.html` still has `hidden`. The preview uses `live`. Set `signupMode` to `live` and run `node scripts/apply-site-config.js`.

## A date I added does not show under Tour dates

- The `date` is in the past. Past dates go to the archive.
- The JSON is invalid. A missing comma or an extra comma at the end of the list stops the whole file.
- `status` is not one of `scheduled`, `sold out`, `canceled`, `postponed`.
- `startTime` is filled in and `timezone` is empty or is not an IANA name such as `America/Chicago`.
- The new file was not uploaded, or the browser is showing a cached copy. Reload with the cache bypassed.

## The page has no style

`style.css` or the `fonts/` folder did not upload, or the site is in a subfolder. Publish `index.html` at the root of the domain and upload `style.css` and `fonts/` next to it.

## I changed the address and search engines still show the old one

`siteUrl` was edited but `node scripts/apply-site-config.js` was not run, so `index.html`, `sitemap.xml`, and `robots.txt` still have the old address. Run the script, or follow the manual list in `docs/GOING-LIVE.md`, then publish those files.

## Email stopped working after the domain move

A mail record was changed. Put the MX records back, and restore TXT records that mention the mail provider. Website records and mail records are separate. See `docs/GOING-LIVE.md`.

## The old page is still what I see

The host or the browser is caching. Reload without cache. On a host with a cache button, clear it. DNS changes can also take hours. Check that the domain's web records point at the new host.

## Google does not list a show

The show needs a future date, a start time, a timezone, a venue, a city, and a country. Then run the Rich Results Test linked from `docs/SHOWS.md`. Google still chooses what to show.
