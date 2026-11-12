# Going live

The site is a folder of files. Any host that can publish HTML can serve it. The preview host is not the long-term host.

## Any static host

1. Unzip the package.
2. Set the address and the form switch in `data/site.json`. See below.
3. Run `node scripts/apply-site-config.js`, or do the manual edits in the next section.
4. Upload the folder so `index.html` is the front page. Include `fonts/`, `js/`, `data/`, `style.css`, `sitemap.xml`, and `robots.txt`. You can upload `api/` as well. A static host will not run it.
5. Turn on HTTPS at the host. Most hosts issue a free certificate after the domain points at them. Wait until the certificate is active before you announce the site. Visitors should see a lock, and the address should start with `https://`.
6. Open the public address on a computer and on a phone.

Do not put the site in a subfolder such as `example.com/newsite/` unless you know how relative links work. Publish it at the root of the domain.

## Change the public address

Open `data/site.json`. `siteUrl` is the only place you type the public address.

```json
{
  "siteUrl": "https://www.example.com",
  "signupMode": "live"
}
```

Rules:

- Start with `https://`.
- No slash at the end.
- Use the address people will type, including `www` if that is the real address.

Then run:

```bash
node scripts/apply-site-config.js
```

That writes the address into:

- `index.html` (the canonical link and the `og:url` tag)
- `sitemap.xml`
- `robots.txt`
- the short pages in `tour/`, `podcast/`, `about/`, `press/`, `recordings/`, `books/`, `journal/`, and `store/`

It also rewrites the Mailchimp form address from the `mailchimp` block in the same file. `live` points the form at Mailchimp. `preview` and `off` point it at `#list`, so a browser without JavaScript cannot post. `off` also hides the form.

## If you cannot run Node

Edit these by hand. Replace only the address. Keep the `https://` and the single trailing slash where you see one.

1. `index.html`. Find `rel="canonical"` and `property="og:url"`. Both should be `https://www.example.com/`.
2. `sitemap.xml`. The `<loc>` line should be `https://www.example.com/`.
3. `robots.txt`. The Sitemap line should be `Sitemap: https://www.example.com/sitemap.xml`.
4. In each short page listed above, the `rel="canonical"` link should be `https://www.example.com/#dates` (or `#podcast`, `#bio`, `#press`, `#footer` for the store page). Leave the `../#...` links as they are. Those are not the public address.
5. Leave the Mailchimp `action` on the form unless the audience ids changed. Those ids are in `data/site.json` under `mailchimp`.
6. For `live`, the form `action` is the Mailchimp address and the form is visible. For `preview`, the form is visible and its `action` is `#list`. For `off`, add the word `hidden` to the `<form id="mailing-list-form" ...>` tag, remove `hidden` from `<p id="signup-off"`, and set the form `action` to `#list`. Set the same `signupMode` in `data/site.json`.

## Point the domain, and do not break email

The website and email are different DNS records.

- Website records are usually A, AAAA, or CNAME.
- Email records are MX. Mail also uses TXT records for SPF, DKIM, and DMARC.

If email should keep working:

- Change only the records that serve the website.
- Do not change MX records.
- Do not delete TXT records that mention the mail provider.
- Do not switch the domain's nameservers to a new host unless every MX and mail TXT record has been copied onto the new nameservers first. Moving nameservers without those records stops mail.

Squarespace is a common place for the current website. Leaving Squarespace means changing the web records only. Squarespace's own help names the records it uses for the site. Remove or replace those web records. Leave the mail records.

After the change, wait. DNS can take from a few minutes to 48 hours. Check the site and send a test email to an address on the domain before you cancel the old website plan.

Also set both the bare domain and `www` if both should open the site. Pick one as the address in `siteUrl` and have the host redirect the other to it.

## Optional hosts

None of these is required.

**FTP or cPanel.** Upload into the domain web folder, often `public_html`. Do the `siteUrl` steps before the upload. To roll back, keep the previous zip and upload it again over the same folder.

**GitHub Pages.** Put the files in a repository the team controls. In the repository settings, turn on Pages for the branch you want. Set `siteUrl` to the Pages address (`https://something.github.io` or the custom domain), run the script, and commit. To roll back, revert that commit.

**Netlify.** Drag the folder onto a Netlify site, or connect a Git repository. Set `siteUrl` first. HTTPS is on by default after the domain is added. To roll back, open the deploy list and publish an older deploy.

**Vercel.** Optional preview-style host. `vercel.json` only matters there. It tidies URLs and adds a few response headers. Delete it if you are not using Vercel. To roll back on Vercel, open the previous production deployment and use Instant Rollback. Do not delete old deployments if you may need them.

The mailing-list form talks to Mailchimp from the browser on every one of these hosts. You do not need `api/` for that.
