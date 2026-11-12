const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");

const shots = path.join(__dirname, "..", "..", "test-results", "screenshots");

async function openHome(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const missing = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location().url || "";
    const text = message.text();
    if (location.includes("omny.fm")) return;
    // The static preview server does not run the signup function. Missing
    // page assets are still reported through the response listener.
    if (text.includes("/api/subscribe") || text.includes("status of 404")) return;
    consoleErrors.push(text);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname !== "127.0.0.1") return;
    if (url.pathname.startsWith("/api/")) return;
    if (response.status() >= 400) missing.push(url.pathname + " " + response.status());
  });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Apple Podcasts", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2026" })).toBeVisible();
  return { consoleErrors, pageErrors, missing };
}

test("homepage structure, dates, podcast, and metadata", async ({ page }, testInfo) => {
  const problems = await openHome(page);
  await expect(page).toHaveTitle("Doug Stanhope");
  const site = await page.evaluate(async () => (await fetch("data/site.json")).json());
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", site.siteUrl.replace(/\/$/, "") + "/");
  const ids = await page.locator("main > section").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(ids).toEqual(["dates", "podcast", "list", "bio", "work", "press", "archive"]);
  await expect(page.locator("#upcoming-shows")).toContainText("No dates announced");
  await expect(page.locator("#upcoming-shows a")).toHaveAttribute("href", "#list");
  await expect(page.locator('script#event-jsonld')).toHaveCount(0);
  const profile = JSON.parse(await page.locator("script#profile-jsonld").textContent());
  expect(profile["@graph"][0]["@type"]).toBe("Person");
  expect(profile["@graph"].some((item) => item["@type"] === "Event")).toBe(false);
  await expect(page.getByRole("link", { name: "Patreon" })).toHaveAttribute("href", "https://www.patreon.com/stanhopepodcast");
  await expect(page.getByRole("link", { name: /Doug's Mailbag/ })).toBeVisible();
  await expect(page.locator("#work")).toContainText("Discount Meat");
  const bodyFont = await page.locator("body").evaluate((node) => getComputedStyle(node).fontFamily);
  const labelFont = await page.locator("#dates h2").evaluate((node) => getComputedStyle(node).fontFamily);
  expect(bodyFont).toContain("IBM Plex Sans");
  expect(labelFont).toContain("IBM Plex Mono");
  await expect(page.locator("#bio")).toContainText("Approved headshots have not been added yet");
  await expect(page.locator("#bio img")).toHaveCount(0);
  await expect(page.locator("#press")).toContainText("Los Angeles Times");
  await expect(page.locator("#signup-region")).toHaveAttribute("name", "REGION");
  if (site.signupMode === "off") {
    await expect(page.locator("#mailing-list-form")).toBeHidden();
    await expect(page.locator("#signup-off")).toBeVisible();
  } else {
    await expect(page.locator("#mailing-list-form")).toBeVisible();
    await expect(page.locator("#signup-off")).toBeHidden();
  }
  if (site.signupMode === "live") {
    await expect(page.locator("#mailing-list-form")).toHaveAttribute("action", /list-manage\.com\/subscribe\/post/);
  } else {
    await expect(page.locator("#mailing-list-form")).toHaveAttribute("action", "#list");
  }
  await expect(page.locator("#footer")).toContainText("Contact and booking");
  await expect(page.locator("#footer")).toContainText("Instagram");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  fs.mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: path.join(shots, testInfo.project.name + "-dates.png") });
  await page.locator("#podcast").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shots, testInfo.project.name + "-podcast.png") });
  await page.locator("#list").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shots, testInfo.project.name + "-list.png") });
  await page.locator("#bio").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shots, testInfo.project.name + "-bio.png") });
  expect(problems.consoleErrors).toEqual([]);
  expect(problems.pageErrors).toEqual([]);
  expect(problems.missing).toEqual([]);
});

test("keyboard navigation reaches the section links", async ({ page }) => {
  await page.goto("/");
  const names = ["Skip to dates", "Doug Stanhope", "Dates", "Podcast", "List", "Bio", "Work", "Press", "Archive"];
  for (const name of names) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#archive$/);
});

test("day and night themes follow the system, then the saved choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  const problems = await openHome(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(page.locator("[data-theme-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".theme-state")).toHaveText("Night theme on. Switch to day.");
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => localStorage.removeItem("theme"));
  await page.reload();
  await expect(page.getByRole("link", { name: "Apple Podcasts", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator("[data-theme-toggle]")).toHaveAttribute("aria-pressed", "false");
  await page.locator("[data-theme-toggle]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("night");
  for (const theme of ["night", "day"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
      await page.locator("[data-theme-toggle]").click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
  expect(problems.consoleErrors).toEqual([]);
  expect(problems.pageErrors).toEqual([]);
  expect(problems.missing).toEqual([]);
});

test("preview mode shows the form and does not post", async ({ page }) => {
  const site = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "site.json"), "utf8"));
  await page.route("**/data/site.json", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ ...site, signupMode: "preview" })
  }));
  const posted = [];
  page.on("request", (request) => {
    if (request.url().includes("list-manage.com")) posted.push(request.url());
  });
  await openHome(page);
  await expect(page.locator("#mailing-list-form")).toBeVisible();
  await page.locator("#signup-email").fill("preview-check@example.com");
  await page.locator("#signup-region").selectOption("Europe");
  await page.locator("#signup-consent").check();
  await page.locator("#mailing-list-form button[type='submit']").click();
  await expect(page.locator("#signup-status")).toHaveText("Preview copy: signup is not sent. On the live site this goes to the mailing list.");
  expect(posted).toEqual([]);
});

test("accessibility scan", async ({ page }) => {
  await openHome(page);
  const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("old paths and the signup fields are present", async ({ page }) => {
  await openHome(page);
  const response = await page.request.get("/podcast/");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("noindex");
  expect(body).not.toContain("patreon.com/dougstanhope");
  expect(body).toContain("/#podcast");
  const regions = await page.locator("#signup-region option").evaluateAll((options) => options.map((option) => option.value).filter(Boolean));
  expect(regions).toEqual([
    "North America",
    "UK and Ireland",
    "Europe",
    "Australia and New Zealand",
    "Asia",
    "Other"
  ]);
  const valid = await page.locator("#mailing-list-form").evaluate((form) => {
    form.querySelector("#signup-email").value = "not-an-email";
    return form.reportValidity();
  });
  expect(valid).toBe(false);
});
