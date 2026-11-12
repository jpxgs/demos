/*
 * Editorial copy, podcast links, press, and footer links live in data/content.json.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StanhopeContent = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function showsApi() {
    if (typeof window !== "undefined" && window.StanhopeShows) return window.StanhopeShows;
    return require("./shows.js");
  }

  function safeImage(src) {
    return typeof src === "string" && /^assets\/press\/[A-Za-z0-9._-]+$/.test(src);
  }

  function linkItems(links) {
    const { escapeHtml, safeHttpUrl } = showsApi();
    return (Array.isArray(links) ? links : []).map((link) => {
      const href = safeHttpUrl(link && link.href);
      const label = link && link.label;
      if (!href || !label) return "";
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
    }).filter(Boolean).join("");
  }

  function paragraphs(items) {
    const { escapeHtml } = showsApi();
    return (Array.isArray(items) ? items : []).map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  }

  function renderHeadshots(headshots) {
    const { escapeHtml } = showsApi();
    const figures = (Array.isArray(headshots) ? headshots : []).map((shot) => {
      if (!shot || !shot.alt || !safeImage(shot.src)) return "";
      const width = Number.isFinite(Number(shot.width)) && Number(shot.width) > 0 ? ` width="${Number(shot.width)}"` : "";
      const height = Number.isFinite(Number(shot.height)) && Number(shot.height) > 0 ? ` height="${Number(shot.height)}"` : "";
      const credit = shot.credit ? `<figcaption>${escapeHtml(shot.credit)}</figcaption>` : "";
      return `<figure><img src="${escapeHtml(shot.src)}" alt="${escapeHtml(shot.alt)}"${width}${height}>${credit}</figure>`;
    }).join("");
    return figures || "<p>Approved headshots have not been added yet.</p>";
  }

  function renderEmbed(embed) {
    const { escapeHtml } = showsApi();
    if (!embed || !embed.src) return "";
    let url;
    try {
      url = new URL(embed.src);
    } catch {
      return "";
    }
    if (url.protocol !== "https:" || url.hostname !== "omny.fm") return "";
    const title = embed.title || "The Doug Stanhope Podcast";
    return `<div class="player"><iframe title="${escapeHtml(title)}" src="${escapeHtml(url.href)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  }

  function renderEpisodes(episodes) {
    const { escapeHtml, safeHttpUrl } = showsApi();
    return (Array.isArray(episodes) ? episodes : []).map((episode) => {
      if (!episode || !episode.title) return "";
      const href = episode.url ? safeHttpUrl(episode.url) : "";
      const title = href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(episode.title)}</a>`
        : escapeHtml(episode.title);
      const date = episode.date ? ` <span class="fine">(${escapeHtml(episode.date)})</span>` : "";
      const text = episode.text ? `<p>${escapeHtml(episode.text)}</p>` : "";
      return `<article class="episode"><p>${title}${date}</p>${text}</article>`;
    }).join("");
  }

  function renderCatalog(items) {
    const { escapeHtml } = showsApi();
    return (Array.isArray(items) ? items : []).map((item) => {
      if (!item || !item.title) return "";
      const detail = item.detail ? ` <span class="fine">(${escapeHtml(item.detail)})</span>` : "";
      return `<li>${escapeHtml(item.title)}${detail}</li>`;
    }).join("");
  }

  function renderPodcast(content) {
    const podcast = content.podcast || {};
    const links = linkItems(podcast.links);
    return [
      paragraphs(podcast.summary),
      links ? `<ul class="group">${links}</ul>` : "",
      renderEmbed(podcast.embed),
      paragraphs(podcast.notes),
      "<h3>Selected episodes</h3>",
      renderEpisodes(podcast.episodes)
    ].join("");
  }

  function renderBio(content) {
    return [
      paragraphs(content.bio),
      "<h3>Headshots</h3>",
      renderHeadshots(content.headshots)
    ].join("");
  }

  function renderPress(content) {
    const groups = Array.isArray(content.press) ? content.press : [];
    const press = groups.map((group) => {
      const links = linkItems(group.links);
      if (!group.heading || !links) return "";
      return `<h3>${showsApi().escapeHtml(group.heading)}</h3><ul>${links}</ul>`;
    }).join("");
    const recordings = renderCatalog(content.recordings);
    const books = renderCatalog(content.books);
    return [
      press,
      recordings ? `<h3>Recordings</h3><ul>${recordings}</ul>` : "",
      books ? `<h3>Books</h3><ul>${books}</ul>` : "",
      paragraphs(content.catalogNote)
    ].join("");
  }

  function renderArchiveIntro(content) {
    const archive = content.archive || {};
    const links = linkItems(archive.links);
    return paragraphs(archive.paragraphs) + (links ? `<ul>${links}</ul>` : "");
  }

  function renderFooter(content) {
    const contact = content.contact || {};
    const links = linkItems([].concat(contact.links || [], content.social || []));
    return paragraphs(contact.text ? [contact.text] : []) + (links ? `<ul>${links}</ul>` : "");
  }

  function personGraph(content) {
    const description = Array.isArray(content.bio) ? content.bio[0] : "";
    const sameAs = (Array.isArray(content.sameAs) ? content.sameAs : [])
      .map((href) => showsApi().safeHttpUrl(href))
      .filter(Boolean);
    const person = {
      "@type": "Person",
      name: "Doug Stanhope",
      url: showsApi().canonicalBase(content.siteUrl) + "/",
      description
    };
    if (sameAs.length) person.sameAs = sameAs;
    const shot = Array.isArray(content.headshots) ? content.headshots.find((item) => item && safeImage(item.src) && item.alt) : null;
    if (shot) person.image = showsApi().canonicalBase(content.siteUrl) + "/" + shot.src;
    return { "@context": "https://schema.org", "@graph": [person] };
  }

  function renderAll(content) {
    return {
      podcast: renderPodcast(content),
      bio: renderBio(content),
      press: renderPress(content),
      archive: renderArchiveIntro(content),
      footer: renderFooter(content),
      person: personGraph(content)
    };
  }

  return { safeImage, renderAll, personGraph };
});
