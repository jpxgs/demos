/*
 * Replace data/podcast.json with the current public RSS feed.
 * Run from doug-stanhope-concept: node scripts/refresh-podcast.js
 * There is no production build step. Commit the file after checking it.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const FEED_URL = "https://rss.libsyn.com/shows/623910/destinations/5490435.xml";
const OUT = path.join(__dirname, "..", "data", "podcast.json");
const KEEP = 8;

function decode(xml) {
  return xml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function tag(block, name) {
  const match = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return match ? decode(match[1]).replace(/\s+/g, " ").trim() : "";
}

async function main() {
  const response = await fetch(FEED_URL, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
  if (!response.ok) throw new Error("RSS request failed (" + response.status + ")");
  const xml = await response.text();
  const items = xml.split(/<item\b/i).slice(1);
  const episodes = items.slice(0, KEEP).map((block) => {
    const pubDate = tag(block, "pubDate");
    const parsed = new Date(pubDate);
    if (!pubDate || Number.isNaN(parsed.getTime())) throw new Error("An episode is missing a date");
    const url = tag(block, "link");
    const title = tag(block, "title");
    if (!title || !url.startsWith("https://")) throw new Error("An episode is missing a title or https link");
    return {
      title,
      date: parsed.toISOString().slice(0, 10),
      url
    };
  });
  if (episodes.length === 0) throw new Error("The feed had no episodes");
  const descriptionMatch = xml.match(/<description>([\s\S]*?)<\/description>/i);
  const payload = {
    source: FEED_URL,
    retrieved: new Date().toISOString().slice(0, 10),
    title: tag(xml.slice(0, xml.search(/<item\b/i)), "title") || "The Doug Stanhope Podcast",
    description: descriptionMatch ? decode(descriptionMatch[1]).replace(/\s+/g, " ").trim() : "",
    episodeCount: items.length,
    episodes
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log("Wrote " + episodes.length + " of " + items.length + " episodes to " + path.relative(process.cwd(), OUT));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
