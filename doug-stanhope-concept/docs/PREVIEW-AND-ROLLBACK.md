# Preview, publish, backup, roll back

## On your computer, with Node

From the site folder:

```bash
npm ci
npm test
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`. `npm ci` installs the test tools only. The page itself does not need them.

`npm test` runs the file checks. For the browser checks:

```bash
npx playwright install --with-deps chromium
npm run test:browser
```

## On your computer, without Node

You can still read the site. From the site folder:

```bash
python3 -m http.server 8000
```

Or use any other static server. Opening `index.html` by double-clicking it is a poor check, because some browsers block the data files that way.

You cannot run `npm test` or the two Node scripts without Node. The manual edits are in `docs/GOING-LIVE.md`. Podcast edits by hand are in `docs/CONTENT-EDITING-GUIDE.md`.

## Publish

Upload the changed files to the host, or publish the Git branch your host watches. Then open the public address and look at the change on a phone-width window.

Before each publish, download a copy of the live folder or keep the previous zip. That copy is the backup.

## Roll back

| Host | What to do |
| --- | --- |
| FTP, cPanel, or any upload | Upload the previous zip over the same folder. |
| GitHub Pages | Revert the commit and push. |
| Netlify | In the deploy list, publish the older deploy. |
| Vercel | Open the previous production deployment and use Instant Rollback. Do not delete old deployments. |
| A Git repository on any host | Revert the commit that caused the problem and publish that. |

Rolling back files does not remove a person who already joined the mailing list.
