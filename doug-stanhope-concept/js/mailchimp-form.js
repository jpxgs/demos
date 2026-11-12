/*
 * Public Mailchimp embedded-form addresses.
 * These values are not secrets. They are the same ids a hosted form shows.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MailchimpForm = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function configOk(config) {
    return Boolean(
      config &&
      /^[a-z0-9]{2,10}$/.test(config.server || "") &&
      /^[a-zA-Z0-9]+$/.test(config.userId || "") &&
      /^[a-zA-Z0-9]+$/.test(config.audienceId || "") &&
      /^[A-Z0-9_]{1,10}$/.test(config.regionField || "")
    );
  }

  function postAction(config) {
    if (!configOk(config)) return "";
    return "https://" + config.server + ".list-manage.com/subscribe/post?u=" +
      config.userId + "&id=" + config.audienceId;
  }

  function hostedPage(config) {
    if (!configOk(config)) return "";
    return "https://" + config.server + ".list-manage.com/subscribe?u=" +
      config.userId + "&id=" + config.audienceId;
  }

  function botField(config) {
    if (!configOk(config)) return "";
    return "b_" + config.userId + "_" + config.audienceId;
  }

  function jsonpUrl(config, email, region) {
    if (!configOk(config)) return "";
    const params = new URLSearchParams({
      u: config.userId,
      id: config.audienceId,
      EMAIL: email
    });
    params.set(config.regionField, region);
    return "https://" + config.server + ".list-manage.com/subscribe/post-json?" + params.toString();
  }

  const REGION_REJECTION = "That signup did not go through. The mailing list does not have a region field yet, so it rejected the form. It needs a text field tagged REGION.";
  const MODE_STATUS = {
    preview: "Preview copy: signup is not sent. On the live site this goes to the mailing list.",
    off: "Signups are turned off on this copy."
  };

  function signupMode(site) {
    const mode = site && site.signupMode;
    return mode === "preview" || mode === "off" ? mode : "live";
  }

  function plainMessage(value) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function regionRejected(text) {
    return /region|merge\s*field|merge_field|mmerge\d+/i.test(plainMessage(text));
  }

  function visitorMessage(data) {
    const text = plainMessage(data && data.msg);
    if (data && data.result === "success") return text || "Check your email to confirm the signup.";
    if (regionRejected(text)) return REGION_REJECTION;
    return text || "The mailing list did not accept the signup.";
  }

  return {
    configOk,
    postAction,
    hostedPage,
    botField,
    jsonpUrl,
    signupMode,
    regionRejected,
    visitorMessage,
    REGION_REJECTION,
    MODE_STATUS
  };
});
