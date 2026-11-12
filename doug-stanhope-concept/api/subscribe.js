/*
 * Server-side Mailchimp signup.
 *
 * Required environment variables:
 *   MAILCHIMP_API_KEY
 *   MAILCHIMP_SERVER_PREFIX
 *   MAILCHIMP_AUDIENCE_ID
 * Optional:
 *   MAILCHIMP_REGION_MERGE_FIELD  (default REGION)
 *   MAILCHIMP_STATUS_IF_NEW       (pending or subscribed; default pending)
 */
"use strict";

const mailchimp = require("./mailchimp");

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return typeof req.body === "object" ? req.body : {};
}

module.exports = async function handler(req, res) {
  const config = mailchimp.readConfig(process.env);

  if (req.method === "GET") {
    return send(res, 200, config.configured
      ? { configured: true, provider: "mailchimp" }
      : { configured: false });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { message: "Method not allowed." });
  }

  if (!config.configured) {
    return send(res, 503, { message: "The mailing list is not configured yet." });
  }

  const submission = mailchimp.validateSubmission(readBody(req));
  if (submission.honeypot) return send(res, 200, { ok: true });
  if (submission.error) return send(res, 400, { message: submission.error });

  try {
    const upstream = await fetch(mailchimp.memberUrl(config, submission.email), {
      method: "PUT",
      headers: {
        Authorization: mailchimp.authorization(config),
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(mailchimp.memberBody(config, submission.email, submission.region)),
      signal: AbortSignal.timeout(10000)
    });
    let payload = {};
    try {
      payload = await upstream.json();
    } catch {
      payload = {};
    }
    if (!upstream.ok) console.error("Mailchimp signup failed", upstream.status, payload && payload.title);
    const result = mailchimp.interpret(upstream.status, payload);
    return send(res, result.status, result.body);
  } catch (error) {
    console.error("Mailchimp signup request failed", error && error.name);
    return send(res, 502, { message: "The mailing list is temporarily unavailable." });
  }
};
