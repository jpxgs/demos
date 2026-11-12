"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("recovered pages keep one banner, the capture, and the theme control", () => {
  const manifest = JSON.parse(read("archive/manifest.json"));
  assert.ok(manifest.eras.length >= 2);
  const ids = manifest.eras.map((era) => era.id);
  assert.deepEqual(ids, ["2010", "2014"]);
  for (const era of manifest.eras) {
    assert.ok(era.pages.length >= 8, era.id);
    for (const page of era.pages) {
      const relative = page.file.replace(/^archive\//, "");
      const text = read(path.join("archive", relative));
      assert.equal((text.match(/class="site-archive-banner"/g) || []).length, 1, page.file);
      assert.match(text, new RegExp("web\\.archive\\.org/web/" + page.timestamp + "/"), page.file);
      assert.match(text, /<script id="theme-boot">/, page.file);
      assert.match(text, /data-theme-toggle/, page.file);
      const hrefs = [...text.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
      for (const href of hrefs) {
        let host = "";
        try {
          host = new URL(href).hostname.replace(/^www\./, "");
        } catch {
          host = "";
        }
        if (host === "dougstanhope.com") {
          assert.match(href, /web\.archive\.org/, page.file + " " + href);
        }
      }
    }
  }
  assert.match(read("archive/index.html"), /data-theme-toggle/);
  assert.match(read("archive/2014/baiting-journal/index.html"), /19 November 2014/);
  assert.match(read("archive/2010/index.html"), /10 April 2010/);
  const missed = manifest.eras[1].failures.map((item) => item.url);
  assert.ok(missed.some((url) => url.includes("journal")));
});
