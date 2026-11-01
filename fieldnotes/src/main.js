import { records } from "./records.js";

const STORAGE_KEY = "fieldnotes.saved.v1";
const TYPE_LABELS = { talk: "SELECTED TALK", opsec: "OPSEC / SECURITY", value: "DEEP VALUE" };
const state = { filter: "all", query: "", saved: loadSaved() };

const library = document.querySelector("#library");
const searchInput = document.querySelector("#search");
const emptyState = document.querySelector("#empty-state");
const resultCount = document.querySelector("#result-count");
const player = document.querySelector("#player");
const playerFrame = document.querySelector("#player-frame");

function loadSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function persistSaved() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.saved]));
  } catch {
    // Saving is a convenience; the library remains usable when storage is unavailable.
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function searchableText(record) {
  return [record.title, record.creator, record.year, record.venue, record.description, record.type]
    .filter(Boolean).join(" ").toLowerCase();
}

function getVisibleRecords() {
  const query = state.query.trim().toLowerCase();
  return records.filter((record) => {
    const matchesFilter = state.filter === "all"
      || (state.filter === "saved" ? state.saved.has(record.id) : record.type === state.filter);
    return matchesFilter && (!query || searchableText(record).includes(query));
  });
}

function recordAction(record) {
  if (record.videoId) return '<button class="record-action" data-action="play">WATCH FILM ↗</button>';
  const firstLink = record.links?.[0];
  if (!firstLink) return '<span class="record-action">REFERENCE ONLY</span>';
  return `<a class="record-action" href="${escapeHTML(firstLink.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(firstLink.label)} ↗</a>`;
}

function renderRecord(record, index) {
  const isSaved = state.saved.has(record.id);
  return `
    <article class="record" data-id="${escapeHTML(record.id)}">
      <div class="record-top">
        <span class="record-type">${TYPE_LABELS[record.type]}</span>
        <span class="record-number">FN / ${String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3>${escapeHTML(record.title)}</h3>
      <p class="record-meta">${escapeHTML(record.creator)} <span class="red">·</span> ${escapeHTML(record.year)} ${record.venue ? "· " + escapeHTML(record.venue) : ""}</p>
      <p class="record-description">${escapeHTML(record.description)}</p>
      <div class="record-bottom">
        ${recordAction(record)}
        <button class="save-button" data-action="save" aria-label="${isSaved ? "Remove from saved" : "Save"} ${escapeHTML(record.title)}" aria-pressed="${isSaved}">${isSaved ? "★" : "☆"}</button>
      </div>
    </article>`;
}

function render() {
  const visible = getVisibleRecords();
  library.innerHTML = visible.map(renderRecord).join("");
  resultCount.textContent = String(visible.length).padStart(2, "0");
  emptyState.hidden = visible.length !== 0;
  document.querySelector("#count-all").textContent = records.length;
  document.querySelector("#count-talk").textContent = records.filter((item) => item.type === "talk").length;
  document.querySelector("#count-opsec").textContent = records.filter((item) => item.type === "opsec").length;
  document.querySelector("#count-value").textContent = records.filter((item) => item.type === "value").length;
  document.querySelector("#count-saved").textContent = state.saved.size;
  document.querySelectorAll(".filter").forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function openPlayer(record) {
  const iframe = document.createElement("iframe");
  const params = new URLSearchParams({
    autoplay: "1",
    enablejsapi: "1",
    playsinline: "1",
    rel: "0",
    origin: window.location.origin
  });
  iframe.title = record.title;
  iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(record.videoId)}?${params}`;
  iframe.addEventListener("load", () => {
    window.setTimeout(() => {
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: "command", func: "setVolume", args: [50]
      }), "https://www.youtube-nocookie.com");
    }, 900);
  }, { once: true });

  playerFrame.replaceChildren(iframe);
  document.querySelector("#player-title").textContent = record.title;
  document.querySelector("#player-meta").textContent = `${record.creator} · ${record.year} · ${record.venue || "Talk"}`;
  if (!player.open) player.showModal();
}

function closePlayer() {
  playerFrame.replaceChildren();
  if (player.open) player.close();
}

library.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest("[data-id]");
  const record = records.find((item) => item.id === card?.dataset.id);
  if (!record) return;

  if (button.dataset.action === "save") {
    if (state.saved.has(record.id)) state.saved.delete(record.id);
    else state.saved.add(record.id);
    persistSaved();
    render();
  }
  if (button.dataset.action === "play" && record.videoId) openPlayer(record);
});

document.querySelector(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  render();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

document.querySelector("#close-player").addEventListener("click", closePlayer);
player.addEventListener("click", (event) => {
  if (event.target === player) closePlayer();
});
player.addEventListener("close", () => playerFrame.replaceChildren());

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && player.open) closePlayer();
});

render();
