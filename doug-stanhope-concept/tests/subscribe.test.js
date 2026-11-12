"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/subscribe.js");
const mailchimp = require("../api/mailchimp.js");

const ENV_KEYS = [
  "MAILCHIMP_API_KEY",
  "MAILCHIMP_SERVER_PREFIX",
  "MAILCHIMP_AUDIENCE_ID",
  "MAILCHIMP_REGION_MERGE_FIELD",
  "MAILCHIMP_STATUS_IF_NEW"
];

function saveEnv() {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(saved) {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function useTestConfig() {
  clearEnv();
  process.env.MAILCHIMP_API_KEY = "test-key-us7";
  process.env.MAILCHIMP_SERVER_PREFIX = "us7";
  process.env.MAILCHIMP_AUDIENCE_ID = "e2b49520e8";
}

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

const validBody = {
  email: " Fan@Example.com ",
  region: "North America",
  consent: true,
  website: ""
};

test("GET reports Mailchimp as unconfigured and does not leak secrets", async () => {
  const saved = saveEnv();
  clearEnv();
  process.env.MAILCHIMP_API_KEY = "must-not-be-returned-us7";
  const res = responseRecorder();
  await handler({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { configured: false });
  assert.doesNotMatch(res.body, /must-not-be-returned/);
  restoreEnv(saved);
});

test("GET reports the provider when the three Mailchimp variables are set", async () => {
  const saved = saveEnv();
  useTestConfig();
  const res = responseRecorder();
  await handler({ method: "GET" }, res);
  assert.deepEqual(res.json(), { configured: true, provider: "mailchimp" });
  assert.doesNotMatch(res.body, /test-key|e2b49520e8/);
  restoreEnv(saved);
});

test("POST rejects a bad email, an unknown region, and missing consent", async () => {
  const saved = saveEnv();
  useTestConfig();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("fetch should not be called"); };
  try {
    for (const body of [
      { email: "not-an-email", region: "Europe", consent: true },
      { email: "fan@example.com", region: "Atlantis", consent: true },
      { email: "fan@example.com", region: "Europe", consent: false }
    ]) {
      const res = responseRecorder();
      await handler({ method: "POST", body }, res);
      assert.equal(res.statusCode, 400, JSON.stringify(body));
    }
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
  }
});

test("POST upserts a member and maps region onto the configured merge field", async () => {
  const saved = saveEnv();
  useTestConfig();
  process.env.MAILCHIMP_REGION_MERGE_FIELD = "region";
  const originalFetch = globalThis.fetch;
  let received;
  globalThis.fetch = async (url, options) => {
    received = { url, options };
    return { ok: true, status: 200, json: async () => ({ status: "pending" }) };
  };
  try {
    const res = responseRecorder();
    await handler({ method: "POST", body: validBody }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.json().message, /confirm/i);
    const email = "fan@example.com";
    assert.equal(received.url, mailchimp.memberUrl(mailchimp.readConfig(process.env), email));
    assert.equal(received.options.method, "PUT");
    assert.equal(received.options.headers.Authorization, mailchimp.authorization(mailchimp.readConfig(process.env)));
    assert.deepEqual(JSON.parse(received.options.body), {
      email_address: email,
      status_if_new: "pending",
      merge_fields: { REGION: "North America" }
    });
    assert.doesNotMatch(res.body, /test-key/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
  }
});

test("an existing subscribed address is treated as success without a second subscribe call", async () => {
  const saved = saveEnv();
  useTestConfig();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: "subscribed" }) });
  try {
    const res = responseRecorder();
    await handler({ method: "POST", body: validBody }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.json().message, /on the list/i);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
  }
});

test("a removed address is not reported as a new signup", async () => {
  const saved = saveEnv();
  useTestConfig();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: "unsubscribed" }) });
  try {
    const res = responseRecorder();
    await handler({ method: "POST", body: validBody }, res);
    assert.equal(res.statusCode, 409);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
  }
});

test("a Mailchimp merge-field rejection stays generic", async () => {
  const saved = saveEnv();
  useTestConfig();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ title: "Invalid Resource", detail: "The merge field REGION was not found. fan@example.com" })
  });
  try {
    const res = responseRecorder();
    await handler({ method: "POST", body: validBody }, res);
    assert.equal(res.statusCode, 502);
    assert.match(res.json().message, /region field/i);
    assert.doesNotMatch(res.body, /fan@example.com/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
  }
});

test("the honeypot returns success and does not call Mailchimp", async () => {
  const saved = saveEnv();
  useTestConfig();
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return { ok: true, status: 200, json: async () => ({}) }; };
  try {
    const res = responseRecorder();
    await handler({ method: "POST", body: { ...validBody, website: "https://spam.test" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
  }
});

test("a mismatched key suffix is not treated as configured", async () => {
  const saved = saveEnv();
  useTestConfig();
  process.env.MAILCHIMP_SERVER_PREFIX = "us1";
  const res = responseRecorder();
  await handler({ method: "POST", body: validBody }, res);
  assert.equal(res.statusCode, 503);
  restoreEnv(saved);
});

test("POST returns 503 when Mailchimp is not configured", async () => {
  const saved = saveEnv();
  clearEnv();
  const res = responseRecorder();
  await handler({ method: "POST", body: validBody }, res);
  assert.equal(res.statusCode, 503);
  restoreEnv(saved);
});

test("live Mailchimp is contacted only when credentials are already present", async (t) => {
  const config = mailchimp.readConfig(process.env);
  if (!config.configured) {
    t.skip("MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, and MAILCHIMP_AUDIENCE_ID are not set. No live Mailchimp request was made.");
    return;
  }
  const response = await fetch("https://" + config.server + ".api.mailchimp.com/3.0/ping", {
    headers: { Authorization: mailchimp.authorization(config) }
  });
  assert.equal(response.status, 200);
});
