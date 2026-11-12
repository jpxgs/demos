# Ownership transfer

The preview address is temporary. The files in this folder are the thing that moves. The long-term host is whatever the team chooses. It does not have to be the host used for the preview.

## Accounts to create

| Account | Why |
| --- | --- |
| A place to keep the files | So the team can change shows and text and keep a history. Git hosting is one option. A copy of this folder is enough to start. |
| The host that will serve the site | Any host that can publish the folder. See `START-HERE.md`. |
| The domain registrar | The domain stays where it is registered. Only the DNS records change, and only when the team is ready. |
| The mailing-list account | The form already posts to the existing audience. The team needs that login to add the `REGION` field, read signups, and, only if they want the optional server function, to create an API key. |

## Domain

1. Finish the site on a temporary address and review it.
2. At the registrar, point the domain at the new host. Use the records that host gives you. Common ones are an A record, an AAAA record, or a CNAME.
3. Set `siteUrl` in `data/site.json` to the final `https://` address and run `node scripts/apply-site-config.js`.
4. Upload or publish again.
5. Open the domain and check the dates, the podcast, and the form.

Leave the previous site in place until the new one answers on the domain. Do not delete the previous DNS records until the new host is confirmed.

## Mailing list

1. Confirm the audience ids in `data/site.json` are the list you want. Those ids are already public on the signup form.
2. Add a text merge field tagged `REGION` if it is not there.
3. Submit one internal address and check that the region arrives.
4. Create an API key only if you turn on `api/subscribe.js`. Store it in the host's secret settings, using the names in `.env.example`. Do not put it in the files or in email.

## What changes hands

- This folder, or the zip made from it.
- The registrar login, or an invitation for the team to edit DNS.
- The mailing-list login.
- The host login, once the team has picked a host.

## What to close after the move

- Preview hosting that the team will not keep.
- Source access that belonged to the build and is not the team's own copy.
- Any API key that was created for a preview and is no longer used. Make a new key in the team's own account instead of reusing a preview key.

Do that only after the domain serves the new files, a test email on the domain still arrives, and a test signup has been checked.

## Take down the preview

The preview address is only for review. After the team's own host is serving the site, remove that preview or leave it unpublished. Do not point the real domain at the preview unless the team has chosen that same host on purpose. Keep a copy of the zip before the preview is removed.
