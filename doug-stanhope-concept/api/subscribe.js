/*
 * Provider-neutral mailing-list webhook adapter.
 *
 * Configure MAILING_LIST_WEBHOOK_URL in the Vercel project environment.
 * Optionally configure MAILING_LIST_WEBHOOK_TOKEN for Bearer authentication.
 * The webhook receives JSON: { email, region, consent, source }.
 *
 * The webhook URL and token remain server-side; neither is exposed to visitors.
 */

const ALLOWED_REGIONS = new Set([
  "North America",
  "UK and Ireland",
  "Europe",
  "Australia and New Zealand",
  "Asia",
  "Other"
]);

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return send(res, 200, {
      configured: Boolean(process.env.MAILING_LIST_WEBHOOK_URL)
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { message: "Method not allowed." });
  }

  const endpoint = process.env.MAILING_LIST_WEBHOOK_URL;
  if (!endpoint) {
    return send(res, 503, { message: "The mailing list is not configured yet." });
  }

  let destination;
  try {
    destination = new URL(endpoint);
  } catch {
    return send(res, 500, { message: "The mailing-list endpoint is misconfigured." });
  }

  if (destination.protocol !== "https:") {
    return send(res, 500, { message: "The mailing-list endpoint must use HTTPS." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (String(body.website || "").trim()) {
    return send(res, 200, { ok: true });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const region = String(body.region || "");
  const consent = body.consent === true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return send(res, 400, { message: "Enter a valid email address." });
  }
  if (!ALLOWED_REGIONS.has(region)) {
    return send(res, 400, { message: "Choose a region." });
  }
  if (!consent) {
    return send(res, 400, { message: "Consent is required to subscribe." });
  }

  try {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (process.env.MAILING_LIST_WEBHOOK_TOKEN) {
      headers.Authorization = "Bearer " + process.env.MAILING_LIST_WEBHOOK_TOKEN;
    }

    const upstream = await fetch(destination.href, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        region,
        consent: true,
        source: "Doug Stanhope website"
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!upstream.ok) {
      return send(res, 502, { message: "The mailing-list provider did not accept the signup." });
    }

    return send(res, 200, { ok: true });
  } catch (error) {
    console.error("Mailing-list provider request failed:", error.message);
    return send(res, 502, { message: "The mailing-list provider is temporarily unavailable." });
  }
};
