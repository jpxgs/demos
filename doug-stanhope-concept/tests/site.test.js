"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const path = require("node:path");
const scriptSource = fs.readFileSync(
  path.join(__dirname, "..", "js", "site.js"),
  "utf8"
);

async function runPage(fetchResult) {
  const container = {
    innerHTML: "",
    textContent: "",
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); }
    }
  };
  const appended = [];
  const document = {
    querySelector(selector) {
      return selector === "#upcoming-shows" ? container : null;
    },
    createElement(tag) {
      return { tagName: tag, type: "", textContent: "" };
    },
    head: {
      appendChild(element) { appended.push(element); }
    }
  };
  const context = {
    document,
    URL,
    Date,
    Intl,
    console: { error() {} },
    fetch: async () => fetchResult
  };

  vm.runInNewContext(scriptSource, context, { timeout: 1000 });
  await new Promise((resolve) => setImmediate(resolve));
  return { container, appended };
}

test("empty show list renders a useful empty state", async () => {
  const result = await runPage({
    ok: true,
    json: async () => []
  });
  assert.match(result.container.textContent, /No upcoming dates/);
  assert.equal(result.appended.length, 0);
});

test("future event renders a ticket link and Event structured data", async () => {
  const result = await runPage({
    ok: true,
    json: async () => [{
      name: "Doug Stanhope at Test Theatre",
      startDate: "2099-03-18T20:00:00-07:00",
      venue: "Test Theatre",
      ticketUrl: "https://tickets.example.test/event",
      status: "scheduled",
      location: {
        name: "Test Theatre",
        address: {
          addressLocality: "Test City",
          addressRegion: "CA",
          addressCountry: "US"
        }
      }
    }]
  });

  assert.match(result.container.innerHTML, /Test Theatre/);
  assert.match(result.container.innerHTML, /https:\/\/tickets\.example\.test\/event/);
  assert.equal(result.appended.length, 1);
  assert.equal(result.appended[0].type, "application/ld+json");
  const structured = JSON.parse(result.appended[0].textContent);
  assert.equal(structured[0]["@type"], "Event");
  assert.equal(structured[0].performer.name, "Doug Stanhope");
});

test("unsafe ticket URL is never rendered", async () => {
  const result = await runPage({
    ok: true,
    json: async () => [{
      name: "Unsafe event",
      startDate: "2099-03-18T20:00:00Z",
      ticketUrl: "javascript:alert(1)"
    }]
  });
  assert.match(result.container.textContent, /No upcoming dates/);
  assert.doesNotMatch(result.container.innerHTML, /javascript:/);
});

test("malformed show data displays a recoverable message", async () => {
  const result = await runPage({
    ok: true,
    json: async () => ({ not: "an array" })
  });
  assert.match(result.container.textContent, /temporarily unavailable/);
});

test("failed data request displays a recoverable message", async () => {
  const result = await runPage({
    ok: false,
    status: 404,
    json: async () => []
  });
  assert.match(result.container.textContent, /temporarily unavailable/);
});

test("date display preserves the venue calendar date across visitor time zones", async () => {
  const result = await runPage({
    ok: true,
    json: async () => [{
      name: "Late show",
      startDate: "2099-03-18T23:30:00-07:00",
      venue: "Late Show Venue",
      ticketUrl: "https://tickets.example.test/late-show",
      status: "scheduled"
    }]
  });
  assert.match(result.container.innerHTML, /Mar 18, 2099/);
});

test("date without an explicit timezone is rejected", async () => {
  const result = await runPage({
    ok: true,
    json: async () => [{
      name: "Ambiguous event",
      startDate: "2099-03-18T20:00:00",
      ticketUrl: "https://tickets.example.test/event"
    }]
  });
  assert.match(result.container.textContent, /No upcoming dates/);
});
