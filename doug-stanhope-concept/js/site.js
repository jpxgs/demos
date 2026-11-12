/*
 * Doug Stanhope website — show rendering
 * --------------------------------------
 * Upcoming show data lives in /data/shows.json.
 * This script only renders confirmed future shows with a safe ticket URL.
 * Complete event records also produce Schema.org Event structured data.
 */

(() => {
  "use strict";

  const container = document.querySelector("#upcoming-shows");
  if (!container) return;

  const showUnavailable = () => {
    container.textContent = "Show dates are temporarily unavailable. Please check back shortly.";
    container.classList.add("notice");
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  const safeHttpUrl = (value) => {
    try {
      const url = new URL(String(value));
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };

  const parseDate = (value) => {
    if (typeof value !== "string" || !value.trim()) return null;
    const isoWithOffset = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,3})?)?(?:Z|[+-]\\d{2}:\\d{2})$/i;
    if (!isoWithOffset.test(value)) return null;

    const calendarDate = new Date(value.slice(0, 10) + "T00:00:00Z");
    if (!Number.isFinite(calendarDate.getTime()) ||
        calendarDate.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      return null;
    }

    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
  };

  // Display the venue's calendar date, not the visitor's local date.
  const formatDate = (isoDate) => {
    const venueDate = new Date(isoDate.slice(0, 10) + "T12:00:00Z");
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(venueDate);
  };

  const isCompleteEvent = (event) =>
    Boolean(
      event.name &&
      parseDate(event.startDate) &&
      event.location?.name &&
      event.location?.address?.addressLocality &&
      event.location?.address?.addressCountry
    );

  const buildStructuredEvent = (event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location.name,
      address: {
        "@type": "PostalAddress",
        ...event.location.address
      }
    },
    performer: {
      "@type": "Person",
      name: "Doug Stanhope"
    },
    ...(safeHttpUrl(event.ticketUrl) ? {
      offers: {
        "@type": "Offer",
        url: safeHttpUrl(event.ticketUrl)
      }
    } : {})
  });

  const renderShow = (event) => {
    const venue = [
      event.venue || event.location?.name,
      event.location?.address?.addressLocality,
      event.location?.address?.addressRegion
    ].filter(Boolean).join(" — ");

    const ticketUrl = safeHttpUrl(event.ticketUrl);

    return `
      <article class="entry show-entry">
        <time class="meta" datetime="${escapeHtml(event.startDate)}">${escapeHtml(formatDate(event.startDate))}</time>
        <div>
          <p>${escapeHtml(venue || event.name)}</p>
          ${event.note ? `<p class="show-note">${escapeHtml(event.note)}</p>` : ""}
          <a class="ticket-link" href="${escapeHtml(ticketUrl)}" target="_blank" rel="noopener noreferrer">
            Tickets <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    `;
  };

  const loadShows = async () => {
    try {
      const response = await fetch("./data/shows.json", {
        headers: { Accept: "application/json" },
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error(`Show data request failed (${response.status}).`);
      }

      const events = await response.json();
      if (!Array.isArray(events)) {
        throw new TypeError("Show data must be a JSON array.");
      }

      const now = Date.now();
      const upcoming = events
        .filter((event) => {
          if (!event || typeof event !== "object") return false;
          const date = parseDate(event.startDate);
          return event.status !== "cancelled" &&
            date &&
            date.getTime() >= now &&
            safeHttpUrl(event.ticketUrl);
        })
        .sort((first, second) =>
          parseDate(first.startDate).getTime() - parseDate(second.startDate).getTime()
        );

      if (upcoming.length === 0) {
        container.textContent = "No upcoming dates are currently listed. Check back for announcements.";
        container.classList.add("notice");
        return;
      }

      container.innerHTML = upcoming.map(renderShow).join("");
      container.classList.remove("notice");

      const structuredEvents = upcoming
        .filter(isCompleteEvent)
        .map(buildStructuredEvent);

      if (structuredEvents.length > 0) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(structuredEvents);
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error("Unable to load upcoming show data:", error);
      showUnavailable();
    }
  };

  loadShows();
})();
