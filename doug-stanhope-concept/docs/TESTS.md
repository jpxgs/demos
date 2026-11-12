# Tests

From the site folder, with Node installed:

```bash
npm ci
npm test
```

`npm test` runs `node --test tests/*.test.js`. It does not need a host, a browser, or a mailing-list key.

| File | What it checks |
| --- | --- |
| `tests/site.test.js` | Dates, ticket links, sold out, canceled, postponed, missing tickets, timezones, and event data. Fixtures are not real shows. |
| `tests/content.test.js` | Biography, albums, books, press, podcast episodes, and that unsafe HTML is escaped. |
| `tests/quality.test.js` | The public address matches `data/site.json`, the form posts to the Mailchimp address in that file, the form is hidden only when `signupEnabled` is false, fonts are woff2, and the license text is present. |
| `tests/subscribe.test.js` | The optional `api/subscribe.js` function. One test is skipped when no API key is set. That skip means no live request was made. |
| `tests/archive-search.test.js` | The past-date search. |

Browser checks:

```bash
npx playwright install --with-deps chromium
npm run test:browser
```

Those open the page in Chromium at desktop and phone sizes. They check the section order, keyboard order, the form state, fonts, and an accessibility scan. Screenshots land in `test-results/screenshots/`.

Do not delete a failing test to make the run green. Fix the cause, or leave the failure visible.

The same commands run in `.github/workflows/doug-stanhope-checks.yml` when the files are in the preview repository.
