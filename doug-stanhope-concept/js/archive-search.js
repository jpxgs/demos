/*
 * Doug Stanhope website — live archive search
 * -------------------------------------------
 * Filters the static tour-history entries by year, city, venue or text.
 * The search is progressive enhancement: the archive remains readable
 * when JavaScript is unavailable.
 */

(() => {
  "use strict";

  const search = document.querySelector("#q");
  const count = document.querySelector("#count");
  const years = [...document.querySelectorAll(".archive-year")];

  // Keep the archive usable if this script is reused on a page without it.
  if (!search || !count || years.length === 0) return;

  const filterArchive = () => {
    const term = search.value.trim().toLocaleLowerCase();
    let visibleEntries = 0;

    years.forEach((year) => {
      const yearLabel = year.dataset.year || "";
      let yearMatches = 0;

      year.querySelectorAll(".entry").forEach((entry) => {
        const matches =
          term.length === 0 ||
          yearLabel.includes(term) ||
          entry.textContent.toLocaleLowerCase().includes(term);

        entry.hidden = !matches;
        if (matches) yearMatches += 1;
      });

      year.hidden = yearMatches === 0;
      visibleEntries += yearMatches;
    });

    count.textContent = visibleEntries + (visibleEntries === 1 ? " entry" : " entries");
  };

  search.addEventListener("input", filterArchive);
  filterArchive();
})();
