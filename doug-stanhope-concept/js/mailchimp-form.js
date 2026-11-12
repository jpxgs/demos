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

  return { configOk, postAction, hostedPage, botField, jsonpUrl };
});
