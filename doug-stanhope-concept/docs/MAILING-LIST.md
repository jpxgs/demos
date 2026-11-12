# Mailing list

The form on the page posts email and region to Mailchimp from the visitor's browser. No server is required. `api/subscribe.js` is an optional upgrade, described at the end.

## The form mode

`data/site.json` has `signupMode`. The preview and the downloadable package both use `live`. The other two values are optional.

- `live` shows the form and sends it to Mailchimp.
- `preview` shows the same form, including the region field, and checks that the fields are filled in. Submitting it does not contact Mailchimp. The page says: "Preview copy: signup is not sent. On the live site this goes to the mailing list."
- `off` hides the form and shows "The mailing list form is turned off on this copy."

The form does not need an API key. It posts from the visitor's browser. An API key is only for the optional server function at the end of this page.

If Mailchimp does not have a text field tagged `REGION`, a live signup is rejected. The page then says: "That signup did not go through. The mailing list does not have a region field yet, so it rejected the form. It needs a text field tagged REGION."

After you change `signupMode`, run `node scripts/apply-site-config.js`. Without Node, follow the manual list in `docs/GOING-LIVE.md`.

## Create the REGION field in Mailchimp

The form sends the region under the merge tag `REGION`. The audience must have a text field with that exact tag. The public signup page that already exists does not ask for a region, so this field is probably missing.

1. Sign in to Mailchimp.
2. Open **Audience**.
3. If there is more than one audience, open the one whose id matches `audienceId` in `data/site.json`.
4. Open **Settings**, then **Audience fields and *|MERGE|* tags**.
5. Choose **Add A Field**, then **Text**.
6. Set the field label to `Region`.
7. Set the merge tag to `REGION`. Mailchimp will suggest a tag such as `MMERGE6`. Replace that suggestion with `REGION`. The tag must be exactly those six letters.
8. Save.

A text field is the right type. The form sends one of these strings, and they must match exactly:

- North America
- UK and Ireland
- Europe
- Australia and New Zealand
- Asia
- Other

Do not abbreviate them in Mailchimp if you later switch the field to a dropdown. The page and the field have to use the same words.

The public ids are already in `data/site.json`:

```json
"mailchimp": {
  "server": "us7",
  "userId": "99a44c5b158aed2fa397e1429",
  "audienceId": "e2b49520e8",
  "regionField": "REGION"
}
```

Confirm that audience is the one you want before you rely on it. Those ids are public. They are not an API key. If you change them, run `node scripts/apply-site-config.js`.

## Confirm a test signup

1. Confirm `signupMode` is `live` and apply the config.
2. Open the page.
3. Use an inbox you can read. Choose a region. Check the consent box. Submit.
4. In Mailchimp, open the audience and find that address. The region field should show the words you chose.
5. A new address usually stays pending until the person clicks the confirmation email. That is Mailchimp's double opt-in, and it is the right default.
6. Submit the same address again. Mailchimp should say the address is already on the list, not create a second copy.

This package has not completed that live test. Do it once before you announce the form.

## What visitors may see

| What they see | What it means |
| --- | --- |
| Check your email, or Mailchimp's own confirmation sentence | The signup was accepted and is waiting on the confirmation email. |
| Already subscribed, or a similar sentence | The address was already on the list. |
| That signup did not go through. The mailing list does not have a region field yet | The `REGION` tag does not exist yet, or the tag is spelled differently. |
| Preview copy: signup is not sent | `signupMode` is `preview`. Nothing was sent. |
| Sending you on to the mailing list | The in-page check failed. The browser then opens Mailchimp's own form page. |
| The mailing list form is turned off on this copy | `signupMode` is `off`. |
| The browser's own "fill in this field" message | Email, region, or consent was left blank. |

## Consent and spam

The consent box is required. It is not sent to Mailchimp as its own field. It only stops the form from submitting until it is checked.

A hidden extra field is left empty on purpose. Automated signups often fill every field. If that field has text, the script does not send the signup.

Do not buy addresses or paste a spreadsheet into the audience. Mailchimp's rules require permission. The form is the permission path.

## Optional API upgrade

`api/subscribe.js` signs people up with a secret key so the key never sits in the browser. Use it only on a host that runs Node functions. The normal form does not need it.

Copy the names from `.env.example` into the host's secret settings:

| Name | What to put |
| --- | --- |
| `MAILCHIMP_API_KEY` | The key from the Mailchimp account. It ends in the server prefix, such as `-us7`. |
| `MAILCHIMP_SERVER_PREFIX` | The same prefix, such as `us7`. |
| `MAILCHIMP_AUDIENCE_ID` | The audience id. |
| `MAILCHIMP_REGION_MERGE_FIELD` | `REGION`, unless the tag is different. |
| `MAILCHIMP_STATUS_IF_NEW` | `pending` so new people confirm by email. Use `subscribed` only if you have decided to skip that. |

Leave these out of the site files. The public form keeps working if you never fill them in.
