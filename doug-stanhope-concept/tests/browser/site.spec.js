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
  await expect(page.getByRole("link", { name: "Apple Podcasts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2026" })).toBeVisible();
  return { consoleErrors, pageErrors, missing };
}

test("homepage structure, dates, podcast, and metadata", async ({ page }, testInfo) => {
  const problems = await openHome(page);
  await expect(page).toHaveTitle("Doug Stanhope");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://demostanhope.vercel.app/");
  const ids = await page.locator("main > section").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(ids).toEqual(["dates", "podcast", "list", "bio", "press", "archive"]);
  await expect(page.locator("#upcoming-shows")).toContainText("No dates announced");
  await expect(page.locator("#upcoming-shows a")).toHaveAttribute("href", "#list");
  await expect(page.locator('script#event-jsonld')).toHaveCount(0);
  const profile = JSON.parse(await page.locator("script#profile-jsonld").textContent());
  expect(profile["@graph"][0]["@type"]).toBe("Person");
  expect(profile["@graph"].some((item) => item["@type"] === "Event")).toBe(false);
  await expect(page.getByRole("link", { name: "Patreon" })).toHaveAttribute("href", "https://www.patreon.com/stanhopepodcast");
  await expect(page.locator("#podcast iframe")).toBeVisible();
  const box = await page.locator("#podcast iframe").boundingBox();
  expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await expect(page.locator("#bio")).toContainText("Approved headshots have not been added yet");
  await expect(page.locator("#bio img")).toHaveCount(0);
  await expect(page.locator("#press")).toContainText("Los Angeles Times");
  await expect(page.locator("#signup-fallback")).toBeVisible();
  await expect(page.locator("#mailing-list-form")).toBeHidden();
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
  const names = ["Skip to dates", "Doug Stanhope", "Dates", "Podcast", "List", "Bio", "Press", "Archive"];
  for (const name of names) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#archive$/);
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
  await page.locator("#mailing-list-form").evaluate((form) => { form.hidden = false; });
  await page.locator("#signup-email").fill("not-an-email");
  const valid = await page.locator("#mailing-list-form").evaluate((form) => form.reportValidity());
  expect(valid).toBe(false);
});
