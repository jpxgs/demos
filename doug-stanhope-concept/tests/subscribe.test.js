"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/subscribe.js");

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    end(value) { this.body = value; return this; },
    json() { return JSON.parse(this.body); }
  };
}

test("GET reports that the provider is not configured without exposing secrets", async () => {
  const previousUrl = process.env.MAILING_LIST_WEBHOOK_URL;
  const previousToken = process.env.MAILING_LIST_WEBHOOK_TOKEN;
  delete process.env.MAILING_LIST_WEBHOOK_URL;
  process.env.MAILING_LIST_WEBHOOK_TOKEN = "must-not-be-returned";

  const res = responseRecorder();
  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { configured: false });
  assert.doesNotMatch(res.body, /must-not-be-returned/);

  if (previousUrl === undefined) delete process.env.MAILING_LIST_WEBHOOK_URL;
  else process.env.MAILING_LIST_WEBHOOK_URL = previousUrl;
  if (previousToken === undefined) delete process.env.MAILING_LIST_WEBHOOK_TOKEN;
  else process.env.MAILING_LIST_WEBHOOK_TOKEN = previousToken;
});

test("POST rejects invalid region and missing consent", async () => {
  const previousUrl = process.env.MAILING_LIST_WEBHOOK_URL;
  process.env.MAILING_LIST_WEBHOOK_URL = "https://webhook.example.test/signup";

  const invalidRegion = responseRecorder();
  await handler({
    method: "POST",
    body: { email: "fan@example.com", region: "Atlantis", consent: true }
  }, invalidRegion);
  assert.equal(invalidRegion.statusCode, 400);

  const noConsent = responseRecorder();
  await handler({
    method: "POST",
    body: { email: "fan@example.com", region: "Europe", consent: false }
  }, noConsent);
  assert.equal(noConsent.statusCode, 400);

  if (previousUrl === undefined) delete process.env.MAILING_LIST_WEBHOOK_URL;
  else process.env.MAILING_LIST_WEBHOOK_URL = previousUrl;
});

test("POST forwards validated email and region to the configured HTTPS webhook", async (t) => {
  const previousUrl = process.env.MAILING_LIST_WEBHOOK_URL;
  const previousToken = process.env.MAILING_LIST_WEBHOOK_TOKEN;
  process.env.MAILING_LIST_WEBHOOK_URL = "https://webhook.example.test/signup";
  process.env.MAILING_LIST_WEBHOOK_TOKEN = "test-secret";

  const originalFetch = globalThis.fetch;
  let received;
  globalThis.fetch = async (url, options) => {
    received = { url, options };
    return { ok: true, status: 200 };
  };

  try {
    const res = responseRecorder();
    await handler({
      method: "POST",
      body: {
        email: " Fan@Example.com ",
        region: "North America",
        consent: true,
        website: ""
      }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { ok: true });
    assert.equal(received.url, "https://webhook.example.test/signup");
    assert.equal(received.options.headers.Authorization, "Bearer test-secret");
    assert.deepEqual(JSON.parse(received.options.body), {
      email: "fan@example.com",
      region: "North America",
      consent: true,
      source: "Doug Stanhope website"
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.MAILING_LIST_WEBHOOK_URL;
    else process.env.MAILING_LIST_WEBHOOK_URL = previousUrl;
    if (previousToken === undefined) delete process.env.MAILING_LIST_WEBHOOK_TOKEN;
    else process.env.MAILING_LIST_WEBHOOK_TOKEN = previousToken;
  }
});

test("POST refuses non-HTTPS webhook configuration", async () => {
  const previousUrl = process.env.MAILING_LIST_WEBHOOK_URL;
  process.env.MAILING_LIST_WEBHOOK_URL = "http://webhook.example.test/signup";

  const res = responseRecorder();
  await handler({
    method: "POST",
    body: { email: "fan@example.com", region: "Europe", consent: true }
  }, res);

  assert.equal(res.statusCode, 500);
  if (previousUrl === undefined) delete process.env.MAILING_LIST_WEBHOOK_URL;
  else process.env.MAILING_LIST_WEBHOOK_URL = previousUrl;
});

test("POST returns a configuration error when no provider is connected", async () => {
  const previousUrl = process.env.MAILING_LIST_WEBHOOK_URL;
  delete process.env.MAILING_LIST_WEBHOOK_URL;

  const res = responseRecorder();
  await handler({
    method: "POST",
    body: { email: "fan@example.com", region: "Europe", consent: true }
  }, res);

  assert.equal(res.statusCode, 503);
  if (previousUrl === undefined) delete process.env.MAILING_LIST_WEBHOOK_URL;
  else process.env.MAILING_LIST_WEBHOOK_URL = previousUrl;
});
