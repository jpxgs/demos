/*
 * Doug Stanhope website
 * ---------------------
 * This file renders upcoming tour dates from /data/shows.json.
 *
 * To add a show:
 * 1. Open data/shows.json.
 * 2. Add one event object using the field guide in README.md.
 * 3. Include a real ticket URL and a complete venue address.
 * 4. Commit the JSON file. The page and Event structured data update together.
 *
 * No show data is hard-coded here. Keep editorial content in index.html and
 * frequently updated show data in the JSON file.
 */
(async function renderUpcomingShows() {
  const container = document.querySelector("#upcoming-shows");
  if (!container) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const dateLabel = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric", timeZone: "UTC"
    }).format(date);
  };

  try {
    const response = await fetch("/data/shows.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Show data could not be loaded.");
    const events = await response.json();
    const now = new Date();
    const upcoming = events
      .filter((event) => event.status !== "cancelled" && new Date(event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (!upcoming.length) {
      container.innerHTML = '<p class="notice">No upcoming dates are currently listed. Check back for announcements.</p>';
      return;
    }

    container.innerHTML = upcoming.map((event) => {
      const venue = [event.venue, event.location?.address?.addressLocality,
        event.location?.address?.addressRegion].filter(Boolean).join(" — ");
      const ticket = event.ticketUrl
        ? '<a class="ticket-link" href="' + escapeHtml(event.ticketUrl) + '" target="_blank" rel="noopener noreferrer">Tickets <span aria-hidden="true">↗</span></a>'
        : '<span class="meta">Ticket link pending</span>';

      return '<article class="entry show-entry">' +
        '<time class="meta" datetime="' + escapeHtml(event.startDate) + '">' +
        escapeHtml(dateLabel(event.startDate)) + '</time>' +
        '<div><p>' + escapeHtml(venue) + '</p>' +
        (event.note ? '<p class="show-note">' + escapeHtml(event.note) + '</p>' : '') +
        ticket + '</div></article>';
    }).join("");

    // Emit Schema.org Event data only for confirmed events with required details.
    const structuredEvents = upcoming
      .filter((event) => event.name && event.startDate && event.location?.name &&
        event.location?.address?.addressLocality && event.location?.address?.addressCountry)
      .map((event) => ({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.name,
        "startDate": event.startDate,
        ...(event.endDate ? { "endDate": event.endDate } : {}),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": event.location.name,
          "address": {
            "@type": "PostalAddress",
            ...event.location.address
          }
        },
        "performer": { "@type": "Person", "name": "Doug Stanhope" },
        ...(event.ticketUrl ? {
          "offers": {
            "@type": "Offer",
            "url": event.ticketUrl,
            "availability": "https://schema.org/InStock"
          }
        } : {})
      }));

    if (structuredEvents.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredEvents);
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error("Upcoming dates:", error);
    container.innerHTML = '<p class="notice">Show dates are temporarily unavailable. Please check back shortly.</p>';
  }
})();
