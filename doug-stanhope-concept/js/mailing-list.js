/*
 * Shows the signup form only after the server reports Mailchimp is configured.
 */
(() => {
  "use strict";

  const form = document.querySelector("#mailing-list-form");
  const fallback = document.querySelector("#signup-fallback");
  const status = document.querySelector("#signup-status");
  if (!form || !fallback || !status) return;

  const submitButton = form.querySelector('button[type="submit"]');

  const showFallback = () => {
    form.hidden = true;
    fallback.hidden = false;
  };

  fetch("./api/subscribe/", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("Signup configuration unavailable");
      return response.json();
    })
    .then((configuration) => {
      if (configuration.configured === true) {
        fallback.hidden = true;
        form.hidden = false;
      } else {
        showFallback();
      }
    })
    .catch(showFallback);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    if (String(values.get("website") || "").trim()) return;

    submitButton.disabled = true;
    submitButton.textContent = "Sending";

    try {
      const response = await fetch("./api/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: values.get("email"),
          region: values.get("region"),
          consent: values.get("consent") === "on",
          website: values.get("website")
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Signup could not be completed.");
      form.reset();
      status.textContent = result.message || "Thanks. Your signup has been received.";
    } catch (error) {
      status.textContent = error.message || "Signup is temporarily unavailable. Please try again later.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign up";
    }
  });
})();
