/*
 * Copy data/site.json into the page, sitemap, robots file, and old paths.
 * Edit only data/site.json, then run: node scripts/apply-site-config.js
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const form = require("../js/mailchimp-form.js");

const root = path.join(__dirname, "..");
const site = JSON.parse(fs.readFileSync(path.join(root, "data", "site.json"), "utf8"));
const origin = String(site.siteUrl || "").replace(/\/+$/, "");
const action = form.postAction(site.mailchimp);
const page = form.hostedPage(site.mailchimp);
const bot = form.botField(site.mailchimp);

if (!origin.startsWith("https://") || !action || !page || !bot) {
  console.error("data/site.json needs an https siteUrl and a complete mailchimp block.");
  process.exit(1);
}

const stubs = [
  ["tour", "Dates", "dates"],
  ["podcast", "Podcast", "podcast"],
  ["about", "About", "bio"],
  ["press", "Press", "press"],
  ["recordings", "Press", "press"],
  ["books", "Press", "press"],
  ["journal", "Podcast", "podcast"],
  ["store", "Contact", "footer"]
];

function write(file, text) {
  fs.writeFileSync(path.join(root, file), text);
}

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace(/rel="canonical" href="[^"]*"/, `rel="canonical" href="${origin}/"`);
html = html.replace(/property="og:url" content="[^"]*"/, `property="og:url" content="${origin}/"`);
html = html.replace(
  /href="https:\/\/[^"]*list-manage\.com\/subscribe\?[^"]*"/,
  `href="${page.replace(/&/g, "&amp;")}"`
);
html = html.replace(/name="b_[a-zA-Z0-9_]+"/, `name="${bot}"`);
const mode = site.signupMode;
if (mode !== "live" && mode !== "preview" && mode !== "off") {
  console.error("data/site.json signupMode must be live, preview, or off.");
  process.exit(1);
}
const formAction = mode === "live" ? action.replace(/&/g, "&amp;") : "#list";
html = html.replace(
  /(<form id="mailing-list-form"\b[^>]*?)\saction="[^"]*"/,
  `$1 action="${formAction}"`
);
html = html.replace(/<form id="mailing-list-form"([^>]*)>/, (match, attrs) => {
  const cleaned = attrs.replace(/\s+hidden\b/g, "");
  return `<form id="mailing-list-form"${cleaned}${mode === "off" ? " hidden" : ""}>`;
});
html = html.replace(/<p id="signup-off"([^>]*)>/, (match, attrs) => {
  const cleaned = attrs.replace(/\s+hidden\b/g, "");
  return `<p id="signup-off"${cleaned}${mode === "off" ? "" : " hidden"}>`;
});
write("index.html", html);

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc></url>
</urlset>
`);

write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`);

for (const [folder, title, hash] of stubs) {
  write(folder + "/index.html", `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title} — Doug Stanhope</title>
  <link rel="canonical" href="${origin}/#${hash}">
  <meta http-equiv="refresh" content="0; url=../#${hash}">
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <main class="wrap">
    <p><a href="../#${hash}">Continue to ${title.toLowerCase()}</a></p>
  </main>
</body>
</html>
`);
}

console.log("Applied " + origin);
