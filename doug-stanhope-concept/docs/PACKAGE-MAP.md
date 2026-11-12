# What is in the package

Everything the site needs is in this folder. Paths start at the folder that contains `index.html`.

| Path | What it is |
| --- | --- |
| `START-HERE.md` | The index. Read it first. |
| `index.html` | The only real page. Section headings, the mailing-list form, and the address tags live here. |
| `style.css` | All layout and type. |
| `favicon.svg` | The small browser-tab mark. |
| `404.html` | The not-found page. |
| `js/shows.js` | Turns `data/shows.json` into the date list and the Google event data. |
| `js/content.js` | Turns `data/content.json` into the biography, work lists, press, and footer. |
| `js/site.js` | Loads the data files into the page. |
| `js/mailchimp-form.js` | Builds the public Mailchimp form address from `data/site.json`. |
| `js/mailing-list.js` | Asks Mailchimp for an in-page result. Without this script, the form still submits. |
| `js/archive-search.js` | Filters the past-date list. |
| `data/site.json` | The one public address, the Mailchimp ids, and `signupMode` (`live`, `preview`, or `off`). |
| `data/shows.json` | Every show, upcoming and past. |
| `data/content.json` | Biography, albums, books, screen credits, press, podcast blurb, footer. |
| `data/podcast.json` | The newest episode titles from the public RSS feed. |
| `data/sources.json` | Where the public facts came from. |
| `assets/press/` | Headshot files. Empty until the team adds approved photos. |
| `fonts/` | IBM Plex font files and `OFL.txt`, the license. |
| `archive/` | Saved copies of the old site. Dates and gaps are in `docs/OLD-SITE.md`. |
| `scripts/apply-site-config.js` | Copies `data/site.json` into the page, sitemap, and robots file. |
| `scripts/refresh-podcast.js` | Rewrites `data/podcast.json` from the RSS feed. |
| `sitemap.xml` | Tells search engines the front page address. |
| `robots.txt` | Points at the sitemap. |
| `tour/`, `podcast/`, `about/`, `press/`, `recordings/`, `books/`, `journal/`, `store/` | One-line pages that send old addresses back to the front page. Do not put articles in them. |
| `api/subscribe.js` | Optional. A Node function that signs people up with a secret key. Not used by the normal form. |
| `api/mailchimp.js` | Helper for that optional function. |
| `.env.example` | Empty names for the optional function. No key is filled in. |
| `vercel.json` | Optional. Only used if someone publishes on Vercel. The site works if this file is deleted. |
| `package.json` | How to run the tests. The live site does not need it. |
| `docs/` | The rest of these instructions. |
| `tests/` | The checks. Not shown to visitors. |

`node_modules/` appears only after `npm ci` on a computer. Do not upload it.
