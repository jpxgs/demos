# Start here

This folder is the whole site. It is HTML, CSS, JavaScript, fonts, and data files. Unzip it anywhere. It does not need the account that built the preview, and it does not need a particular host.

The mailing-list form sends email and region straight to Mailchimp from the browser. A server is not required for that form.

## 1. Put the files on any static host

Use this path first. It fits a domain you already have, a web hotel, or any service that publishes a folder of files.

1. Unzip the archive.
2. Open `data/site.json`. Set `siteUrl` to the public address visitors will use. Include `https://` and leave off the final slash. Example: `https://www.example.com`
3. From this folder, run:

```bash
node scripts/apply-site-config.js
```

That copies `siteUrl` into the page address, the sitemap, `robots.txt`, and the short old-path pages. It also copies the Mailchimp ids in that same file into the form. Edit `data/site.json` only, then run the command again.

4. Upload the folder to the host so `index.html` is the front page of the domain. Include `fonts/`, `js/`, `data/`, and `style.css`. The `api/` folder can stay. A static host ignores it.
5. Point the domain at that host, using the host's own DNS instructions.
6. Open the site. Check a date, a podcast link, and the mailing-list form.

In the Mailchimp account, the audience needs a text field whose tag is `REGION`. The values the form sends are North America, UK and Ireland, Europe, Australia and New Zealand, Asia, and Other. The ids in `data/site.json` under `mailchimp` must be that audience. They are public form ids, not a secret key. If the field is missing, Mailchimp rejects the signup and the page says so.

`node scripts/refresh-podcast.js` rewrites `data/podcast.json` from the public RSS feed. Run it when the episode list should be brought up to date, then upload that file again.

## 2. Other ways to publish

These are optional. None of them is required.

**FTP or cPanel.** Upload the unzipped folder into the domain's web folder, often `public_html`. Do the `siteUrl` steps first.

**GitHub Pages.** Put the files in a repository the team controls, turn Pages on, set `siteUrl` to the Pages address, run `node scripts/apply-site-config.js`, and commit the result.

**Netlify.** Drag the folder onto a Netlify deploy, or connect a Git repository. Set `siteUrl` first. The form still talks to Mailchimp directly.

**Vercel.** Optional, and only a preview style of host. `vercel.json` adds tidy URLs and a few response headers for that kind of deploy. The site works if that file is deleted. Do not treat it as the long-term host unless the team chooses it.

## 3. Optional server signup

`api/subscribe.js` is an upgrade, not the normal path. It calls Mailchimp with an API key so the key never appears in the browser. Use it only on a host that runs Node functions. Copy `.env.example` into the host's secret settings. Leave the key out of this folder. The public form keeps working if this function is never turned on.

## What to edit after it is live

`docs/CONTENT-EDITING-GUIDE.md` covers shows, text, photos, and the podcast list. `docs/OWNERSHIP-TRANSFER.md` covers the domain, accounts, and Mailchimp. `docs/DEVELOPER-HANDOFF.md` is the technical map.

## Check the files on a computer

```bash
npm ci
npm test
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`. `npm test` does not need a host or a mailing-list key. The browser checks also run with `npx playwright install --with-deps chromium` and `npm run test:browser`.
