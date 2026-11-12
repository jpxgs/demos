"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const content = require("../js/content.js");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "content.json"), "utf8"));

test("podcast, bio, press, and footer render from content.json", () => {
  const rendered = content.renderAll(data);
  assert.match(rendered.podcast, /Apple Podcasts/);
  assert.match(rendered.podcast, /https:\/\/www\.patreon\.com\/stanhopepodcast/);
  assert.doesNotMatch(rendered.podcast, /patreon\.com\/dougstanhope/);
  assert.match(rendered.podcast, /omny\.fm/);
  assert.match(rendered.podcast, /Selected episodes are a partial transcription/);
  assert.match(rendered.bio, /1995 San Francisco International Comedy Competition/);
  assert.match(rendered.bio, /Approved headshots have not been added yet/);
  assert.doesNotMatch(rendered.bio, /<img/);
  assert.match(rendered.press, /louie-come-on-god-eddie-1798169241/);
  assert.match(rendered.press, /the-problem-with-charity/);
  assert.match(rendered.press, /Discount Meat/);
  assert.match(rendered.press, /Digging Up Mother/);
  assert.match(rendered.archive, /web\.archive\.org/);
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
  });
  assert.match(rendered.bio, /assets\/press\/approved\.jpg/);
  assert.match(rendered.bio, /Doug Stanhope, press photo/);
  assert.match(rendered.bio, /Photo: the team/);
  assert.doesNotMatch(rendered.bio, /example\.com/);
  assert.equal(rendered.person["@graph"][0].image, "https://demostanhope.vercel.app/assets/press/approved.jpg");
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
