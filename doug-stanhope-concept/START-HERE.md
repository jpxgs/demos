# Start here

This folder is the whole site. Unzip it anywhere. It does not belong to a particular host, and it does not need the account that built the preview.

The preview people are looking at now may hide the mailing-list form. The downloadable package is built with the form turned on. Check `signupEnabled` in `data/site.json` on the copy you have. `false` hides the form. `true` shows it. Details are in [docs/MAILING-LIST.md](docs/MAILING-LIST.md).

## Read these in order

| What you need | Where |
| --- | --- |
| What each file is | [docs/PACKAGE-MAP.md](docs/PACKAGE-MAP.md) |
| Put the site on a host, including the domain and email | [docs/GOING-LIVE.md](docs/GOING-LIVE.md) |
| Change the public address, with or without Node | [docs/GOING-LIVE.md](docs/GOING-LIVE.md) |
| Add, change, cancel, or remove a show | [docs/SHOWS.md](docs/SHOWS.md) |
| Mailing list and the REGION field | [docs/MAILING-LIST.md](docs/MAILING-LIST.md) |
| Podcast, biography, books, albums, press, sources | [docs/CONTENT-EDITING-GUIDE.md](docs/CONTENT-EDITING-GUIDE.md) |
| Headshots | [docs/CONTENT-EDITING-GUIDE.md](docs/CONTENT-EDITING-GUIDE.md) |
| Fonts, colors, and the license | [docs/FONTS-AND-DESIGN.md](docs/FONTS-AND-DESIGN.md) |
| Look at the site on your computer | [docs/PREVIEW-AND-ROLLBACK.md](docs/PREVIEW-AND-ROLLBACK.md) |
| Publish, keep a backup, roll back | [docs/PREVIEW-AND-ROLLBACK.md](docs/PREVIEW-AND-ROLLBACK.md) |
| Run the tests | [docs/TESTS.md](docs/TESTS.md) |
| Move accounts and take down the preview | [docs/OWNERSHIP-TRANSFER.md](docs/OWNERSHIP-TRANSFER.md) |
| Something looks wrong | [docs/FAQ.md](docs/FAQ.md) |
| What needs a developer | [docs/WHO-DOES-WHAT.md](docs/WHO-DOES-WHAT.md) |
| What is still missing from the team | [docs/OUTSTANDING.md](docs/OUTSTANDING.md) |
| Technical map | [docs/DEVELOPER-HANDOFF.md](docs/DEVELOPER-HANDOFF.md) |

## Short version of going live

1. Unzip this folder.
2. Open `data/site.json`. Set `siteUrl` to the public `https://` address, with no slash at the end.
3. If the `REGION` field is not in Mailchimp yet, set `"signupEnabled": false`. After that field exists and a test signup works, set it to `true`.
4. Run `node scripts/apply-site-config.js`. If Node is not available, follow the manual list in [docs/GOING-LIVE.md](docs/GOING-LIVE.md).
5. Upload the folder so `index.html` is the front page of the domain.
6. Point only the website DNS at the new host. Do not change mail records. [docs/GOING-LIVE.md](docs/GOING-LIVE.md) explains why.
7. Open the site and check a date, a podcast link, and whether the form is in the state you chose.
