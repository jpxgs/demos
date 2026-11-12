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
  const content = JSON.parse(read("data/content.json"));
  const html = read("index.html");
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");
  assert.equal(content.siteUrl, "https://demostanhope.vercel.app");
  assert.match(html, /rel="canonical" href="https:\/\/demostanhope\.vercel\.app\/"/);
  assert.match(html, /property="og:url" content="https:\/\/demostanhope\.vercel\.app\/"/);
  assert.match(sitemap, /<loc>https:\/\/demostanhope\.vercel\.app\/<\/loc>/);
  assert.match(robots, /Sitemap: https:\/\/demostanhope\.vercel\.app\/sitemap\.xml/);
  assert.equal(sitemap.match(/<loc>/g).length, 1);
});

test("the signup fallback and region choices match the server", () => {
  const content = JSON.parse(read("data/content.json"));
  const html = read("index.html");
  assert.ok(html.includes(content.listUrl.replace(/&/g, "&amp;")) || html.includes(content.listUrl));
  for (const region of mailchimp.REGIONS) {
    assert.ok(html.includes(`value="${region}"`), region);
  }
});

test("internal pages point back at the single page and do not keep the old Patreon URL", () => {
  const htmlFiles = walk(root).filter((file) => file.endsWith(".html"));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /patreon\.com\/dougstanhope/, path.relative(root, file));
    assert.doesNotMatch(html, /href="https:\/\/www\.avclub\.com\/"/, path.relative(root, file));
    assert.doesNotMatch(html, /href="https:\/\/www\.heraldscotland\.com\/"/, path.relative(root, file));
  }
  for (const folder of ["tour", "podcast", "about", "press", "recordings", "books", "journal", "store"]) {
    const html = read(folder + "/index.html");
    assert.match(html, /noindex/);
    assert.match(html, /rel="canonical" href="https:\/\/demostanhope\.vercel\.app\/#/);
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
