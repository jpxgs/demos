"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "js", "archive-search.js"),
  "utf8"
);

function runSearch() {
  const entries = [
    { textContent: "Seattle, WA — Laughs Comedy Club", hidden: false },
    { textContent: "Columbus, OH — Funny Bone", hidden: false }
  ];
  const year = {
    dataset: { year: "2026" },
    hidden: false,
    querySelectorAll: () => entries
  };
  const search = {
    value: "",
    handler: null,
    addEventListener(event, handler) {
      if (event === "input") this.handler = handler;
    }
  };
  const count = { textContent: "" };
  const document = {
    querySelector(selector) {
      return selector === "#q" ? search : selector === "#count" ? count : null;
    },
    querySelectorAll(selector) {
      return selector === ".archive-year" ? [year] : [];
    }
  };

  vm.runInNewContext(source, { document }, { timeout: 1000 });
  return { entries, year, search, count };
}

test("archive search initializes with all entries visible", () => {
  const result = runSearch();
  assert.equal(result.count.textContent, "2 entries");
  assert.equal(result.entries.every((entry) => !entry.hidden), true);
});

test("archive search filters entries and updates the count", () => {
  const result = runSearch();
  result.search.value = "Seattle";
  result.search.handler();
  assert.equal(result.entries[0].hidden, false);
  assert.equal(result.entries[1].hidden, true);
  assert.equal(result.year.hidden, false);
  assert.equal(result.count.textContent, "1 entry");
});

test("year search shows all entries for a matching year", () => {
  const result = runSearch();
  result.search.value = "2026";
  result.search.handler();
  assert.equal(result.entries.every((entry) => !entry.hidden), true);
  assert.equal(result.count.textContent, "2 entries");
});

test("archive search safely exits when its controls are absent", () => {
  assert.doesNotThrow(() => vm.runInNewContext(source, {
    document: {
      querySelector: () => null,
      querySelectorAll: () => []
    }
  }, { timeout: 1000 }));
});
