"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const mailchimp = require("../api/mailchimp.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "test-results") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

test("canonical host is consistent across the public files", () => {
  const site = JSON.parse(read("data/site.json"));
  const origin = String(site.siteUrl).replace(/\/+$/, "");
  const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const html = read("index.html");
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");
  assert.match(html, new RegExp(`rel="canonical" href="${escaped}/"`));
  assert.match(html, new RegExp(`property="og:url" content="${escaped}/"`));
  assert.match(sitemap, new RegExp(`<loc>${escaped}/</loc>`));
  assert.match(robots, new RegExp(`Sitemap: ${escaped}/sitemap.xml`));
  assert.equal(sitemap.match(/<loc>/g).length, 1);
});

test("the public form posts to the Mailchimp address in site.json", () => {
  const site = JSON.parse(read("data/site.json"));
  const embed = require("../js/mailchimp-form.js");
  const html = read("index.html");
  const action = embed.postAction(site.mailchimp).replace(/&/g, "&amp;");
  assert.match(html, /name="EMAIL"/);
  assert.match(html, /name="REGION"/);
  assert.match(html, new RegExp(`name="${embed.botField(site.mailchimp)}"`));
  assert.ok(["live", "preview", "off"].includes(site.signupMode), site.signupMode);
  if (site.signupMode === "off") {
    assert.match(html, /<form id="mailing-list-form"[^>]* hidden>/);
    assert.doesNotMatch(html, /<p id="signup-off"[^>]* hidden>/);
    assert.match(html, /action="#list"/);
  } else {
    assert.doesNotMatch(html, /<form id="mailing-list-form"[^>]* hidden>/);
    assert.match(html, /<p id="signup-off"[^>]* hidden>/);
  }
  if (site.signupMode === "live") {
    assert.match(html, new RegExp(`action="${action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  } else if (site.signupMode === "preview") {
    assert.match(html, /action="#list"/);
    assert.doesNotMatch(html, /<form id="mailing-list-form"[^>]*list-manage\.com/);
  }
  for (const region of mailchimp.REGIONS) {
    assert.ok(html.includes(`value="${region}"`), region);
  }
});

test("a missing region field is explained without posting in preview mode", () => {
  const embed = require("../js/mailchimp-form.js");
  assert.equal(embed.signupMode({ signupMode: "live" }), "live");
  assert.equal(embed.signupMode({ signupMode: "preview" }), "preview");
  assert.equal(embed.signupMode({ signupMode: "off" }), "off");
  assert.equal(embed.signupMode({}), "live");
  assert.equal(
    embed.visitorMessage({ result: "error", msg: "0 - Please enter a value for REGION" }),
    embed.REGION_REJECTION
  );
  assert.equal(
    embed.visitorMessage({ result: "error", msg: "The merge field was not found." }),
    embed.REGION_REJECTION
  );
  assert.match(
    embed.visitorMessage({ result: "error", msg: "Too many attempts. Please try again." }),
    /Too many attempts/
  );
  assert.equal(
    embed.MODE_STATUS.preview,
    "Preview copy: signup is not sent. On the live site this goes to the mailing list."
  );
});

test("internal pages point back at the single page and do not keep the old Patreon URL", () => {
  const htmlFiles = walk(root).filter((file) => file.endsWith(".html") && !file.includes(`${path.sep}archive${path.sep}`));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /patreon\.com\/dougstanhope/, path.relative(root, file));
    assert.doesNotMatch(html, /href="https:\/\/www\.avclub\.com\/"/, path.relative(root, file));
    assert.doesNotMatch(html, /href="https:\/\/www\.heraldscotland\.com\/"/, path.relative(root, file));
  }
  for (const folder of ["tour", "podcast", "about", "press", "recordings", "books", "journal", "store"]) {
    const html = read(folder + "/index.html");
    assert.match(html, /noindex/);
    const origin = JSON.parse(read("data/site.json")).siteUrl.replace(/\/+$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(html, new RegExp(`rel="canonical" href="${origin}/#`));
  }
});

test("no secrets or unused headshot files are committed", () => {
  const textFiles = walk(root).filter((file) => /\.(html|js|json|css|md|txt|xml|yml)$/.test(file));
  for (const file of textFiles) {
    const text = fs.readFileSync(file, "utf8");
    const relative = path.relative(root, file);
    assert.doesNotMatch(text, /[0-9a-f]{32}-us\d+/i, relative);
    if (!relative.startsWith("tests" + path.sep)) {
      assert.doesNotMatch(text, /MAILCHIMP_API_KEY\s*=\s*["'][^"']+["']/, relative);
    }
  }
  const press = fs.readdirSync(path.join(root, "assets", "press"));
  const images = press.filter((name) => /\.(jpe?g|png|webp|gif|avif)$/i.test(name));
  const content = JSON.parse(read("data/content.json"));
  const referenced = new Set((content.headshots || []).map((shot) => path.basename(shot.src || "")));
  for (const image of images) assert.ok(referenced.has(image), image);
  for (const shot of content.headshots || []) {
    assert.ok(fs.existsSync(path.join(root, shot.src)), shot.src);
  }
});

test("the theme script is inline, early, and allowed by the content security policy", () => {
  const crypto = require("node:crypto");
  const html = read("index.html");
  const match = html.match(/<script id="theme-boot">([\s\S]*?)<\/script>/);
  assert.ok(match, "theme boot script");
  const hash = crypto.createHash("sha256").update(match[1]).digest("base64");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.ok(head.indexOf('id="theme-boot"') < head.indexOf('rel="stylesheet"'));
  assert.match(html, /data-theme-toggle/);
  assert.match(html, /Day/);
  assert.match(html, /Night/);
  const vercel = JSON.parse(read("vercel.json"));
  const csp = vercel.headers[0].headers.find((header) => header.key === "Content-Security-Policy").value;
  assert.match(csp, new RegExp(`'sha256-${hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
  const css = read("style.css");
  assert.match(css, /html\[data-theme="night"\]/);
  assert.match(css, /--paper:\s*#1c1916/);
  assert.match(css, /--ink:\s*#f3efe6/);
  assert.match(read("archive/banner.css"), /#1c1916/);
  assert.match(read("archive/banner.css"), /#f3efe6/);
});

test("section order and security headers are present", () => {
  const html = read("index.html");
  const ids = [...html.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, ["dates", "podcast", "list", "bio", "work", "press", "archive"]);
  for (const file of [
    "fonts/ibm-plex-sans-400.woff2",
    "fonts/ibm-plex-sans-600.woff2",
    "fonts/ibm-plex-mono-400.woff2",
    "fonts/ibm-plex-mono-500.woff2"
  ]) {
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(bytes.subarray(0, 4).toString(), "wOF2", file);
  }
  assert.match(read("fonts/OFL.txt"), /SIL Open Font License/);
  assert.match(read("style.css"), /font-display:\s*swap/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/);
  const podcast = JSON.parse(read("data/podcast.json"));
  assert.equal(podcast.episodeCount > 0, true);
  for (const episode of podcast.episodes) {
    assert.match(episode.url, /^https:\/\//);
    assert.match(episode.date, /^\d{4}-\d{2}-\d{2}$/);
  }
  const vercel = JSON.parse(read("vercel.json"));
  const headers = vercel.headers[0].headers.map((header) => header.key);
  for (const key of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options"]) {
    assert.ok(headers.includes(key), key);
  }
  const csp = vercel.headers[0].headers.find((header) => header.key === "Content-Security-Policy").value;
  assert.match(csp, /frame-src https:\/\/omny\.fm/);
  assert.match(csp, /connect-src 'self'/);
});
