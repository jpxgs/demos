/*
 * Show records in data/shows.json are the only source for dates.
 * Times are converted with the venue timezone so the calendar date
 * does not shift for a visitor in another zone.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StanhopeShows = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const STATUSES = ["scheduled", "sold out", "canceled", "postponed"];
  const STATUS_LABELS = {
    scheduled: "Scheduled",
    "sold out": "Sold out",
    canceled: "Canceled",
    postponed: "Postponed"
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value));
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function isIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const [year, month, day] = value.split("-").map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
  }

  function isTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
  }

  function normalizeStatus(value) {
    const status = String(value || "").trim().toLowerCase();
    return status === "cancelled" ? "canceled" : status;
  }

  function zoneOffsetMinutes(instant, timeZone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = {};
    for (const part of formatter.formatToParts(instant)) {
      if (part.type !== "literal") parts[part.type] = part.value;
    }
    const hour = parts.hour === "24" ? 0 : Number(parts.hour);
    const zonedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      hour,
      Number(parts.minute),
      Number(parts.second)
    );
    return Math.round((zonedAsUtc - instant.getTime()) / 60000);
  }

  function formatOffset(minutes) {
    const sign = minutes >= 0 ? "+" : "-";
    const absolute = Math.abs(minutes);
    const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
    const mins = String(absolute % 60).padStart(2, "0");
    return sign + hours + ":" + mins;
  }

  function zonedIso(date, time, timeZone) {
    if (!isIsoDate(date) || !isTime(time) || !timeZone) return "";
    try {
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = time.split(":").map(Number);
      const wallClockAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
      let offset = zoneOffsetMinutes(wallClockAsUtc, timeZone);
      let instant = new Date(wallClockAsUtc.getTime() - offset * 60000);
      offset = zoneOffsetMinutes(instant, timeZone);
      instant = new Date(wallClockAsUtc.getTime() - offset * 60000);
      if (zoneOffsetMinutes(instant, timeZone) !== offset) return "";
      return date + "T" + time + ":00" + formatOffset(offset);
    } catch {
      return "";
    }
  }

  function prepare(raw) {
    if (!raw || typeof raw !== "object") return null;
    return {
      id: String(raw.id || "").trim(),
      name: String(raw.name || "").trim(),
      date: String(raw.date || "").trim(),
      endDate: String(raw.endDate || "").trim(),
      displayDate: String(raw.displayDate || "").trim(),
      startTime: String(raw.startTime || "").trim(),
      endTime: String(raw.endTime || "").trim(),
      timezone: String(raw.timezone || "").trim(),
      venue: String(raw.venue || "").trim(),
      city: String(raw.city || "").trim(),
      region: String(raw.region || "").trim(),
      country: String(raw.country || "").trim(),
      address: String(raw.address || "").trim(),
      postalCode: String(raw.postalCode || "").trim(),
      ticketUrl: String(raw.ticketUrl || "").trim(),
      status: normalizeStatus(raw.status),
      notes: String(raw.notes || "").trim()
    };
  }

  function validateShow(show) {
    const errors = [];
    if (!show) return ["Show is missing."];
    if (!/^[a-z0-9-]{1,80}$/.test(show.id || "")) errors.push("id must be a short slug");
    if (!show.name) errors.push("name is required");
    if (!isIsoDate(show.date)) errors.push("date must be YYYY-MM-DD");
    if (show.endDate && !isIsoDate(show.endDate)) errors.push("endDate must be YYYY-MM-DD");
    if (show.endDate && show.date && show.endDate < show.date) errors.push("endDate is before date");
    if (show.startTime && !isTime(show.startTime)) errors.push("startTime must be HH:MM");
    if (show.endTime && !isTime(show.endTime)) errors.push("endTime must be HH:MM");
    if ((show.startTime || show.endTime) && !show.timezone) errors.push("timezone is required when a time is set");
    if (show.timezone && !zonedIso(show.date || "2026-01-01", "12:00", show.timezone) && show.date) {
      errors.push("timezone is not recognized");
    }
    if (!STATUSES.includes(show.status)) errors.push("status must be scheduled, sold out, canceled, or postponed");
    if (show.ticketUrl && !safeHttpUrl(show.ticketUrl)) errors.push("ticketUrl must be an http(s) URL");
    return errors;
  }

  function startIso(show) {
    return zonedIso(show.date, show.startTime, show.timezone);
  }

  function endIso(show) {
    return zonedIso(show.endDate, show.endTime, show.timezone);
  }

  function instantMs(show) {
    const iso = startIso(show);
    if (iso) {
      const value = Date.parse(iso);
      return Number.isFinite(value) ? value : NaN;
    }
    if (!isIsoDate(show.date)) return NaN;
    const [year, month, day] = show.date.split("-").map(Number);
    return Date.UTC(year, month - 1, day, 23, 59, 59);
  }

  function isUpcoming(show, now) {
    const value = instantMs(show);
    return Number.isFinite(value) && value >= now;
  }

  function formatDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  }

  function formatWhen(show) {
    if (show.displayDate && isIsoDate(show.date)) {
      return show.displayDate + ", " + show.date.slice(0, 4);
    }
    if (!isIsoDate(show.date)) return "";
    const dateLabel = formatDate(show.date);
    const iso = startIso(show);
    if (!iso) return dateLabel;
    const timeLabel = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: show.timezone
    }).format(new Date(iso));
    return dateLabel + ", " + timeLabel;
  }

  function locationText(show) {
    const cityLine = [show.city, show.region].filter(Boolean).join(", ");
    const cityAndCode = [cityLine, show.postalCode].filter(Boolean).join(" ");
    return [show.venue, show.address, cityAndCode, show.country].filter(Boolean).join(", ");
  }

  function canonicalBase(siteUrl) {
    try {
      return new URL(String(siteUrl)).origin;
    } catch {
      return String(siteUrl || "").replace(/\/+$/, "");
    }
  }

  function eventStatusUrl(status) {
    if (status === "canceled") return "https://schema.org/EventCancelled";
    if (status === "postponed") return "https://schema.org/EventPostponed";
    if (status === "scheduled" || status === "sold out") return "https://schema.org/EventScheduled";
    return "";
  }

  function toEvent(show, siteUrl, now) {
    const status = normalizeStatus(show.status);
    const iso = startIso(show);
    const statusUrl = eventStatusUrl(status);
    if (!isUpcoming(show, now) || !show.name || !show.venue || !show.city || !show.country || !iso || !statusUrl) {
      return null;
    }
    const page = canonicalBase(siteUrl);
    const url = page + "/#show-" + show.id;
    const address = { "@type": "PostalAddress", addressLocality: show.city, addressCountry: show.country };
    if (show.address) address.streetAddress = show.address;
    if (show.region) address.addressRegion = show.region;
    if (show.postalCode) address.postalCode = show.postalCode;
    const event = {
      "@type": "Event",
      "@id": url,
      name: show.name,
      startDate: iso,
      eventStatus: statusUrl,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url,
      location: {
        "@type": "Place",
        name: show.venue,
        address
      },
      performer: {
        "@type": "Person",
        name: "Doug Stanhope"
      }
    };
    const ending = endIso(show);
    if (ending) event.endDate = ending;
    const ticket = safeHttpUrl(show.ticketUrl);
    if (ticket) {
      event.offers = { "@type": "Offer", url: ticket };
      if (status === "scheduled") event.offers.availability = "https://schema.org/InStock";
      if (status === "sold out") event.offers.availability = "https://schema.org/SoldOut";
    }
    return event;
  }

  function buildEventGraph(shows, siteUrl, now) {
    const seen = new Set();
    const graph = [];
    for (const show of shows) {
      const event = toEvent(show, siteUrl, now);
      if (!event || seen.has(event["@id"])) continue;
      seen.add(event["@id"]);
      graph.push(event);
    }
    return graph;
  }

  function validateEvent(event) {
    const errors = [];
    if (!event || event["@type"] !== "Event") errors.push("@type must be Event");
    if (!event || !event["@id"] || event.url !== event["@id"]) errors.push("url and @id must match");
    if (!event || !event.name) errors.push("name is required");
    if (!event || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(event.startDate || "")) {
      errors.push("startDate must include a timezone offset");
    }
    if (event && event.endDate && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(event.endDate)) {
      errors.push("endDate must include a timezone offset");
    }
    if (event && event.startDate && event.endDate && event.endDate < event.startDate) {
      errors.push("endDate is before startDate");
    }
    const allowedStatus = ["EventScheduled", "EventCancelled", "EventPostponed"];
    if (!event || !allowedStatus.some((name) => String(event.eventStatus || "").endsWith("/" + name))) {
      errors.push("eventStatus is missing");
    }
    if (!event || event.eventAttendanceMode !== "https://schema.org/OfflineEventAttendanceMode") {
      errors.push("eventAttendanceMode is missing");
    }
    const place = event && event.location;
    if (!place || place["@type"] !== "Place" || !place.name) errors.push("location must be a Place");
    const address = place && place.address;
    if (!address || address["@type"] !== "PostalAddress" || !address.addressLocality || !address.addressCountry) {
      errors.push("PostalAddress needs a city and country");
    }
    if (!event || !event.performer || event.performer.name !== "Doug Stanhope") errors.push("performer is missing");
    if (event && event.offers) {
      if (event.offers["@type"] !== "Offer" || !safeHttpUrl(event.offers.url)) errors.push("offer URL is invalid");
      if (event.offers.availability && !/^https:\/\/schema\.org\/(InStock|SoldOut)$/.test(event.offers.availability)) {
        errors.push("offer availability is invalid");
      }
    }
    return errors;
  }

  function partition(shows, now) {
    const upcoming = [];
    const past = [];
    for (const show of shows) {
      if (!show || !isIsoDate(show.date)) continue;
      (isUpcoming(show, now) ? upcoming : past).push(show);
    }
    upcoming.sort((first, second) => instantMs(first) - instantMs(second) || first.id.localeCompare(second.id));
    past.sort((first, second) => instantMs(second) - instantMs(first) || first.id.localeCompare(second.id));
    return { upcoming, past };
  }

  function renderUpcoming(show) {
    const iso = startIso(show) || show.date;
    const ticket = safeHttpUrl(show.ticketUrl);
    const ticketHtml = ticket
      ? `<a href="${escapeHtml(ticket)}">Tickets</a>`
      : "<span>No ticket link yet</span>";
    const notes = show.notes ? `<p class="note">${escapeHtml(show.notes)}</p>` : "";
    return `<article class="show" id="show-${escapeHtml(show.id)}">
      <p class="show-line"><time datetime="${escapeHtml(iso)}">${escapeHtml(formatWhen(show))}</time> ${ticketHtml}</p>
      <p>${escapeHtml(show.name)}</p>
      <p>${escapeHtml(locationText(show))}</p>
      <p>${escapeHtml(STATUS_LABELS[show.status] || show.status)}</p>
      ${notes}
    </article>`;
  }

  function renderUpcomingList(shows, now) {
    const { upcoming } = partition(shows, now);
    if (upcoming.length === 0) {
      return '<p class="empty">No dates announced. <a href="#list">Join the list</a> for news.</p>';
    }
    return upcoming.map(renderUpcoming).join("");
  }

  function renderArchiveItem(show) {
    const place = [show.city, show.region].filter(Boolean).join(", ");
    const status = show.status === "scheduled" ? "" : STATUS_LABELS[show.status];
    const bits = [place, show.venue, status, show.notes].filter(Boolean);
    const detail = bits.length ? " — " + escapeHtml(bits.join(" — ")) : "";
    return `<article class="entry"><p><time datetime="${escapeHtml(show.date)}">${escapeHtml(formatWhen(show))}</time>${detail}</p></article>`;
  }

  function renderArchive(shows, now) {
    const { past } = partition(shows, now);
    const groups = [];
    for (const show of past) {
      const year = show.date.slice(0, 4);
      let group = groups.find((item) => item.year === year);
      if (!group) {
        group = { year, shows: [] };
        groups.push(group);
      }
      group.shows.push(show);
    }
    return groups.map((group) => {
      return `<section class="archive-year" data-year="${group.year}"><h3>${group.year}</h3>${group.shows.map(renderArchiveItem).join("")}</section>`;
    }).join("");
  }

  return {
    STATUSES,
    escapeHtml,
    safeHttpUrl,
    prepare,
    validateShow,
    startIso,
    isUpcoming,
    formatWhen,
    locationText,
    canonicalBase,
    toEvent,
    buildEventGraph,
    validateEvent,
    partition,
    renderUpcoming,
    renderUpcomingList,
    renderArchive
  };
});
