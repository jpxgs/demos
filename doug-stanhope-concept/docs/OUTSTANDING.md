# Still needed from the team

Nothing below was invented to fill a gap. Each item stays open until the team supplies it.

- [ ] Confirmed upcoming shows, or a written note that the empty list should stay. For each show: name, date, start time, IANA timezone, venue, street address, city, state or region, postal code, country, direct ticket URL, and status (`scheduled`, `sold out`, `canceled`, or `postponed`).
- [ ] A `REGION` text field on the Mailchimp audience, tag exactly `REGION`, and one internal test signup that shows the region on the member.
- [ ] Approved headshots, with alt text and a photo credit. Files go in `assets/press/`.
- [ ] A public contact or booking address, if the footer should show one.
- [ ] A yes or no on editing the JSON files, instead of a separate login.
- [ ] The host the team will use for the long term, and DNS access that does not disturb email.
- [ ] Confirmation that the audience ids in `data/site.json` are the list they want.

The preview keeps `signupEnabled` set to `false` until that region field exists. The zip is built with `signupEnabled` set to `true`. Set it back to `false` before a public upload if the field is not ready.
