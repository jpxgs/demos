# Site handoff

This is the operating overview for the site owner. Exact editing steps are in [CONTENT-EDITING-GUIDE.md](CONTENT-EDITING-GUIDE.md). Technical detail is in [DEVELOPER-HANDOFF.md](DEVELOPER-HANDOFF.md).

## What the site is

One text-first page. Visitors get, in this order: tour dates, the podcast, the mailing list, a short biography and headshot area, albums and books, press, then an archive of past dates and pointers to the older site. The footer has contact, booking, the store, and social links. Labels use a monospace face. Body text uses a plain sans. Both are self-hosted.

There is no separate tour page, store page, or admin screen. Older addresses such as `/podcast/` and `/press/` only send people back to the matching part of the front page.

The page is served from the existing hosting project. The public address in use now is `https://demostanhope.vercel.app/`. The custom domain is not connected.

## What your team can change

Ordinary updates are edits to two files:

| Change | File |
| --- | --- |
| Shows, ticket links, cancellations | `doug-stanhope-concept/data/shows.json` |
| Biography, headshots, podcast links, press, footer links | `doug-stanhope-concept/data/content.json` |

Publishing those edits requires write access to the source repository. The hosting project publishes the main branch on its own. A change on any other branch gets a preview address first.

The repository and the hosting project are still in the agency accounts. Until those are transferred, or your team is invited in, your team cannot publish on its own.

## What is deliberately not finished

- No upcoming shows are listed. None were confirmed, and none were invented. The dates section says no dates are announced and points to the mailing list.
- The on-site mailing-list form is built, including a required region, and it is switched off. No mailing-list API key is stored in the project. Visitors currently get the existing public signup page, which does not ask for a region.
- No headshot is published. The biography has a place for approved photos. Nothing is shown until a file is added.
- Contact and booking details are not published. The footer says they have not been supplied.
- The old website was not copied into this project. The archive section links to the Internet Archive and to the official past-gigs page. A full copy was not recovered.

## Accounts your team will need

| Access | Who needs it | Why |
| --- | --- | --- |
| Source repository, write access | Whoever updates shows and text | Editing and merging into the main branch is what publishes the site |
| Hosting project | Whoever sets the mailing list up, checks previews, or rolls back | Environment variables, preview addresses, and rollback live here |
| Mailing-list account | Whoever owns the list | An API key and a region field have to be created there |
| Domain registrar | Whoever approves the finished site | The custom domain should be connected only after that approval |

A developer is needed for the mailing-list environment variables if nobody on the team has the hosting project, for domain and DNS changes, for layout or code changes, and for a deployment that fails. Day-to-day show and text edits do not need a developer once repository access exists.

## Security

Do not put API keys, passwords, or private tokens in the repository, in a page, or in chat. The mailing-list key belongs only in the hosting project's environment variables.
