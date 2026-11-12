# Website handoff — Doug Stanhope

## What is being delivered

A lightweight, text-first website and its complete source files. The site is built with standard HTML, CSS, JSON and browser JavaScript. It does not require a proprietary CMS, paid framework, database or build system.

The intent is for Doug's team to own the files and handle ordinary content changes independently after handoff.

## How ownership works

The website files are portable. They can be kept in the team's Git repository and hosted through Vercel or another static hosting provider. The team should control the hosting account, domain registration and DNS, source repository, mailing-list provider and any other third-party accounts used by the site.

The handoff of source files does not itself transfer ownership of third-party accounts, domains, mailing lists, images, fonts or other materials. Those should remain under the team's control and be supplied or licensed for use as appropriate.

## What the site supports

- A minimal, single-page presentation with section navigation.
- A prominent podcast link and dedicated podcast information section.
- A data-driven upcoming-show list.
- An individual ticket link for each show record when the exact ticket URL is supplied.
- Schema.org Event structured data generated from complete event records.
- A provider-neutral mailing-list signup form with email, region and consent fields, activated only after a team-owned webhook is configured.
- A historical tour archive and editorial sections for recordings, books, journal, press, store and biography.
- Routine text and show updates through clearly identified source files.

## What still needs team input before full integration

1. **Tour data:** confirmed future dates, show times, venue names, full addresses, timezone offsets and exact ticket URLs.
2. **Mailing list:** identify the provider, configure `MAILING_LIST_WEBHOOK_URL` and optional `MAILING_LIST_WEBHOOK_TOKEN` in Vercel, map the email and region fields in the provider's webhook/automation, and confirm consent, privacy-policy wording and double-opt-in behavior.
3. **Biography and press materials:** approved biography text if the team prefers wording other than the official-source summary, official high-resolution headshots and permission to publish them.
4. **Press links:** exact article URLs, rather than general publisher homepages.
5. **Legacy archive:** source records or verified Wayback Machine captures for any older tour, podcast, journal or press material to be migrated.

No fictional show data, generic headshots or guessed article links should be published to fill these gaps.

## Scope boundary

This is a source-file handoff. It is not an ongoing managed website, a hosted CMS, or a commitment to provide indefinite maintenance. The team can make ordinary content changes using the included guide. New functionality, complex integrations, design changes, troubleshooting beyond routine edits, and ongoing content work should be separately agreed.

## Deployment and domain

The source can be deployed as a static site. The Vercel project should be controlled by the team or explicitly transferred to their account. The canonical domain should only be connected after the team approves the finished site and confirms its hosting and DNS access.

## Security

Do not store passwords, API keys, private tokens or mailing-list credentials in the source repository. If a provider requires a secret credential, it must be stored as a protected environment variable and used server-side. Prefer provider-approved public signup embeds when available.

## Included operating instructions

See [CONTENT-EDITING-GUIDE.md](CONTENT-EDITING-GUIDE.md) for routine editing, show updates, local preview and publishing.
