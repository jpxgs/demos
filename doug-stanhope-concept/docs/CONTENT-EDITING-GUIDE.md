# Content editing guide — Doug Stanhope website

This is a static website. There is no database or admin dashboard. The source files are the editable product; the team maintains the site by editing the relevant files and publishing those changes through the connected Git repository or another static host.

## Quick reference

| Task | File |
| --- | --- |
| Add, remove or change upcoming shows and ticket links | `data/shows.json` |
| Edit biography, podcast links, books, recordings, journal, press and store copy | `index.html` |
| Change typography, spacing, colors or layout | `style.css` |
| Change how show dates display or how Event data is generated | `js/site.js` |

## Add or update a show

Open `data/shows.json`. It contains a JSON array; each show is one object. Add a comma between objects, but not after the last object.

Use this template, replacing every example value with confirmed details:

```json
{
  "name": "Doug Stanhope at Example Theatre",
  "startDate": "2027-03-18T20:00:00-07:00",
  "endDate": "2027-03-18T22:00:00-07:00",
  "venue": "Example Theatre",
  "ticketUrl": "https://tickets.example.com/event",
  "note": "",
  "status": "scheduled",
  "location": {
    "name": "Example Theatre",
    "address": {
      "streetAddress": "123 Main Street",
      "addressLocality": "Example City",
      "addressRegion": "CA",
      "postalCode": "90000",
      "addressCountry": "US"
    }
  }
}
```

The example is a template only, not a real event.

Rules:
- Use an ISO 8601 date/time with the venue's local UTC offset.
- Link directly to that performance's ticket page, not a venue homepage or general ticketing homepage.
- Include the venue's full postal address. Google Event data needs a meaningful location.
- Use `status: "scheduled"` only for confirmed shows. Remove cancelled events or set `status: "cancelled"`.
- Do not publish tentative dates.
- For separately ticketed performances on consecutive nights, use one record per performance unless the ticket provider sells the run as one event.

The site sorts future dates automatically, displays the ticket link for each record, and generates Schema.org Event structured data from complete records.

## Edit the rest of the page

Open `index.html` in a code editor. Find the relevant section by its ID:
- `podcast` — podcast description and listening links
- `recordings` and `books` — catalog entries
- `journal` — selected journal entries
- `press` — articles, essays, interviews and biography
- `store` — store catalog and official store links
- `about` — introduction and social links

Keep HTML tags balanced. Use exact destination URLs. Do not link an article title to a publisher homepage. Use approved wording and official assets only.

## Podcast

The podcast is highlighted near the top of the page and has its own section. Update its listening destinations in the Podcast section when official links change. Do not add an embed unless the provider and embed are approved.

## Mailing-list signup

The page includes an email field, region selector, consent checkbox and a provider-neutral server-side webhook adapter. The form stays hidden until the adapter confirms that a provider webhook is configured. Until then, visitors see a link to the existing official signup page.

To activate it:
1. Confirm the existing mailing-list provider and select an approved automation/webhook destination in that provider.
2. Configure `MAILING_LIST_WEBHOOK_URL` in the Vercel project's Production and Preview environments as appropriate.
3. If the webhook requires authentication, configure `MAILING_LIST_WEBHOOK_TOKEN` as a protected environment variable.
4. Configure the provider automation to accept JSON fields `email`, `region`, `consent` and `source`, map `region` to its region/custom field, and apply the provider's normal confirmation/double-opt-in process.
5. Test with a dedicated internal address and verify that both email and region arrive correctly before enabling the signup form publicly.

The API never exposes the webhook URL or token in browser code. The current region choices are North America, UK and Ireland, Europe, Australia and New Zealand, Asia, and Other. Change the choices in both `index.html` and `api/subscribe.js` if the provider requires different region segments.

Do not put private API keys, passwords or secret tokens in HTML, JavaScript, JSON or this repository. The generic adapter is a transport layer; it does not guess the team's provider or claim a subscriber has been added until the provider returns a successful response.

## Bio and headshots

The current biography is text-only. Add official headshots only after the team supplies the files and confirms which images may be used publicly. Place approved files in `assets/press/`, use descriptive filenames and add useful alt text. Do not substitute stock or AI-generated images.

## Preview and publish

1. Review the changed files.
2. Validate `data/shows.json` as JSON.
3. Check every date, venue, ticket URL and address against approved show information.
4. Preview on desktop and mobile.
5. Click every changed external link.
6. Confirm no private credentials were committed.
7. Publish using the deployment instructions in README.md.
8. Check the live URL after publishing.

For local preview, run `python -m http.server 8000` from the project folder and open `http://localhost:8000`.

## Ownership and maintenance

The source files are intended to be delivered to the team for independent maintenance. Routine content changes are self-managed. Hosting, domains, mailing-list accounts and other service subscriptions should be controlled by the team. Changes to functionality or integrations may require a developer.
