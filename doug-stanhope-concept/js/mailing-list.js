/*
 * The form posts straight to Mailchimp's embedded endpoint.
 * Script asks Mailchimp for an in-page result. Without script, the browser submits the form.
 */
(() => {
  "use strict";

  const form = document.querySelector("#mailing-list-form");
  const status = document.querySelector("#signup-status");
  const helper = window.MailchimpForm;
  if (!form || !status || !helper) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const bot = form.querySelector('input[name^="b_"]');

  function sendJsonp(baseUrl) {
    return new Promise((resolve, reject) => {
      const callbackName = "mc_cb_" + Date.now();
      const script = document.createElement("script");
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("timeout"));
      }, 10000);
      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      }
      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error("network"));
      };
      script.src = baseUrl + "&c=" + callbackName;
      document.body.appendChild(script);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;
    if (bot && String(bot.value || "").trim()) return;

    const fields = new FormData(form);
    const email = String(fields.get("EMAIL") || "").trim();
    const region = String(fields.get("REGION") || "");
    let config = null;
    try {
      const response = await fetch("data/site.json", { headers: { Accept: "application/json" }, cache: "no-cache" });
      if (response.ok) {
        const site = await response.json();
        const mode = helper.signupMode(site);
        if (mode !== "live") {
          status.textContent = helper.MODE_STATUS[mode];
          return;
        }
        config = site.mailchimp;
      }
    } catch {
      config = null;
    }

    const url = config ? helper.jsonpUrl(config, email, region) : "";
    if (!url) {
      form.submit();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending";
    try {
      const data = await sendJsonp(url);
      status.textContent = helper.visitorMessage(data);
      if (data && data.result === "success") form.reset();
    } catch {
      status.textContent = "Sending you on to the mailing list.";
      window.setTimeout(() => form.submit(), 300);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign up";
    }
  });
})();
