/*
 * Loads show and editorial data, then fills the single page.
 */
(() => {
  "use strict";

  const showsApi = window.StanhopeShows;
  const contentApi = window.StanhopeContent;
  const dates = document.querySelector("#upcoming-shows");
  const past = document.querySelector("#past-shows");

  const unavailable = (node, message) => {
    if (node) node.textContent = message;
  };

  const replaceJsonLd = (id, data) => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    if (!data) return;
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  };

  if (dates && showsApi) {
    fetch("./data/shows.json", { headers: { Accept: "application/json" }, cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Show data request failed");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Show data must be an array");
        const shows = data.map(showsApi.prepare).filter(Boolean);
        const now = Date.now();
        dates.innerHTML = showsApi.renderUpcomingList(shows, now);
        if (past) past.innerHTML = showsApi.renderArchive(shows, now);
        const canonical = document.querySelector('link[rel="canonical"]');
        const siteUrl = canonical ? canonical.href : window.location.origin;
        const graph = showsApi.buildEventGraph(shows, siteUrl, now);
        replaceJsonLd("event-jsonld", graph.length ? { "@context": "https://schema.org", "@graph": graph } : null);
      })
      .catch(() => {
        unavailable(dates, "Show dates are temporarily unavailable. Please check back shortly.");
      })
      .finally(() => {
        document.dispatchEvent(new Event("archive:ready"));
      });
  }

  if (contentApi) {
    fetch("./data/content.json", { headers: { Accept: "application/json" }, cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Content request failed");
        return response.json();
      })
      .then((content) => {
        const rendered = contentApi.renderAll(content);
        const mounts = {
          "podcast-body": rendered.podcast,
          "bio-body": rendered.bio,
          "press-body": rendered.press,
          "archive-intro": rendered.archive,
          "footer-body": rendered.footer
        };
        Object.entries(mounts).forEach(([id, html]) => {
          const node = document.getElementById(id);
          if (node) node.innerHTML = html;
        });
        replaceJsonLd("profile-jsonld", rendered.person);
      })
      .catch(() => {
        ["podcast-body", "bio-body", "press-body", "archive-intro", "footer-body"].forEach((id) => {
          unavailable(document.getElementById(id), "This section is temporarily unavailable.");
        });
      });
  }
})();
