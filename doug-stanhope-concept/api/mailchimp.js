/*
 * Mailchimp Marketing API helpers. The API key never leaves the server.
 * Members are upserted with PUT so a second signup updates the region
 * instead of failing as a duplicate.
 */
"use strict";

const crypto = require("crypto");

const REGIONS = [
  "North America",
  "UK and Ireland",
  "Europe",
  "Australia and New Zealand",
  "Asia",
  "Other"
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readConfig(env) {
  const source = env || {};
  const apiKey = String(source.MAILCHIMP_API_KEY || "").trim();
  const server = String(source.MAILCHIMP_SERVER_PREFIX || "").trim().toLowerCase();
  const audienceId = String(source.MAILCHIMP_AUDIENCE_ID || "").trim();
  const regionField = String(source.MAILCHIMP_REGION_MERGE_FIELD || "REGION").trim().toUpperCase();
  const statusIfNew = String(source.MAILCHIMP_STATUS_IF_NEW || "pending").trim().toLowerCase();
  const keyServer = ((apiKey.match(/-([a-z0-9]+)$/i) || [])[1] || "").toLowerCase();
  const serverOk = /^[a-z0-9]{2,10}$/.test(server);
  const audienceOk = /^[A-Za-z0-9]+$/.test(audienceId);
  const fieldOk = /^[A-Z0-9_]{1,10}$/.test(regionField);
  const statusOk = statusIfNew === "pending" || statusIfNew === "subscribed";
  const suffixOk = Boolean(apiKey) && keyServer === server;
  const configured = Boolean(apiKey && serverOk && audienceOk && fieldOk && statusOk && suffixOk);
  return {
    apiKey,
    server,
    audienceId,
    regionField,
    statusIfNew,
    configured,
    serverOk,
    audienceOk,
    fieldOk,
    statusOk,
    suffixOk
  };
}

function subscriberHash(email) {
  return crypto.createHash("md5").update(email).digest("hex");
}

function memberUrl(config, email) {
  return "https://" + config.server + ".api.mailchimp.com/3.0/lists/" +
    config.audienceId + "/members/" + subscriberHash(email);
}

function authorization(config) {
  return "Basic " + Buffer.from("anystring:" + config.apiKey).toString("base64");
}

function memberBody(config, email, region) {
  return {
    email_address: email,
    status_if_new: config.statusIfNew,
    merge_fields: {
      [config.regionField]: region
    }
  };
}

function validateSubmission(body) {
  const source = body && typeof body === "object" ? body : {};
  if (String(source.website || "").trim()) return { honeypot: true };
  const email = String(source.email || "").trim().toLowerCase();
  const region = String(source.region || "");
  if (!EMAIL.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (!REGIONS.includes(region)) return { error: "Choose a region." };
  if (source.consent !== true) return { error: "Consent is required to subscribe." };
  return { email, region };
}

function interpret(status, payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const detail = String(data.title || "") + " " + String(data.detail || "");
  if (status === 200) {
    if (data.status === "pending") {
      return { status: 200, body: { ok: true, message: "Check your email to confirm the signup." } };
    }
    if (data.status === "subscribed") {
      return { status: 200, body: { ok: true, message: "You're on the list." } };
    }
    if (data.status === "unsubscribed" || data.status === "cleaned" || data.status === "archived") {
      return {
        status: 409,
        body: { message: "This address was not subscribed. It may have been removed from the list." }
      };
    }
    return { status: 200, body: { ok: true, message: "The signup was accepted." } };
  }
  if (status === 400 && /merge field|invalid resource/i.test(detail)) {
    return {
      status: 502,
      body: { message: "The mailing list rejected the region field. It may need to be created in Mailchimp." }
    };
  }
  if (status === 401 || status === 403) {
    return { status: 502, body: { message: "The mailing list credentials were rejected." } };
  }
  return { status: 502, body: { message: "The mailing list did not accept the signup." } };
}

module.exports = {
  REGIONS,
  readConfig,
  subscriberHash,
  memberUrl,
  authorization,
  memberBody,
  validateSubmission,
  interpret
};
