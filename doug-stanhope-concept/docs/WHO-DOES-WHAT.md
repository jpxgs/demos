# Who does what

## No developer needed

- Add, edit, cancel, postpone, sell out, or remove a show in `data/shows.json`.
- Change a ticket link.
- Edit the biography, albums, books, screen credits, press links, and footer links in `data/content.json`.
- Add a source line in `data/sources.json`.
- Replace `data/podcast.json` with `node scripts/refresh-podcast.js`, or edit that file by hand.
- Add a headshot file and a `headshots` entry.
- Turn the form on or off with `signupEnabled`.
- Change `siteUrl` and run `node scripts/apply-site-config.js`, or follow the manual list.
- Upload the folder to the host you already use.

## A developer, or someone comfortable with DNS

- Point the domain without touching mail records, if nobody on the team has done DNS before.
- Decide whether to move nameservers. That can break email if mail records are not copied.
- Change the region choices. They have to match in `index.html` and, if you use it, `api/mailchimp.js`.
- Turn on `api/subscribe.js` and store the API key in the host's secret settings.
- Change layout, type, or the scripts.
- A publish that fails, or a page that loads with no style after the files are in the right place.
