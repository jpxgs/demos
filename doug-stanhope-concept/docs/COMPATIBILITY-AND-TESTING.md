# Testing

Automated checks are the source of truth. Run them from `doug-stanhope-concept` on Node 22.

```bash
npm ci
npm test
npx playwright install --with-deps chromium
npm run test:browser
```

`npm test` runs `tests/*.test.js` with `node --test`. `npm run test:browser` runs Chromium at 1280×800 and 390×844. The browser run covers the front page, section order, keyboard order, axe on the page itself, horizontal overflow, the mailing-list fallback, old paths, and screenshots under `test-results/screenshots/`.

The same commands run in `.github/workflows/doug-stanhope-checks.yml`.

The mailing-list live check skips when `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, and `MAILCHIMP_AUDIENCE_ID` are unset. That skip means no request was sent. It is not a pass against the provider.

The page is static HTML, CSS, and a small set of scripts, aimed at current evergreen browsers. These automated checks do not replace a look at a physical phone after a visual change. They do fail the branch when the desktop and mobile Chromium runs fail. Do not skip a failing test to make the run green.
