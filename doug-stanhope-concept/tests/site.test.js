"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const shows = require("../js/shows.js");

const SITE = "https://demostanhope.vercel.app/";
const NOW = Date.parse("2026-11-12T18:00:00Z");

function futureShow(overrides = {}) {
  return shows.prepare({
    id: "2099-01-15-test-theatre",
    name: "Doug Stanhope at Test Theatre",
    date: "2099-01-15",
    endDate: "2099-01-15",
    startTime: "20:00",
    endTime: "22:00",
    timezone: "America/Los_Angeles",
    venue: "Test Theatre",
    city: "Test City",
    region: "CA",
    country: "US",
    address: "123 Main Street",
    postalCode: "90000",
    ticketUrl: "https://tickets.example.test/event",
    status: "scheduled",
    notes: "Doors at 7.",
    ...overrides
  });
}

test("empty show list renders the mailing-list empty state", () => {
  const html = shows.renderUpcomingList([], NOW);
  assert.match(html, /No dates announced/);
  assert.match(html, /href="#list"/);
});

test("venue calendar date and winter offset are preserved", () => {
  const show = futureShow();
  assert.equal(shows.startIso(show), "2099-01-15T20:00:00-08:00");
  assert.equal(shows.startIso(futureShow({ date: "2099-07-15", endDate: "2099-07-15" })), "2099-07-15T20:00:00-07:00");
  assert.match(shows.formatWhen(show), /Jan 15, 2099/);
  assert.match(shows.formatWhen(show), /8:00 PM/);
});

test("a complete future show renders the same facts as its Event markup", () => {
  const show = futureShow();
  const html = shows.renderUpcoming(show);
  const event = shows.toEvent(show, SITE, NOW);
  assert.deepEqual(shows.validateEvent(event), []);
  assert.equal(event["@type"], "Event");
  assert.equal(event.name, show.name);
  assert.equal(event.startDate, "2099-01-15T20:00:00-08:00");
  assert.equal(event.endDate, "2099-01-15T22:00:00-08:00");
  assert.equal(event.eventStatus, "https://schema.org/EventScheduled");
  assert.equal(event.location["@type"], "Place");
  assert.equal(event.location.name, "Test Theatre");
  assert.equal(event.location.address["@type"], "PostalAddress");
  assert.equal(event.location.address.streetAddress, "123 Main Street");
  assert.equal(event.location.address.addressLocality, "Test City");
  assert.equal(event.location.address.addressRegion, "CA");
  assert.equal(event.location.address.postalCode, "90000");
  assert.equal(event.location.address.addressCountry, "US");
  assert.equal(event.offers.url, show.ticketUrl);
  assert.equal(event.offers.availability, "https://schema.org/InStock");
  assert.equal(event.url, event["@id"]);
  assert.match(event.url, /^https:\/\/demostanhope\.vercel\.app\/#show-/);
  for (const fact of ["Test Theatre", "Test City", "123 Main Street", "90000", "US", show.ticketUrl, "Scheduled", "Doors at 7."]) {
    assert.ok(html.includes(fact), fact);
  }
});

test("sold out, canceled, postponed, and missing tickets stay consistent", () => {
  const sold = futureShow({ id: "2099-01-16-test-theatre", status: "sold out" });
  const soldEvent = shows.toEvent(sold, SITE, NOW);
  assert.equal(soldEvent.offers.availability, "https://schema.org/SoldOut");
  assert.match(shows.renderUpcoming(sold), /Sold out/);

  const canceled = futureShow({ id: "2099-01-17-test-theatre", status: "cancelled" });
  const canceledEvent = shows.toEvent(canceled, SITE, NOW);
  assert.equal(canceled.status, "canceled");
  assert.equal(canceledEvent.eventStatus, "https://schema.org/EventCancelled");
  assert.equal(canceledEvent.offers.availability, undefined);
  assert.match(shows.renderUpcoming(canceled), /Canceled/);
  assert.match(shows.renderUpcoming(canceled), /tickets\.example\.test/);

  const postponed = futureShow({ id: "2099-01-18-test-theatre", status: "postponed" });
  assert.equal(shows.toEvent(postponed, SITE, NOW).eventStatus, "https://schema.org/EventPostponed");

  const unticketed = futureShow({ id: "2099-01-19-test-theatre", ticketUrl: "" });
  assert.equal(shows.toEvent(unticketed, SITE, NOW).offers, undefined);
  const html = shows.renderUpcoming(unticketed);
  assert.match(html, /No ticket link yet/);
  assert.doesNotMatch(html, /<a /);
});

test("unsafe ticket URLs and incomplete records are not published as events", () => {
  const unsafe = futureShow({ ticketUrl: "javascript:alert(1)" });
  assert.ok(shows.validateShow(unsafe).some((error) => /ticketUrl/.test(error)));
  assert.doesNotMatch(shows.renderUpcoming(unsafe), /javascript:/);
  assert.equal(shows.toEvent(unsafe, SITE, NOW).offers, undefined);

  const timeless = futureShow({ timezone: "", startTime: "20:00", endTime: "" });
  assert.equal(shows.startIso(timeless), "");
  assert.equal(shows.toEvent(timeless, SITE, NOW), null);
  assert.match(shows.renderUpcomingList([timeless], NOW), /Test Theatre/);

  const past = futureShow({ date: "2020-05-08", endDate: "", endTime: "" });
  assert.equal(shows.isUpcoming(past, NOW), false);
  assert.equal(shows.toEvent(past, SITE, NOW), null);
  assert.match(shows.renderArchive([past], NOW), /Test Theatre/);
  assert.doesNotMatch(shows.renderArchive([past], NOW), /Tickets/);
});

test("duplicate event ids are emitted once", () => {
  const show = futureShow();
  const graph = shows.buildEventGraph([show, { ...show }], SITE, NOW);
  assert.equal(graph.length, 1);
  assert.deepEqual(shows.validateEvent(graph[0]), []);
});

test("published show file validates and does not contain placeholder events", () => {
  const file = path.join(__dirname, "..", "data", "shows.json");
  const live = JSON.parse(fs.readFileSync(file, "utf8")).map(shows.prepare);
  const ids = new Set();
  assert.ok(live.length > 0);
  for (const show of live) {
    assert.deepEqual(shows.validateShow(show), [], show.id);
    assert.ok(!ids.has(show.id), show.id);
    ids.add(show.id);
    assert.doesNotMatch(JSON.stringify(show), /example\.test|Test Theatre|123 Main Street/i);
    if (show.ticketUrl) assert.ok(shows.safeHttpUrl(show.ticketUrl));
  }
  assert.ok(live.some((show) => show.id === "2026-05-08-eureka" && show.status === "sold out" && show.country === "US"));
  assert.ok(live.some((show) => show.city === "Perth" && show.country === "AU"));
  assert.ok(live.some((show) => show.city === "Seattle" && show.country === "US"));
  assert.ok(live.some((show) => show.city === "Bergen" && show.country === "Norway"));
  const graph = shows.buildEventGraph(live, SITE, NOW);
  assert.equal(graph.length, 0);
});
