# Shows

All shows live in `data/shows.json`. It is a list. One object is one performance. The page splits that list into future dates and the archive. You do not file them in two places.

This example is not a real show. The year 2099 is there so it cannot be confused with a booking.

```json
{
  "id": "2099-03-18-example-city",
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

Put a comma between objects. Do not put a comma after the last object. Save the file and publish it. See `docs/PREVIEW-AND-ROLLBACK.md`.

## Every field

| Field | Required | What to type |
| --- | --- | --- |
| `id` | Yes | Lowercase letters, numbers, and hyphens only. Unique. A safe pattern is the date plus the city: `2099-03-18-example-city`. |
| `name` | Yes | The public name. `Doug Stanhope` is enough. Use a longer name only when the bill is specific. |
| `date` | Yes | The venue's calendar date, `YYYY-MM-DD`. March 18, 2099 is `2099-03-18`. |
| `endDate` | No | Last calendar date if the record covers more than one day. Otherwise `""`. |
| `displayDate` | No | Only when the listing should read as a range, such as `June 2–3`. Otherwise `""`. |
| `startTime` | For Google | 24-hour local time, `HH:MM`. 8:00 p.m. is `20:00`. Use `""` if the time is unknown. |
| `endTime` | No | Same shape as `startTime`. Use `""` if unknown. |
| `timezone` | With a time | An IANA name. Examples: `America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`, `Europe/London`, `Australia/Sydney`. Do not type `PST`, `EST`, or `GMT-8`. The page works out the offset, including daylight saving. |
| `venue` | For Google | The room or club name. |
| `city` | For Google | City. |
| `region` | No | State, province, or region. `CA` for California. |
| `country` | For Google | `US`, `CA`, `AU`, or a country name when that is what you have. |
| `address` | Strongly useful | Street address. Google uses it. Use `""` if you do not have it. |
| `postalCode` | No | ZIP or postal code. |
| `ticketUrl` | When tickets exist | The direct ticket page, starting with `https://`. Not the venue homepage. Use `""` if there is no link yet. The page then says "No ticket link yet". |
| `status` | Yes | One of `scheduled`, `sold out`, `canceled`, `postponed`. |
| `notes` | No | One short public line. `""` if there is nothing to say. |

## Add

Copy the example, change every value, and put the object in the list in `data/shows.json`.

## Edit

Change the fields on that object. The `id` can stay so the link to that show does not change.

## Ticket link

Replace `ticketUrl` with the new `https://` address. The button and the event data use that same value.

## Sold out

Set `"status": "sold out"`. Keep `ticketUrl` if the box office page still exists.

## Cancel

Set `"status": "canceled"`. Leave the object in the file so the date still shows as canceled.

## Postpone

Set `"status": "postponed"`. When the new date exists, change `date`, `startTime`, `timezone`, and `ticketUrl`.

## Remove

Delete the whole object, and the comma that separated it, when the date should vanish. Do not leave a trailing comma.

## What visitors see

- A future date appears under Tour dates, soonest first.
- A past date moves to the archive on its own. Archive rows do not offer tickets.
- `scheduled` shows the word Scheduled. `sold out`, `canceled`, and `postponed` show those words.
- An unsafe ticket link, anything that is not `http://` or `https://`, is dropped.

## Google rich results

Google can list a show when the public page contains event data. This site adds that data only for a future show with `name`, `date`, `startTime`, `timezone`, `venue`, `city`, `country`, and a known `status`.

After that show is published, open:

https://search.google.com/test/rich-results

Paste the public page address and run the test. You want an Event result whose date, place, and ticket link match the page. A page with no complete future show will not show an Event. That is expected on the empty preview.

Google decides what to list. Passing the test does not force a listing.
