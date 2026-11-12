"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const content = require("../js/content.js");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "content.json"), "utf8"));
const feed = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "podcast.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "sources.json"), "utf8"));
const site = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "site.json"), "utf8"));

test("podcast, bio, work, press, and footer render from the data files", () => {
  const rendered = content.renderAll(data, feed, sources, site.siteUrl);
  assert.match(rendered.podcast, /Apple Podcasts/);
  assert.match(rendered.podcast, /https:\/\/www\.patreon\.com\/stanhopepodcast/);
  assert.doesNotMatch(rendered.podcast, /patreon\.com\/dougstanhope/);
  assert.match(rendered.podcast, /Mailbag/);
  assert.match(rendered.podcast, /659 episodes/);
  assert.doesNotMatch(rendered.podcast, /omny\.fm/);
  assert.match(rendered.bio, /Worcester, Massachusetts/);
  assert.match(rendered.bio, /Approved headshots have not been added yet/);
  assert.doesNotMatch(rendered.bio, /<img/);
  assert.match(rendered.work, /Discount Meat/);
  assert.match(rendered.work, /Grand Central Publishing/);
  assert.match(rendered.work, /The Road Dog/);
  assert.match(rendered.press, /louie-come-on-god-eddie-1798169241/);
  assert.match(rendered.press, /the-problem-with-charity/);
  assert.match(rendered.press, /Wikipedia — Doug Stanhope/);
  assert.match(rendered.archive, /web\.archive\.org/);
  assert.match(rendered.archive, /archive\/index\.html/);
  assert.match(rendered.archive, /pastgigs/);
  assert.match(rendered.footer, /Contact and booking details have not been supplied/);
  assert.match(rendered.footer, /realstanhope/);
  assert.equal(rendered.person["@graph"][0]["@type"], "Person");
  assert.equal(rendered.person["@graph"][0].name, "Doug Stanhope");
  assert.equal(rendered.person["@graph"][0].image, undefined);
});

test("headshots render only for approved local files with alt text", () => {
  const rendered = content.renderAll({
    ...data,
    headshots: [
      { src: "https://example.com/stock.jpg", alt: "Stock" },
      { src: "assets/press/approved.jpg", alt: "" },
      { src: "assets/press/approved.jpg", alt: "Doug Stanhope, press photo", credit: "Photo: the team", width: 800, height: 1000 }
    ]
  }, null, [], "https://shows.example");
  assert.match(rendered.bio, /assets\/press\/approved\.jpg/);
  assert.match(rendered.bio, /Doug Stanhope, press photo/);
  assert.match(rendered.bio, /Photo: the team/);
  assert.doesNotMatch(rendered.bio, /example\.com/);
  assert.equal(rendered.person["@graph"][0].image, "https://shows.example/assets/press/approved.jpg");
});

test("editorial HTML is escaped", () => {
  const rendered = content.renderAll({
    ...data,
    bio: ["<script>alert(1)</script>"],
    podcast: { ...data.podcast, embed: { src: "https://evil.test/player", title: "nope" } }
  });
  assert.match(rendered.bio, /&lt;script&gt;/);
  assert.doesNotMatch(rendered.podcast, /evil\.test/);
});
