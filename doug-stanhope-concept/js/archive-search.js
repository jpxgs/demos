/*
 * Filters past-date rows by year, city, venue, or other visible text.
 */
(() => {
  "use strict";

  function filterArchive() {
    const search = document.querySelector("#q");
    const count = document.querySelector("#count");
    const years = [...document.querySelectorAll(".archive-year")];
    if (!search || !count) return;
    const term = search.value.trim().toLocaleLowerCase();
    let visibleEntries = 0;

    years.forEach((year) => {
      const yearLabel = year.dataset.year || "";
      let yearMatches = 0;
      year.querySelectorAll(".entry").forEach((entry) => {
        const matches = term.length === 0 ||
          yearLabel.includes(term) ||
          entry.textContent.toLocaleLowerCase().includes(term);
        entry.hidden = !matches;
        if (matches) yearMatches += 1;
      });
      year.hidden = yearMatches === 0;
      visibleEntries += yearMatches;
    });

    count.textContent = visibleEntries + (visibleEntries === 1 ? " entry" : " entries");
  }

  function bind() {
    const search = document.querySelector("#q");
    const count = document.querySelector("#count");
    if (!search || !count) return;
    if (!search._archiveBound) {
      search._archiveBound = true;
      search.addEventListener("input", filterArchive);
    }
    filterArchive();
  }

  if (typeof document.addEventListener === "function") {
    document.addEventListener("archive:ready", bind);
  }
  bind();
})();
